const express = require('express');
const router = express.Router();
const tableController = require('../controllers/tableController');
const { isAuthenticated } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/roleGuard');

// Manager routes
router.get('/manager/tables', isAuthenticated, requireRole('manager', 'admin'), tableController.showTables);
router.post('/manager/tables', isAuthenticated, requireRole('manager', 'admin'), tableController.createTable);
router.post('/manager/tables/:id/status', isAuthenticated, requireRole('manager', 'admin'), tableController.updateStatus);
router.post('/manager/tables/:id/delete', isAuthenticated, requireRole('manager', 'admin'), tableController.deleteTable);

module.exports = router;
