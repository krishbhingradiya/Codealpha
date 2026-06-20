const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { isAuthenticated } = require('../middlewares/auth');

router.get('/notifications', isAuthenticated, notificationController.showNotifications);
router.post('/notifications/:id/read', isAuthenticated, notificationController.markAsRead);
router.post('/notifications/read-all', isAuthenticated, notificationController.markAllAsRead);

module.exports = router;
