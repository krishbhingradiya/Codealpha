const express = require('express');
const router = express.Router();
const managerController = require('../controllers/managerController');
const { isAuthenticated } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/roleGuard');

// All manager routes require manager or admin role
router.use(isAuthenticated, requireRole('manager', 'admin'));

// Dashboard
router.get('/dashboard', managerController.showDashboard);

// Orders management
router.get('/orders', managerController.showOrders);
router.post('/orders/:orderId/status', managerController.updateOrderStatus);

// Reservations management
router.get('/reservations', managerController.showReservations);
router.post('/reservations/:reservationId/status', managerController.updateReservationStatus);

// Menu management
router.get('/menu', managerController.showMenu);

// Table management
router.get('/tables', managerController.showTables);

// Inventory management
router.get('/inventory', managerController.showInventory);

// Analytics
router.get('/analytics', managerController.showAnalytics);

module.exports = router;
