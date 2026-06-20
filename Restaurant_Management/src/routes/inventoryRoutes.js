const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { isAuthenticated } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/roleGuard');

router.get('/manager/inventory', isAuthenticated, requireRole('manager', 'admin'), inventoryController.showInventory);
router.post('/manager/inventory', isAuthenticated, requireRole('manager', 'admin'), inventoryController.createItem);
router.post('/manager/inventory/:id/update', isAuthenticated, requireRole('manager', 'admin'), inventoryController.updateItem);
router.post('/manager/inventory/:id/delete', isAuthenticated, requireRole('manager', 'admin'), inventoryController.deleteItem);

module.exports = router;
