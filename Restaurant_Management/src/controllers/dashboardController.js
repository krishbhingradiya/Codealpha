const orderService = require('../services/orderService');
const reservationService = require('../services/reservationService');
const tableService = require('../services/tableService');
const inventoryService = require('../services/inventoryService');

class DashboardController {
  async showDashboard(req, res) {
    try {
      const [orderStats, activeReservations, tableStats, lowStockItems, recentOrders] = await Promise.all([
        orderService.getOrderStats(),
        reservationService.getActiveReservations(),
        tableService.getOccupancyStats(),
        inventoryService.getLowStockItems(),
        orderService.getTodayOrders()
      ]);

      res.render('manager/dashboard', {
        title: 'Manager Dashboard',
        orderStats,
        activeReservations: activeReservations.slice(0, 5),
        reservationCount: activeReservations.length,
        tableStats,
        lowStockItems,
        recentOrders: recentOrders.slice(0, 10),
        layout: 'layouts/main'
      });
    } catch (err) {
      console.error('Dashboard error:', err);
      req.flash('error', 'Failed to load dashboard');
      res.render('manager/dashboard', {
        title: 'Manager Dashboard',
        orderStats: { total: 0, pending: 0, preparing: 0, ready: 0, completed: 0, cancelled: 0, revenue: 0 },
        activeReservations: [],
        reservationCount: 0,
        tableStats: { total: 0, available: 0, reserved: 0, occupied: 0 },
        lowStockItems: [],
        recentOrders: [],
        layout: 'layouts/main'
      });
    }
  }

  // API: Dashboard stats
  async apiGetStats(req, res) {
    try {
      const [orderStats, tableStats, lowStockCount, reservationCount] = await Promise.all([
        orderService.getOrderStats(),
        tableService.getOccupancyStats(),
        inventoryService.getLowStockCount(),
        reservationService.getReservationCount()
      ]);

      res.json({
        ...orderStats,
        tables: tableStats,
        lowStockAlerts: lowStockCount,
        activeReservations: reservationCount
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new DashboardController();
