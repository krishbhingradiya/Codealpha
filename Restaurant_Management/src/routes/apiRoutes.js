const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const menuController = require('../controllers/menuController');
const orderController = require('../controllers/orderController');
const tableController = require('../controllers/tableController');
const reservationController = require('../controllers/reservationController');
const inventoryController = require('../controllers/inventoryController');
const dashboardController = require('../controllers/dashboardController');
const adminController = require('../controllers/adminController');
const reportController = require('../controllers/reportController');
const notificationController = require('../controllers/notificationController');
const couponController = require('../controllers/couponController');
const { isAuthenticated } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/roleGuard');

// Auth APIs
router.post('/auth/register', authController.apiRegister);
router.post('/auth/login', authController.apiLogin);

// Menu APIs (public)
router.get('/menu', menuController.apiGetAll);
router.get('/menu/:id', menuController.apiGetOne);
router.get('/categories', menuController.apiGetCategories);

// Order APIs
router.post('/orders', isAuthenticated, orderController.placeOrder);
router.get('/orders', isAuthenticated, orderController.apiGetAll);
router.get('/orders/:id', isAuthenticated, orderController.showOrderDetail);
router.put('/orders/:id/status', isAuthenticated, requireRole('manager', 'admin'), orderController.updateStatus);

// Coupon APIs
router.get('/coupons/welcome-check', couponController.checkWelcomePopup);
router.post('/coupons/validate', isAuthenticated, requireRole('customer'), couponController.validateCouponCode);

// Table APIs
router.get('/tables', tableController.apiGetAll);
router.get('/tables/available', tableController.apiGetAvailable);

// Reservation APIs
router.post('/reservations', isAuthenticated, reservationController.createReservation);
router.get('/reservations', isAuthenticated, reservationController.apiGetAll);
router.put('/reservations/:id/status', isAuthenticated, requireRole('manager', 'admin'), reservationController.updateStatus);

// Inventory APIs
router.get('/inventory', isAuthenticated, requireRole('manager', 'admin'), inventoryController.apiGetAll);
router.get('/inventory/low-stock', isAuthenticated, requireRole('manager', 'admin'), inventoryController.apiGetLowStock);

// Dashboard API
router.get('/dashboard/stats', isAuthenticated, requireRole('manager', 'admin'), dashboardController.apiGetStats);

// Admin APIs
router.get('/admin/users', isAuthenticated, requireRole('admin'), adminController.apiGetUsers);

// Report APIs
router.get('/reports/sales', isAuthenticated, requireRole('admin', 'manager'), reportController.apiSalesReport);
router.get('/reports/top-items', isAuthenticated, requireRole('admin', 'manager'), reportController.apiTopItems);

// Notification APIs
router.get('/notifications', isAuthenticated, notificationController.apiGetNotifications);
router.get('/notifications/unread-count', isAuthenticated, notificationController.apiGetUnreadCount);
router.put('/notifications/:id/read', isAuthenticated, notificationController.markAsRead);

module.exports = router;
