const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getProjectTasks,
  getMyTasks,
  getDashboardStats,
  getTask,
  createTask,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');

router.get('/', protect, getAllTasks);
// @route   GET /api/tasks/dashboard
// @desc    Get dashboard stats
// @access  Private
// NOTE: This must come BEFORE /:id route to avoid conflicts
router.get('/stats/dashboard', protect, getDashboardStats);

// @route   GET /api/tasks/my-tasks
// @desc    Get my assigned tasks
// @access  Private
router.get('/my-tasks', protect, getMyTasks);

// @route   GET /api/tasks/project/:projectId
// @desc    Get all tasks for a specific project
// @access  Private (project member)
router.get('/project/:projectId', protect, getProjectTasks);

// @route   GET /api/tasks/:id
// @desc    Get single task
// @access  Private (project member)
router.get('/:id', protect, getTask);

// @route   POST /api/tasks
// @desc    Create new task
// @access  Private (project member)
router.post(
  '/',
  protect,
  [
    body('title').trim().notEmpty().isLength({ min: 2, max: 150 }),
    body('description').optional().trim().isLength({ max: 1000 }),
    body('project').notEmpty().withMessage('Project is required'),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('status').optional().isIn(['todo', 'in-progress', 'review', 'done']),
    body('dueDate').optional().isISO8601(),
    body('assignedTo').optional(),
    body('tags').optional().isArray(),
  ],
  createTask
);

// @route   PUT /api/tasks/:id
// @desc    Update task
// @access  Private (assignee or project admin)
router.put(
  '/:id',
  protect,
  [
    body('title').optional().trim().isLength({ min: 2, max: 150 }),
    body('description').optional().trim().isLength({ max: 1000 }),
    body('status').optional().isIn(['todo', 'in-progress', 'review', 'done']),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('dueDate').optional().isISO8601(),
    body('assignedTo').optional(),
    body('tags').optional().isArray(),
  ],
  updateTask
);

// @route   DELETE /api/tasks/:id
// @desc    Delete task
// @access  Admin / Project Admin
router.delete('/:id', protect, deleteTask);

module.exports = router;