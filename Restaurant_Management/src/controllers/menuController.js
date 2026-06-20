const menuService = require('../services/menuService');
const { logActivity } = require('../services/notificationService');

class MenuController {
  // PUBLIC: Show menu page
  async showMenu(req, res) {
    try {
      const categories = await menuService.getAllCategories();
      const filters = {
        available: true,
        category_id: req.query.category || null,
        search: req.query.search || null
      };
      
      const menuItems = await menuService.getAllMenuItems(filters);
      
      res.render('customer/menu', {
        title: 'Our Menu',
        categories,
        menuItems,
        activeCategory: req.query.category || 'all',
        searchQuery: req.query.search || '',
        layout: 'layouts/main'
      });
    } catch (err) {
      console.error('Menu error:', err);
      // If tables don't exist, show setup page
      if (err.message && err.message.includes('schema cache')) {
        return res.render('setup', { layout: false });
      }
      res.render('customer/menu', {
        title: 'Our Menu',
        categories: [],
        menuItems: [],
        activeCategory: 'all',
        searchQuery: '',
        layout: 'layouts/main'
      });
    }
  }

  // PUBLIC: Show item detail
  async showItem(req, res) {
    try {
      const item = await menuService.getMenuItemById(req.params.id);
      res.render('customer/item-detail', {
        title: item.name,
        item,
        layout: 'layouts/main'
      });
    } catch (err) {
      req.flash('error', 'Item not found');
      res.redirect('/');
    }
  }

  // MANAGER: Show menu management page
  async showManageMenu(req, res) {
    try {
      const categories = await menuService.getAllCategories();
      const menuItems = await menuService.getAllMenuItems();
      
      res.render('manager/menu', {
        title: 'Manage Menu',
        categories,
        menuItems,
        layout: 'layouts/main'
      });
    } catch (err) {
      req.flash('error', 'Failed to load menu management');
      res.redirect('/manager');
    }
  }

  // MANAGER: Create menu item
  async createItem(req, res) {
    try {
      const { name, category_id, description, price, image_url, available } = req.body;
      
      await menuService.createMenuItem({
        name,
        category_id: category_id || null,
        description,
        price,
        image_url: image_url || null,
        available: available === 'on' || available === true
      });

      if (req.session.user) {
        await logActivity(req.session.user.id, `Added menu item: ${name}`);
      }

      req.flash('success', 'Menu item added successfully');
      res.redirect('/manager/menu');
    } catch (err) {
      req.flash('error', err.message || 'Failed to add menu item');
      res.redirect('/manager/menu');
    }
  }

  // MANAGER: Update menu item
  async updateItem(req, res) {
    try {
      const { name, category_id, description, price, image_url, available } = req.body;
      
      await menuService.updateMenuItem(req.params.id, {
        name,
        category_id: category_id || null,
        description,
        price,
        image_url: image_url || null,
        available: available === 'on' || available === true || available === 'true'
      });

      if (req.session.user) {
        await logActivity(req.session.user.id, `Updated menu item: ${name}`);
      }

      req.flash('success', 'Menu item updated successfully');
      res.redirect('/manager/menu');
    } catch (err) {
      req.flash('error', err.message || 'Failed to update menu item');
      res.redirect('/manager/menu');
    }
  }

  // MANAGER: Delete menu item
  async deleteItem(req, res) {
    try {
      await menuService.deleteMenuItem(req.params.id);
      
      if (req.session.user) {
        await logActivity(req.session.user.id, 'Deleted a menu item');
      }

      req.flash('success', 'Menu item deleted');
      res.redirect('/manager/menu');
    } catch (err) {
      req.flash('error', 'Failed to delete menu item');
      res.redirect('/manager/menu');
    }
  }

  // MANAGER: Toggle availability
  async toggleAvailability(req, res) {
    try {
      const item = await menuService.toggleAvailability(req.params.id);
      
      if (req.path.startsWith('/api/')) {
        return res.json({ success: true, available: item.available });
      }
      
      req.flash('success', `Item marked as ${item.available ? 'available' : 'unavailable'}`);
      res.redirect('/manager/menu');
    } catch (err) {
      if (req.path.startsWith('/api/')) {
        return res.status(400).json({ error: err.message });
      }
      req.flash('error', 'Failed to update availability');
      res.redirect('/manager/menu');
    }
  }

  // MANAGER: Create category
  async createCategory(req, res) {
    try {
      const { name, icon } = req.body;
      await menuService.createCategory(name, icon);
      
      req.flash('success', 'Category added successfully');
      res.redirect('/manager/menu');
    } catch (err) {
      req.flash('error', err.message || 'Failed to add category');
      res.redirect('/manager/menu');
    }
  }

  // MANAGER: Delete category
  async deleteCategory(req, res) {
    try {
      await menuService.deleteCategory(req.params.id);
      req.flash('success', 'Category deleted');
      res.redirect('/manager/menu');
    } catch (err) {
      req.flash('error', 'Failed to delete category');
      res.redirect('/manager/menu');
    }
  }

  // API: Get all menu items
  async apiGetAll(req, res) {
    try {
      const filters = {
        category_id: req.query.category_id,
        search: req.query.search,
        available: req.query.available !== undefined ? req.query.available === 'true' : undefined
      };
      const items = await menuService.getAllMenuItems(filters);
      res.json(items);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // API: Get single item
  async apiGetOne(req, res) {
    try {
      const item = await menuService.getMenuItemById(req.params.id);
      res.json(item);
    } catch (err) {
      res.status(404).json({ error: 'Item not found' });
    }
  }

  // API: Get categories
  async apiGetCategories(req, res) {
    try {
      const categories = await menuService.getAllCategories();
      res.json(categories);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new MenuController();
