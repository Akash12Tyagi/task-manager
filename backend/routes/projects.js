const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { requireProjectAdmin, requireProjectMember } = require('../middleware/roleCheck');

// @route   GET /api/projects
// @desc    Get all projects for current user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, priority, search } = req.query;

    let query = {
      $or: [
        { owner: req.user._id },
        { 'members.user': req.user._id },
      ],
    };

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (search) query.name = { $regex: search, $options: 'i' };

    // Global admins see all projects
    if (req.user.role === 'admin') {
      query = {};
      if (status) query.status = status;
      if (priority) query.priority = priority;
      if (search) query.name = { $regex: search, $options: 'i' };
    }

    const projects = await Project.find(query)
      .populate('owner', 'name email')
      .populate('members.user', 'name email role')
      .sort({ createdAt: -1 });

    // Attach task counts
    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        const taskCounts = await Task.aggregate([
          { $match: { project: project._id } },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]);
        const counts = { todo: 0, 'in-progress': 0, review: 0, done: 0, total: 0 };
        taskCounts.forEach(({ _id, count }) => {
          counts[_id] = count;
          counts.total += count;
        });
        return { ...project.toJSON(), taskCounts: counts };
      })
    );

    res.json({ projects: projectsWithCounts, total: projectsWithCounts.length });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Server error fetching projects' });
  }
});

// @route   POST /api/projects
// @desc    Create a new project
// @access  Private
router.post(
  '/',
  protect,
  [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('description').optional().trim().isLength({ max: 500 }),
    body('status').optional().isIn(['planning', 'active', 'on-hold', 'completed']),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array(), message: errors.array()[0].msg });
    }

    try {
      const { name, description, status, priority, dueDate, tags } = req.body;

      const project = await Project.create({
        name,
        description,
        status: status || 'planning',
        priority: priority || 'medium',
        dueDate,
        tags: tags || [],
        owner: req.user._id,
        members: [{ user: req.user._id, role: 'admin' }],
      });

      await project.populate('owner', 'name email');
      await project.populate('members.user', 'name email role');

      res.status(201).json({ message: 'Project created successfully', project });
    } catch (error) {
      console.error('Create project error:', error);
      res.status(500).json({ message: 'Server error creating project' });
    }
  }
);

// @route   GET /api/projects/:id
// @desc    Get single project with tasks
// @access  Private (member)
router.get('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email role');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check access
    const isOwner = project.owner._id.toString() === req.user._id.toString();
    const isMember = project.members.some((m) => m.user._id.toString() === req.user._id.toString());
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isMember && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const tasks = await Task.find({ project: project._id })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ project, tasks });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching project' });
  }
});

// @route   PUT /api/projects/:id
// @desc    Update project
// @access  Private (project admin or owner)
router.put(
  '/:id',
  protect,
  requireProjectAdmin,
  [
    body('name').optional().trim().isLength({ min: 2, max: 100 }),
    body('status').optional().isIn(['planning', 'active', 'on-hold', 'completed']),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('dueDate').optional().isISO8601(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array(), message: errors.array()[0].msg });
    }

    try {
      const allowedFields = ['name', 'description', 'status', 'priority', 'dueDate', 'tags'];
      const updates = {};
      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
      });

      const project = await Project.findByIdAndUpdate(
        req.params.id,
        { $set: updates },
        { new: true, runValidators: true }
      )
        .populate('owner', 'name email')
        .populate('members.user', 'name email role');

      res.json({ message: 'Project updated successfully', project });
    } catch (error) {
      res.status(500).json({ message: 'Server error updating project' });
    }
  }
);

// @route   DELETE /api/projects/:id
// @desc    Delete project + all tasks
// @access  Private (project owner or global admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const isOwner = project.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Only project owner or admin can delete this project' });
    }

    await Task.deleteMany({ project: project._id });
    await project.deleteOne();

    res.json({ message: 'Project and all associated tasks deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting project' });
  }
});

// @route   POST /api/projects/:id/members
// @desc    Add member to project
// @access  Private (project admin)
router.post('/:id/members', protect, requireProjectAdmin, async (req, res) => {
  try {
    const { userId, role } = req.body;

    if (!userId) return res.status(400).json({ message: 'User ID is required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const project = req.project;

    const alreadyMember = project.members.some(
      (m) => m.user.toString() === userId
    );
    if (alreadyMember) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    project.members.push({ user: userId, role: role || 'member' });
    await project.save();
    await project.populate('members.user', 'name email role');

    res.json({ message: 'Member added successfully', project });
  } catch (error) {
    res.status(500).json({ message: 'Server error adding member' });
  }
});

// @route   DELETE /api/projects/:id/members/:userId
// @desc    Remove member from project
// @access  Private (project admin)
router.delete('/:id/members/:userId', protect, requireProjectAdmin, async (req, res) => {
  try {
    const project = req.project;
    const isOwner = project.owner.toString() === req.params.userId;

    if (isOwner) {
      return res.status(400).json({ message: 'Cannot remove project owner' });
    }

    project.members = project.members.filter(
      (m) => m.user.toString() !== req.params.userId
    );
    await project.save();

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error removing member' });
  }
});

module.exports = router;
