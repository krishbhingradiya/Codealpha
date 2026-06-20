const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { isAuthenticated } = require('../middlewares/auth');

router.get('/profile', isAuthenticated, customerController.showProfile);
router.post('/profile/update', isAuthenticated, customerController.updateProfile);
router.post('/profile/password', isAuthenticated, customerController.changePassword);

module.exports = router;
