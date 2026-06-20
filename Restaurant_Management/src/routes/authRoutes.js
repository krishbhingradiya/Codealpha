const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Web routes
router.get('/auth/login', authController.showLogin);
router.get('/auth/register', authController.showRegister);
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/logout', authController.logout);

module.exports = router;
