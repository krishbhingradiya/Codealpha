const inventoryService = require('../services/inventoryService');
const { logActivity } = require('../services/notificationService');

class InventoryController {
  // MANAGER: Show inventory page
  async showInventory(req, res) {
    try {
      const items = await inventoryService.getAllItems();
      const lowStockItems = await inventoryService.getLowStockItems();
      
      res.render('manager/inventory', {
        title: 'Inventory Management',
        items,
        lowStockItems,
        layout: 'layouts/main'
      });
    } catch (err) {
      req.flash('error', 'Failed to load inventory');
      res.redirect('/manager');
    }
  }

  // MANAGER: Add inventory item
  async createItem(req, res) {
    try {
      const { item_name, quantity, unit, minimum_stock } = req.body;
      await inventoryService.createItem({ item_name, quantity, unit, minimum_stock });

      if (req.session.user) {
        await logActivity(req.session.user.id, `Added inventory: ${item_name}`);
      }

      req.flash('success', 'Inventory item added');
      res.redirect('/manager/inventory');
    } catch (err) {
      req.flash('error', err.message || 'Failed to add inventory item');
      res.redirect('/manager/inventory');
    }
  }

  // MANAGER: Update inventory item
  async updateItem(req, res) {
    try {
      const { item_name, quantity, unit, minimum_stock } = req.body;
      await inventoryService.updateItem(req.params.id, { item_name, quantity, unit, minimum_stock });

      if (req.session.user) {
        await logActivity(req.session.user.id, `Updated inventory: ${item_name}`);
      }

      if (req.path.startsWith('/api/')) {
        return res.json({ success: true });
      }

      req.flash('success', 'Inventory updated');
      res.redirect('/manager/inventory');
    } catch (err) {
      if (req.path.startsWith('/api/')) {
        return res.status(400).json({ error: err.message });
      }
      req.flash('error', err.message || 'Failed to update inventory');
      res.redirect('/manager/inventory');
    }
  }

  // MANAGER: Delete inventory item
  async deleteItem(req, res) {
    try {
      await inventoryService.deleteItem(req.params.id);
      
      req.flash('success', 'Inventory item deleted');
      res.redirect('/manager/inventory');
    } catch (err) {
      req.flash('error', 'Failed to delete inventory item');
      res.redirect('/manager/inventory');
    }
  }

  // API: Get all inventory
  async apiGetAll(req, res) {
    try {
      const items = await inventoryService.getAllItems();
      res.json(items);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // API: Get low stock
  async apiGetLowStock(req, res) {
    try {
      const items = await inventoryService.getLowStockItems();
      res.json(items);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new InventoryController();
