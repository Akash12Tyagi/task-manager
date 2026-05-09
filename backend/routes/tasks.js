const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

// Helper: check if user has access to a project
const hasProjectAccess = async (projectId, userId, userRole) => {
  const project = await Project.findById(projectId);
  if (!project) return { access: false, project: null };
  if (userRole === 'admin') return { access: true, project };
  const isOwner = project.owner.toString() === userId.toString();
  const isMember = project.members.some((m) => m.user.toString() === userId.toString());
  return { access: isOwner || isMember, project };
};

// @route   GET /api/tasks
// @desc    Get tasks (with filters: project, status, assignedTo, priority)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { project, status, priority, assignedTo, overdue, search, page = 1, limit = 20 } = req.query;

    let query = {};

    if (project) {
      const { access } = await hasProjectAccess(project, req.user._id, req.user.role);
      if (!access) return res.status(403).json({ message: 'Access denied to this project' });
      query.project = project;
    } else if (req.user.role !== 'admin') {
      // Get tasks from user's projects only
      const userProjects = await Project.find({
        $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
      }).select('_id');
      const projectIds = userProjects.map((p) => p._id);
      query.project = { $in: projectIds };
    }

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignedTo === 'me') query.assignedTo = req.user._id;
    else if (assignedTo) query.assignedTo = assignedTo;
    if (overdue === 'true') {
      query.dueDate = { $lt: new Date() };
      query.status = { $ne: 'done' };
    }
    if (search) query.title = { $regex: search, $options: 'i' };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Task.countDocuments(query);

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'name status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      tasks,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error fetching tasks' });
  }
});

// @route   POST /api/tasks
// @desc    Create a new task
// @access  Private (project member)
router.post(
  '/',
  protect,
  [
    body('title').trim().isLength({ min: 2, max: 200 }).withMessage('Title must be 2-200 characters'),
    body('project').notEmpty().withMessage('Project ID is required'),
    body('status').optional().isIn(['todo', 'in-progress', 'review', 'done']),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
    body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array(), message: errors.array()[0].msg });
    }

    try {
      const { title, description, project, assignedTo, status, priority, dueDate, tags } = req.body;

      const { access } = await hasProjectAccess(project, req.user._id, req.user.role);
      if (!access) return res.status(403).json({ message: 'You must be a project member to create tasks' });

      const task = await Task.create({
        title,
        description,
        project,
        assignedTo: assignedTo || null,
        createdBy: req.user._id,
        status: status || 'todo',
        priority: priority || 'medium',
        dueDate,
        tags: tags || [],
      });

      await task.populate('assignedTo', 'name email');
      await task.populate('createdBy', 'name email');
      await task.populate('project', 'name');

      res.status(201).json({ message: 'Task created successfully', task });
    } catch (error) {
      console.error('Create task error:', error);
      res.status(500).json({ message: 'Server error creating task' });
    }
  }
);

// @route   GET /api/tasks/:id
// @desc    Get single task
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'name status owner members')
      .populate('comments.user', 'name email');

    if (!task) return res.status(404).json({ message: 'Task not found' });

    const { access } = await hasProjectAccess(task.project._id, req.user._id, req.user.role);
    if (!access) return res.status(403).json({ message: 'Access denied' });

    res.json({ task });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching task' });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update task
// @access  Private (project member; only admins can reassign)
router.put(
  '/:id',
  protect,
  [
    body('title').optional().trim().isLength({ min: 2, max: 200 }),
    body('status').optional().isIn(['todo', 'in-progress', 'review', 'done']),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
    body('dueDate').optional().isISO8601(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array(), message: errors.array()[0].msg });
    }

    try {
      const task = await Task.findById(req.params.id).populate('project');
      if (!task) return res.status(404).json({ message: 'Task not found' });

      const { access, project } = await hasProjectAccess(task.project._id, req.user._id, req.user.role);
      if (!access) return res.status(403).json({ message: 'Access denied' });

      const allowedFields = ['title', 'description', 'status', 'priority', 'dueDate', 'tags'];
      const updates = {};
      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
      });

      // Only project admin/owner or global admin can reassign
      if (req.body.assignedTo !== undefined) {
        const isProjectAdmin = project.members.some(
          (m) => m.user.toString() === req.user._id.toString() && m.role === 'admin'
        );
        const isOwner = project.owner.toString() === req.user._id.toString();
        if (isProjectAdmin || isOwner || req.user.role === 'admin') {
          updates.assignedTo = req.body.assignedTo || null;
        }
      }

      const updatedTask = await Task.findByIdAndUpdate(
        req.params.id,
        { $set: updates },
        { new: true, runValidators: true }
      )
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email')
        .populate('project', 'name');

      res.json({ message: 'Task updated successfully', task: updatedTask });
    } catch (error) {
      res.status(500).json({ message: 'Server error updating task' });
    }
  }
);

// @route   DELETE /api/tasks/:id
// @desc    Delete task
// @access  Private (creator, project admin, or global admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await Project.findById(task.project);
    const isCreator = task.createdBy.toString() === req.user._id.toString();
    const isProjectAdmin = project?.members.some(
      (m) => m.user.toString() === req.user._id.toString() && m.role === 'admin'
    );
    const isOwner = project?.owner.toString() === req.user._id.toString();
    const isGlobalAdmin = req.user.role === 'admin';

    if (!isCreator && !isProjectAdmin && !isOwner && !isGlobalAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this task' });
    }

    await task.deleteOne();
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting task' });
  }
});

// @route   POST /api/tasks/:id/comments
// @desc    Add a comment to a task
// @access  Private (project member)
router.post('/:id/comments', protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Comment text is required' });

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const { access } = await hasProjectAccess(task.project, req.user._id, req.user.role);
    if (!access) return res.status(403).json({ message: 'Access denied' });

    task.comments.push({ user: req.user._id, text: text.trim() });
    await task.save();
    await task.populate('comments.user', 'name email');

    res.status(201).json({ message: 'Comment added', comments: task.comments });
  } catch (error) {
    res.status(500).json({ message: 'Server error adding comment' });
  }
});

// @route   GET /api/tasks/stats/dashboard
// @desc    Get dashboard stats for current user
// @access  Private
router.get('/stats/dashboard', protect, async (req, res) => {
  try {
    let projectQuery = req.user.role === 'admin'
      ? {}
      : { $or: [{ owner: req.user._id }, { 'members.user': req.user._id }] };

    const userProjects = await Project.find(projectQuery).select('_id');
    const projectIds = userProjects.map((p) => p._id);

    const taskQuery = req.user.role === 'admin' ? {} : { project: { $in: projectIds } };

    const [totalTasks, statusCounts, overdueTasks, myTasks, recentTasks] = await Promise.all([
      Task.countDocuments(taskQuery),
      Task.aggregate([
        { $match: taskQuery },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Task.countDocuments({
        ...taskQuery,
        dueDate: { $lt: new Date() },
        status: { $ne: 'done' },
      }),
      Task.countDocuments({ ...taskQuery, assignedTo: req.user._id }),
      Task.find(taskQuery)
        .populate('project', 'name')
        .populate('assignedTo', 'name')
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    const statusMap = { todo: 0, 'in-progress': 0, review: 0, done: 0 };
    statusCounts.forEach(({ _id, count }) => { statusMap[_id] = count; });

    res.json({
      stats: {
        totalProjects: userProjects.length,
        totalTasks,
        overdueTasks,
        myTasks,
        statusBreakdown: statusMap,
      },
      recentTasks,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error fetching stats' });
  }
});

module.exports = router;
