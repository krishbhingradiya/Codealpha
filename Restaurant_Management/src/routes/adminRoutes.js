const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAuthenticated } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/roleGuard');

router.get('/', isAuthenticated, requireRole('admin'), adminController.showDashboard);
router.get('/users', isAuthenticated, requireRole('admin'), adminController.showUsers);
router.post('/users/:id/role', isAuthenticated, requireRole('admin'), adminController.updateRole);
router.post('/users/:id/delete', isAuthenticated, requireRole('admin'), adminController.deleteUser);
router.get('/activity-logs', isAuthenticated, requireRole('admin'), adminController.showActivityLogs);
router.get('/coupons', isAuthenticated, requireRole('admin'), adminController.showCoupons);
router.post('/coupons', isAuthenticated, requireRole('admin'), adminController.createCoupon);
router.post('/coupons/:id/toggle', isAuthenticated, requireRole('admin'), adminController.toggleCoupon);

module.exports = router;
