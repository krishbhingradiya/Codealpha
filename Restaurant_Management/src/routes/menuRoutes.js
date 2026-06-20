const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const { isAuthenticated } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/roleGuard');

// Public routes
router.get('/', menuController.showMenu);
router.get('/menu', menuController.showMenu);
router.get('/menu/:id', menuController.showItem);

// Manager routes
router.get('/manager/menu', isAuthenticated, requireRole('manager', 'admin'), menuController.showManageMenu);
router.post('/manager/menu', isAuthenticated, requireRole('manager', 'admin'), menuController.createItem);
router.post('/manager/menu/:id/update', isAuthenticated, requireRole('manager', 'admin'), menuController.updateItem);
router.post('/manager/menu/:id/delete', isAuthenticated, requireRole('manager', 'admin'), menuController.deleteItem);
router.post('/manager/menu/:id/toggle', isAuthenticated, requireRole('manager', 'admin'), menuController.toggleAvailability);
router.post('/manager/categories', isAuthenticated, requireRole('manager', 'admin'), menuController.createCategory);
router.post('/manager/categories/:id/delete', isAuthenticated, requireRole('manager', 'admin'), menuController.deleteCategory);

module.exports = router;
