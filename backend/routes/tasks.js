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

// GET /api/tasks/dashboard
router.get('/dashboard', protect, getDashboardStats);

// GET /api/tasks/my-tasks
router.get('/my-tasks', protect, getMyTasks);          // was 'tasks/my-tasks' — missing leading slash too

// GET /api/tasks/project/:projectId
router.get('/project/:projectId', protect, getProjectTasks);

// GET /api/tasks/:id
router.get('/:id', protect, getTask);

// POST /api/tasks
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

// PUT /api/tasks/:id
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

// DELETE /api/tasks/:id
router.delete('/:id', protect, deleteTask);

module.exports = router;