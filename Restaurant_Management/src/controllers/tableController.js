const tableService = require('../services/tableService');
const { logActivity } = require('../services/notificationService');

class TableController {
  // MANAGER: Show tables page
  async showTables(req, res) {
    try {
      const tables = await tableService.getAllTables();
      const stats = await tableService.getOccupancyStats();
      
      res.render('manager/tables', {
        title: 'Manage Tables',
        tables,
        stats,
        layout: 'layouts/main'
      });
    } catch (err) {
      req.flash('error', 'Failed to load tables');
      res.redirect('/manager');
    }
  }

  // MANAGER: Create table
  async createTable(req, res) {
    try {
      const { table_number, capacity } = req.body;
      await tableService.createTable({ table_number, capacity });
      
      if (req.session.user) {
        await logActivity(req.session.user.id, `Added table #${table_number}`);
      }

      req.flash('success', 'Table added successfully');
      res.redirect('/manager/tables');
    } catch (err) {
      req.flash('error', err.message || 'Failed to add table');
      res.redirect('/manager/tables');
    }
  }

  // MANAGER: Update table status
  async updateStatus(req, res) {
    try {
      const { status } = req.body;
      await tableService.updateStatus(req.params.id, status);
      
      if (req.path.startsWith('/api/')) {
        return res.json({ success: true });
      }

      req.flash('success', 'Table status updated');
      res.redirect('/manager/tables');
    } catch (err) {
      if (req.path.startsWith('/api/')) {
        return res.status(400).json({ error: err.message });
      }
      req.flash('error', err.message || 'Failed to update table');
      res.redirect('/manager/tables');
    }
  }

  // MANAGER: Delete table
  async deleteTable(req, res) {
    try {
      await tableService.deleteTable(req.params.id);
      
      req.flash('success', 'Table deleted');
      res.redirect('/manager/tables');
    } catch (err) {
      req.flash('error', 'Failed to delete table');
      res.redirect('/manager/tables');
    }
  }

  // API: Get all tables
  async apiGetAll(req, res) {
    try {
      const tables = await tableService.getAllTables();
      res.json(tables);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // API: Get available tables
  async apiGetAvailable(req, res) {
    try {
      const { date, time, guests } = req.query;
      if (!date || !time || !guests) {
        return res.status(400).json({ error: 'date, time, and guests are required' });
      }
      const tables = await tableService.getAvailableTables(date, time, guests);
      res.json(tables);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new TableController();
