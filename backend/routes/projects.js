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

// GET /api/projects
router.get('/', protect, getProjects);

// GET /api/projects/:id
router.get('/:id', protect, getProject);

// POST /api/projects — Admin only
router.post(
  '/',
  protect,
  requireRole('admin'),
  [
    body('title')
      .trim()
      .notEmpty().withMessage('Title is required')
      .isLength({ min: 2, max: 100 }).withMessage('Title must be 2–100 characters'),
    body('description')
      .optional({ nullable: true, checkFalsy: true })
      .trim()
      .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
    body('deadline')
      .optional({ nullable: true, checkFalsy: true })
      .isISO8601().withMessage('Deadline must be a valid date'),
    body('color')
      .optional({ nullable: true, checkFalsy: true })
      .trim(),
  ],
  createProject
);

// PUT /api/projects/:id
router.put(
  '/:id',
  protect,
  [
    body('title')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 }).withMessage('Title must be 2–100 characters'),
    body('description')
      .optional({ nullable: true, checkFalsy: true })
      .trim()
      .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
    body('status')
      .optional()
      .isIn(['active', 'on-hold', 'completed', 'archived']).withMessage('Invalid status'),
    body('deadline')
      .optional({ nullable: true, checkFalsy: true })
      .isISO8601().withMessage('Deadline must be a valid date'),
    body('color')
      .optional({ nullable: true, checkFalsy: true })
      .trim(),
  ],
  updateProject
);

// DELETE /api/projects/:id
router.delete('/:id', protect, deleteProject);

// POST /api/projects/:id/members
router.post('/:id/members', protect, addMember);

// DELETE /api/projects/:id/members/:userId
router.delete('/:id/members/:userId', protect, removeMember);

module.exports = router;