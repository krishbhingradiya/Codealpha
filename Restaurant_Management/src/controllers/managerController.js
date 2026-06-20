// src/controllers/managerController.js

const managerService = require('../services/managerService');
const { logActivity } = require('../services/notificationService');

class ManagerController {
  // Dashboard page
  async showDashboard(req, res) {
    try {
      const { orderStats, reservationCount, tableStats, lowStockItems, recentOrders } = await managerService.getDashboardStats();
      res.render('manager/dashboard', {
        title: 'Manager Dashboard',
        orderStats,
        reservationCount,
        tableStats,
        lowStockItems,
        recentOrders,
        layout: 'layouts/main'
      });
    } catch (err) {
      console.error('Manager dashboard error:', err);
      req.flash('error', 'Failed to load manager dashboard');
      res.render('manager/dashboard', {
        title: 'Manager Dashboard',
        orderStats: { total: 0, revenue: 0, pending: 0, preparing: 0, ready: 0 },
        reservationCount: 0,
        tableStats: { total: 0, occupied: 0 },
        lowStockItems: [],
        recentOrders: [],
        layout: 'layouts/main'
      });
    }
  }

  // Orders management page
  async showOrders(req, res) {
    try {
      const statusFilter = req.query.status || 'all';
      const orders = await managerService.getAllOrders(statusFilter);
      res.render('manager/orders', {
        title: 'Order Management',
        orders,
        currentFilter: statusFilter,
        layout: 'layouts/main'
      });
    } catch (err) {
      console.error('Orders page error:', err);
      req.flash('error', 'Failed to load orders');
      res.redirect('/manager/dashboard');
    }
  }

  // Update order status (POST)
  async updateOrderStatus(req, res) {
    const { orderId } = req.params;
    const { status } = req.body;
    try {
      const order = await managerService.updateOrderStatus(orderId, status);
      await logActivity(req.session.user.id, `Updated order #${order.order_number} to ${status}`);

      // Send notification to customer based on status
      const notificationMessages = {
        'preparing': {
          title: '👨‍🍳 Order Being Prepared',
          message: `Your order #${order.order_number} is now being prepared. It will be served in 2-5 min, please wait.`
        },
        'ready': {
          title: '✅ Order Ready!',
          message: `Your order #${order.order_number} is ready! Please collect from the counter.`
        },
        'served': {
          title: '🍽️ Order Served',
          message: `Your order #${order.order_number} has been served. Enjoy your meal!`
        },
        'completed': {
          title: '✅ Order Completed',
          message: `Your order #${order.order_number} is completed. Thank you for dining with us!`
        },
        'cancelled': {
          title: '❌ Order Cancelled',
          message: `Your order #${order.order_number} has been cancelled. Please contact staff for details.`
        }
      };

      if (order.customer_id && notificationMessages[status]) {
        const { title, message } = notificationMessages[status];
        await managerService.sendCustomerNotification(order.customer_id, title, message, 'order');
      }

      req.flash('success', `Order #${order.order_number} updated to "${status}"`);
      res.redirect('/manager/orders');
    } catch (err) {
      console.error('Update order status error:', err);
      req.flash('error', 'Failed to update order status');
      res.redirect('/manager/orders');
    }
  }

  // Reservations management page
  async showReservations(req, res) {
    try {
      const reservations = await managerService.getAllReservations();
      res.render('manager/reservations', {
        title: 'Reservation Management',
        reservations,
        layout: 'layouts/main'
      });
    } catch (err) {
      console.error('Reservations page error:', err);
      req.flash('error', 'Failed to load reservations');
      res.redirect('/manager/dashboard');
    }
  }

  // Update reservation status (POST)
  async updateReservationStatus(req, res) {
    const { reservationId } = req.params;
    const { status } = req.body;
    try {
      const reservation = await managerService.updateReservationStatus(reservationId, status);
      await logActivity(req.session.user.id, `Updated reservation to ${status}`);

      // Notify customer
      if (reservation.customer_id) {
        const messages = {
          'confirmed': {
            title: '✅ Reservation Confirmed',
            message: `Your reservation for ${reservation.reservation_date} at ${reservation.reservation_time} has been confirmed!`
          },
          'cancelled': {
            title: '❌ Reservation Cancelled',
            message: `Your reservation for ${reservation.reservation_date} has been cancelled. Please contact us for details.`
          }
        };
        if (messages[status]) {
          await managerService.sendCustomerNotification(reservation.customer_id, messages[status].title, messages[status].message, 'reservation');
        }
      }

      req.flash('success', `Reservation ${status}`);
      res.redirect('/manager/reservations');
    } catch (err) {
      console.error('Update reservation error:', err);
      req.flash('error', 'Failed to update reservation');
      res.redirect('/manager/reservations');
    }
  }

  // Menu management (list)
  async showMenu(req, res) {
    try {
      const { data: menuItems, error } = await managerService.getMenuItems();
      if (error) throw error;
      res.render('manager/menu', {
        title: 'Menu Management',
        menuItems: menuItems || [],
        layout: 'layouts/main'
      });
    } catch (err) {
      console.error('Menu page error:', err);
      req.flash('error', 'Failed to load menu');
      res.redirect('/manager/dashboard');
    }
  }

  // Tables management page
  async showTables(req, res) {
    try {
      const tables = await managerService.getTablesSummary();
      res.render('manager/tables', {
        title: 'Table Management',
        tables,
        layout: 'layouts/main'
      });
    } catch (err) {
      console.error('Tables page error:', err);
      req.flash('error', 'Failed to load tables');
      res.redirect('/manager/dashboard');
    }
  }

  // Inventory page
  async showInventory(req, res) {
    try {
      const { data: inventory, error } = await managerService.getInventory();
      if (error) throw error;
      res.render('manager/inventory', {
        title: 'Inventory',
        inventory: inventory || [],
        layout: 'layouts/main'
      });
    } catch (err) {
      console.error('Inventory page error:', err);
      req.flash('error', 'Failed to load inventory');
      res.redirect('/manager/dashboard');
    }
  }

  // Analytics page
  async showAnalytics(req, res) {
    try {
      const analytics = await managerService.getAnalytics();
      res.render('manager/analytics', {
        title: 'Analytics',
        analytics,
        layout: 'layouts/main'
      });
    } catch (err) {
      console.error('Analytics page error:', err);
      req.flash('error', 'Failed to load analytics');
      res.redirect('/manager/dashboard');
    }
  }
}

module.exports = new ManagerController();
