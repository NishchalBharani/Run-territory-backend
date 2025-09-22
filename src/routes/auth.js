const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');

// Register
router.post(
  '/register',
  [
    body('name').notEmpty(),
    body('phone').notEmpty().isMobilePhone('en-IN'),
    body('password').isLength({ min: 6 }),
  ],
  authController.register
);

// Login
router.post(
  '/login',
  [
    body('phone').notEmpty().isMobilePhone('en-IN'),
    body('password').notEmpty()
  ],
  authController.login
);

module.exports = router;
