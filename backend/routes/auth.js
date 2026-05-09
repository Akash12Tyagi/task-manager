const express = require('express');
const { body }  = require('express-validator');
const router    = express.Router();
const { protect } = require('../middleware/auth');
const { register, login, getMe, getAllUsers } = require('../controllers/authController');

router.post('/register',
  [
    body('name').trim().notEmpty().isLength({ min: 2, max: 50 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('role').optional().isIn(['admin', 'member']),
  ],
  register
);

router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  login
);

router.get('/me',    protect, getMe);
router.get('/users', protect, getAllUsers);

module.exports = router;
