const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { isAuthenticated } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/roleGuard');

router.get('/', isAuthenticated, requireRole('manager', 'admin'), dashboardController.showDashboard);

module.exports = router;
