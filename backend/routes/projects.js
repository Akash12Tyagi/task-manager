const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
} = require('../controllers/projectController');

// @route   GET /api/projects
// @desc    Get all projects for current user
// @access  Private
router.get('/', protect, getProjects);

// @route   GET /api/projects/:id
// @desc    Get single project with stats
// @access  Private (project member)
router.get('/:id', protect, getProject);

// @route   POST /api/projects
// @desc    Create new project
// @access  Admin only
router.post(
  '/',
  protect,
  requireRole('admin'),
  [
    body('title').trim().notEmpty().isLength({ min: 2, max: 100 }),
    body('description').optional().trim().isLength({ max: 500 }),
    body('deadline').optional().isISO8601(),
    body('color').optional().trim(),
  ],
  createProject
);

// @route   PUT /api/projects/:id
// @desc    Update project
// @access  Admin / Project Admin
router.put(
  '/:id',
  protect,
  [
    body('title').optional().trim().isLength({ min: 2, max: 100 }),
    body('description').optional().trim().isLength({ max: 500 }),
    body('status').optional().isIn(['active', 'on-hold', 'completed', 'archived']),
    body('deadline').optional().isISO8601(),
    body('color').optional().trim(),
  ],
  updateProject
);

// @route   DELETE /api/projects/:id
// @desc    Delete project and all its tasks
// @access  Admin / Project Admin
router.delete('/:id', protect, deleteProject);

// @route   POST /api/projects/:id/members
// @desc    Add member to project
// @access  Admin / Project Admin
router.post('/:id/members', protect, addMember);

// @route   DELETE /api/projects/:id/members/:userId
// @desc    Remove member from project
// @access  Admin / Project Admin
router.delete('/:id/members/:userId', protect, removeMember);

module.exports = router;