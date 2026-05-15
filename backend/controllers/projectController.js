const { validationResult } = require('express-validator');
const Project = require('../models/Project');
const Task    = require('../models/Task');
const User    = require('../models/User');

// @desc    Get all projects for current user
// @route   GET /api/projects
// @access  Private
exports.getProjects = async (req, res, next) => {
  try {
    const query = req.user.role === 'admin'
      ? {}
      : { 'members.user': req.user._id };

    const projects = await Project.find(query)
      .populate('admin', 'name email')
      .populate('members.user', 'name email role')
      .sort('-createdAt');

    res.json({ success: true, count: projects.length, projects });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private (member of project or admin)
exports.getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('admin', 'name email')
      .populate('members.user', 'name email role');

    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const isMember = project.members.some(m => m.user._id.toString() === req.user._id.toString());
    if (!isMember && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const tasks = await Task.find({ project: project._id });
    const now = new Date();
    const stats = {
      total:      tasks.length,
      todo:       tasks.filter(t => t.status === 'todo').length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      review:     tasks.filter(t => t.status === 'review').length,
      done:       tasks.filter(t => t.status === 'done').length,
      overdue:    tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done').length,
    };

    res.json({ success: true, project, stats });
  } catch (err) {
    next(err);
  }
};

// @desc    Create project
// @route   POST /api/projects
// @access  Admin only
exports.createProject = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { title, description, deadline, color } = req.body;

    const project = await Project.create({
      title,
      description: description || '',
      deadline:    deadline    || null,
      color:       color       || '#6366f1',
      admin: req.user._id,
    });

    await project.populate('admin', 'name email');
    await project.populate('members.user', 'name email role');

    res.status(201).json({ success: true, project });
  } catch (err) {
    next(err);
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Admin / Project Admin
exports.updateProject = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const isProjectAdmin = project.admin.toString() === req.user._id.toString();
    if (!isProjectAdmin && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only project admin can update' });
    }

    const { title, description, status, deadline, color } = req.body;
    if (title)                     project.title       = title;
    if (description !== undefined) project.description = description;
    if (status)                    project.status      = status;
    if (deadline !== undefined)    project.deadline    = deadline;
    if (color)                     project.color       = color;

    await project.save();
    await project.populate('admin', 'name email');
    await project.populate('members.user', 'name email role');

    res.json({ success: true, project });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete project (also deletes all tasks)
// @route   DELETE /api/projects/:id
// @access  Admin / Project Admin
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const isProjectAdmin = project.admin.toString() === req.user._id.toString();
    if (!isProjectAdmin && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only project admin can delete' });
    }

    await Task.deleteMany({ project: project._id });
    await project.deleteOne();

    res.json({ success: true, message: 'Project and all its tasks deleted' });
  } catch (err) {
    next(err);
  }
};

// @desc    Add member to project
// @route   POST /api/projects/:id/members
// @access  Admin / Project Admin
exports.addMember = async (req, res, next) => {
  try {
    const { userId, role } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const isProjectAdmin = project.admin.toString() === req.user._id.toString();
    if (!isProjectAdmin && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const alreadyMember = project.members.some(m => m.user.toString() === userId);
    if (alreadyMember) {
      return res.status(400).json({ success: false, message: 'User already a member' });
    }

    project.members.push({ user: userId, role: role || 'member' });
    await project.save();
    await project.populate('members.user', 'name email role');

    res.json({ success: true, project });
  } catch (err) {
    next(err);
  }
};

// @desc    Remove member from project
// @route   DELETE /api/projects/:id/members/:userId
// @access  Admin / Project Admin
exports.removeMember = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const isProjectAdmin = project.admin.toString() === req.user._id.toString();
    if (!isProjectAdmin && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (project.admin.toString() === req.params.userId) {
      return res.status(400).json({ success: false, message: 'Cannot remove project admin' });
    }

    project.members = project.members.filter(
      m => m.user.toString() !== req.params.userId
    );
    await project.save();
    await project.populate('members.user', 'name email role');

    res.json({ success: true, message: 'Member removed', project });
  } catch (err) {
    next(err);
  }
};