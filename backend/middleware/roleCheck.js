const Project = require('../models/Project');

// Restrict to global app roles (admin / member)
const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Role '${req.user.role}' is not authorized to perform this action`,
    });
  }
  next();
};

// Check if user is admin of a specific project
const requireProjectAdmin = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id || req.body.project);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    const isAdmin = project.admin.toString() === req.user._id.toString();
    if (!isAdmin && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only project admin can perform this action' });
    }
    req.project = project;
    next();
  } catch (err) {
    next(err);
  }
};

// Check if user is a member of the project (or admin)
const requireProjectMember = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id || req.body.project;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    const isMember = project.members.some(m => m.user.toString() === req.user._id.toString());
    const isAdmin  = project.admin.toString() === req.user._id.toString();
    if (!isMember && !isAdmin && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You are not a member of this project' });
    }
    req.project = project;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { requireRole, requireProjectAdmin, requireProjectMember };
