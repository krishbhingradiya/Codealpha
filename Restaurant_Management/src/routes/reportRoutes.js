const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { isAuthenticated } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/roleGuard');

router.get('/admin/reports', isAuthenticated, requireRole('admin', 'manager'), reportController.showReports);
router.get('/admin/reports/sales/csv', isAuthenticated, requireRole('admin', 'manager'), reportController.exportSalesCsv);
router.get('/admin/reports/inventory/csv', isAuthenticated, requireRole('admin', 'manager'), reportController.exportInventoryCsv);

module.exports = router;
