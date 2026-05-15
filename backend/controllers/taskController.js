const { validationResult } = require('express-validator');
const Task    = require('../models/Task');
const Project = require('../models/Project');

// @desc    Get tasks for a project
// @route   GET /api/tasks/project/:projectId
// @access  Private (project member)
exports.getProjectTasks = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const isMember = project.members.some(m => m.user.toString() === req.user._id.toString());
    if (!isMember && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { status, priority, assignedTo } = req.query;
    const filter = { project: req.params.projectId };
    if (status)     filter.status     = status;
    if (priority)   filter.priority   = priority;
    if (assignedTo) filter.assignedTo = assignedTo;

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort('-createdAt');

    res.json({ success: true, count: tasks.length, tasks });
  } catch (err) {
    next(err);
  }
};

// @desc    Get my assigned tasks (across all projects)
// @route   GET /api/tasks/my-tasks
// @access  Private
exports.getMyTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user._id })
      .populate('project', 'title color')
      .populate('createdBy', 'name')
      .sort('-createdAt');

    res.json({ success: true, count: tasks.length, tasks });
  } catch (err) {
    next(err);
  }
};

// @desc    Get dashboard stats
// @route   GET /api/tasks/dashboard
// @access  Private
exports.getDashboardStats = async (req, res, next) => {
  try {
    let taskQuery = req.user.role === 'admin' ? {} : { assignedTo: req.user._id };

    const [tasks, projects] = await Promise.all([
      Task.find(taskQuery).populate('project', 'title color'),
      Project.find(
        req.user.role === 'admin' ? {} : { 'members.user': req.user._id }
      ),
    ]);

    const now = new Date();
    const stats = {
      totalTasks:   tasks.length,
      todo:         tasks.filter(t => t.status === 'todo').length,
      inProgress:   tasks.filter(t => t.status === 'in-progress').length,
      review:       tasks.filter(t => t.status === 'review').length,
      done:         tasks.filter(t => t.status === 'done').length,
      overdue:      tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done').length,
      totalProjects: projects.length,
      recentTasks:  tasks.slice(0, 5),
    };

    res.json({ success: true, stats });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private (project member)
exports.getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'title members');

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const project = task.project;
    const isMember = project.members.some(m => m.user.toString() === req.user._id.toString());
    if (!isMember && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, task });
  } catch (err) {
    next(err);
  }
};

// @desc    Create task
// @route   POST /api/tasks
// @access  Private (project member)
exports.createTask = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const { title, description, project, assignedTo, priority, dueDate, tags } = req.body;

    const proj = await Project.findById(project);
    if (!proj) return res.status(404).json({ success: false, message: 'Project not found' });

    const isMember = proj.members.some(m => m.user.toString() === req.user._id.toString());
    if (!isMember && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not a member of this project' });
    }

    // Only admin/project-admin can assign to others
    const isProjectAdmin = proj.admin.toString() === req.user._id.toString();
    let finalAssignee = req.user._id;
    if (assignedTo && (isProjectAdmin || req.user.role === 'admin')) {
      finalAssignee = assignedTo;
    }

    const task = await Task.create({
      title, description, project, priority, dueDate, tags,
      assignedTo: finalAssignee,
      createdBy: req.user._id,
    });

    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');

    res.status(201).json({ success: true, task });
  } catch (err) {
    next(err);
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private (assignee can update status; admin can update all)
exports.updateTask = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const task = await Task.findById(req.params.id).populate('project', 'admin members');
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const isProjectAdmin = task.project.admin.toString() === req.user._id.toString();
    const isAssignee     = task.assignedTo && task.assignedTo.toString() === req.user._id.toString();
    const isGlobalAdmin  = req.user.role === 'admin';

    if (!isProjectAdmin && !isAssignee && !isGlobalAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this task' });
    }

    const { title, description, status, priority, dueDate, assignedTo, tags } = req.body;

    // Members can only update status of their own tasks
    if (isAssignee && !isProjectAdmin && !isGlobalAdmin) {
      if (status) task.status = status;
    } else {
      if (title)       task.title       = title;
      if (description !== undefined) task.description = description;
      if (status)      task.status      = status;
      if (priority)    task.priority    = priority;
      if (dueDate)     task.dueDate     = dueDate;
      if (assignedTo)  task.assignedTo  = assignedTo;
      if (tags)        task.tags        = tags;
    }

    await task.save();
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');

    res.json({ success: true, task });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Admin / Project Admin
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id).populate('project', 'admin');
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const isProjectAdmin = task.project.admin.toString() === req.user._id.toString();
    if (!isProjectAdmin && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admin can delete tasks' });
    }

    await task.deleteOne();
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
};
