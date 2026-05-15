const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getAllTasks,
  getProjectTasks,
  getMyTasks,
  getDashboardStats,
  getTask,
  createTask,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');

// IMPORTANT: All specific named routes must come BEFORE /:id

// GET /api/tasks/dashboard
router.get('/dashboard', protect, getDashboardStats);

// GET /api/tasks/stats/dashboard  ← what your frontend actually calls
router.get('/stats/dashboard', protect, getDashboardStats);

// GET /api/tasks/my-tasks
router.get('/my-tasks', protect, getMyTasks);

// GET /api/tasks/project/:projectId
router.get('/project/:projectId', protect, getProjectTasks);

// GET /api/tasks
router.get('/', protect, getAllTasks);

// GET /api/tasks/:id
router.get('/:id', protect, getTask);

// POST /api/tasks
router.post(
  '/',
  protect,
  [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ min: 2, max: 150 }),
    body('description').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 1000 }),
    body('project').notEmpty().withMessage('Project is required'),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('status').optional().isIn(['todo', 'in-progress', 'review', 'done']),
    body('dueDate').optional({ nullable: true, checkFalsy: true }).isISO8601(),
    body('assignedTo').optional(),
    body('tags').optional().isArray(),
  ],
  createTask
);

// PUT /api/tasks/:id
router.put(
  '/:id',
  protect,
  [
    body('title').optional().trim().isLength({ min: 2, max: 150 }),
    body('description').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 1000 }),
    body('status').optional().isIn(['todo', 'in-progress', 'review', 'done']),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('dueDate').optional({ nullable: true, checkFalsy: true }).isISO8601(),
    body('assignedTo').optional(),
    body('tags').optional().isArray(),
  ],
  updateTask
);

// DELETE /api/tasks/:id
router.delete('/:id', protect, deleteTask);

module.exports = router;