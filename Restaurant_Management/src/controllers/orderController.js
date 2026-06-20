const orderService = require('../services/orderService');
const inventoryService = require('../services/inventoryService');
const notificationService = require('../services/notificationService');
const { logActivity } = require('../services/notificationService');

class OrderController {
  // CUSTOMER: Show cart/checkout page
  async showCart(req, res) {
    res.render('customer/cart', {
      title: 'Your Cart',
      layout: 'layouts/main'
    });
  }

  // CUSTOMER: Place order
  async placeOrder(req, res) {
    try {
      const { table_number, special_instructions, items, coupon_code } = req.body;
      
      if (!items || items.length === 0) {
        if (req.path.startsWith('/api/')) {
          return res.status(400).json({ error: 'No items in order' });
        }
        req.flash('error', 'Your cart is empty');
        return res.redirect('/cart');
      }

      const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
      
      const order = await orderService.createOrder(req.session.user.id, {
        table_number,
        special_instructions,
        items: parsedItems,
        coupon_code
      });

      // Notify managers
      await notificationService.notifyManagers({
        title: 'New Order',
        message: `Order #${order.order_number} placed - $${order.total_amount}`,
        type: 'order'
      });

      await logActivity(req.session.user.id, `Placed order #${order.order_number}`);

      if (req.path.startsWith('/api/')) {
        return res.status(201).json(order);
      }

      req.flash('success', `Order #${order.order_number} placed successfully!`);
      res.redirect(`/orders/${order.id}/track`);
    } catch (err) {
      console.error('Order error:', err);
      if (req.path.startsWith('/api/')) {
        return res.status(400).json({ error: err.message });
      }
      req.flash('error', err.message || 'Failed to place order');
      res.redirect('/cart');
    }
  }

  // CUSTOMER: Track order
  async trackOrder(req, res) {
    try {
      const order = await orderService.getOrderById(req.params.id);
      
      res.render('customer/order-tracking', {
        title: `Order #${order.order_number}`,
        order,
        layout: 'layouts/main'
      });
    } catch (err) {
      req.flash('error', 'Order not found');
      res.redirect('/');
    }
  }

  // CUSTOMER: Order history
  async showHistory(req, res) {
    try {
      const orders = await orderService.getCustomerOrders(req.session.user.id);
      
      res.render('customer/order-history', {
        title: 'Order History',
        orders,
        layout: 'layouts/main'
      });
    } catch (err) {
      req.flash('error', 'Failed to load order history');
      res.redirect('/');
    }
  }

  // MANAGER: View all orders
  async showOrders(req, res) {
    try {
      const filters = {
        status: req.query.status || null,
        date: req.query.date || null
      };
      
      const orders = await orderService.getAllOrders(filters);
      
      res.render('manager/orders', {
        title: 'Manage Orders',
        orders,
        currentStatus: req.query.status || 'all',
        currentDate: req.query.date || '',
        layout: 'layouts/main'
      });
    } catch (err) {
      req.flash('error', 'Failed to load orders');
      res.redirect('/manager');
    }
  }

  // MANAGER: View order detail
  async showOrderDetail(req, res) {
    try {
      const order = await orderService.getOrderById(req.params.id);
      
      if (req.path.startsWith('/api/')) {
        return res.json(order);
      }

      res.render('customer/order-tracking', {
        title: `Order #${order.order_number}`,
        order,
        layout: 'layouts/main'
      });
    } catch (err) {
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'Order not found' });
      }
      req.flash('error', 'Order not found');
      res.redirect('/manager/orders');
    }
  }

  // MANAGER: Update order status
  async updateStatus(req, res) {
    try {
      const { status } = req.body;
      const order = await orderService.updateOrderStatus(req.params.id, status);
      
      // If completed, reduce inventory
      if (status === 'completed') {
        try {
          const fullOrder = await orderService.getOrderById(req.params.id);
          for (const item of fullOrder.items) {
            await inventoryService.reduceStock(item.item_name, item.quantity);
          }
          
          // Check low stock
          const lowStock = await inventoryService.getLowStockItems();
          if (lowStock.length > 0) {
            await notificationService.notifyManagers({
              title: 'Low Stock Alert',
              message: `${lowStock.length} item(s) below minimum stock level`,
              type: 'inventory'
            });
          }
        } catch (invErr) {
          console.error('Inventory update error:', invErr);
        }
      }

      // Notify customer
      if (order.customer_id) {
        const statusMessages = {
          preparing: 'Your order is being prepared',
          ready: 'Your order is ready!',
          served: 'Your order has been served',
          completed: 'Your order is completed. Thank you!',
          cancelled: 'Your order has been cancelled'
        };
        
        if (statusMessages[status]) {
          await notificationService.notifyCustomer(order.customer_id, {
            title: `Order #${order.order_number}`,
            message: statusMessages[status],
            type: 'order'
          });
        }
      }

      if (req.session.user) {
        await logActivity(req.session.user.id, `Updated order #${order.order_number} to ${status}`);
      }

      if (req.path.startsWith('/api/')) {
        return res.json(order);
      }

      req.flash('success', `Order status updated to ${status}`);
      res.redirect('/manager/orders');
    } catch (err) {
      if (req.path.startsWith('/api/')) {
        return res.status(400).json({ error: err.message });
      }
      req.flash('error', err.message || 'Failed to update order status');
      res.redirect('/manager/orders');
    }
  }

  // API: Get all orders
  async apiGetAll(req, res) {
    try {
      const filters = {
        status: req.query.status,
        date: req.query.date
      };
      const orders = await orderService.getAllOrders(filters);
      res.json(orders);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // CUSTOMER / MANAGER / ADMIN: Show invoice page
  async showInvoice(req, res) {
    try {
      const orderId = req.params.orderId;
      const order = await orderService.getOrderById(orderId);

      // Authorization check: customers can only view their own invoices
      if (req.session.user.role === 'customer' && order.customer_id !== req.session.user.id) {
        req.flash('error', 'You do not have permission to view this invoice');
        return res.redirect('/orders/history');
      }

      res.render('customer/invoice', {
        title: `Invoice #${order.order_number}`,
        order,
        layout: false // Standalone printing layout
      });
    } catch (err) {
      console.error('Invoice error:', err);
      req.flash('error', 'Failed to load invoice');
      res.redirect(req.session.user.role === 'customer' ? '/orders/history' : '/manager/orders');
    }
  }
}

module.exports = new OrderController();
