const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { isAuthenticated } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/roleGuard');

// Customer routes (only customers can order)
router.get('/cart', orderController.showCart);
router.post('/orders', isAuthenticated, requireRole('customer'), orderController.placeOrder);
router.get('/orders/:id/track', isAuthenticated, orderController.trackOrder);
router.get('/orders/history', isAuthenticated, requireRole('customer'), orderController.showHistory);
router.get('/invoice/:orderId', isAuthenticated, orderController.showInvoice);

module.exports = router;

