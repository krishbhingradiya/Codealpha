// src/services/managerService.js

const supabase = require('../config/supabase');

class ManagerService {
  // Dashboard: get all stats the view needs
  async getDashboardStats() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayISO = todayStart.toISOString();

    // Today's orders (with coupon details)
    const { data: todayOrders, error: err1 } = await supabase
      .from('orders')
      .select('id, total_amount, status, order_number, table_number, created_at, customer_id, coupon_code, discount_amount')
      .gte('created_at', todayISO)
      .order('created_at', { ascending: false });

    if (err1) console.error('Error fetching today orders:', err1);
    const orders = todayOrders || [];
    const revenue = orders.filter(o => ['completed', 'served'].includes(o.status)).reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    const pending = orders.filter(o => o.status === 'pending').length;
    const preparing = orders.filter(o => o.status === 'preparing').length;
    const ready = orders.filter(o => o.status === 'ready').length;

    // Coupons Used Today & Discounts Given Today
    const couponsUsedToday = orders.filter(o => o.coupon_code).length;
    const discountGivenToday = orders.reduce((sum, o) => sum + Number(o.discount_amount || 0), 0);

    // First-Time Customers Today
    const uniqueCustomerIds = [...new Set(orders.map(o => o.customer_id).filter(id => id))];
    let firstTimeCustomers = 0;
    
    if (uniqueCustomerIds.length > 0) {
      const { data: pastOrders } = await supabase
        .from('orders')
        .select('customer_id')
        .lt('created_at', todayISO)
        .in('customer_id', uniqueCustomerIds);
      
      const pastCustomerIds = new Set((pastOrders || []).map(po => po.customer_id));
      firstTimeCustomers = uniqueCustomerIds.filter(id => !pastCustomerIds.has(id)).length;
    }

    // Active reservations (pending or confirmed)
    const { data: reservations, error: err2 } = await supabase
      .from('reservations')
      .select('id')
      .in('status', ['pending', 'confirmed']);
    if (err2) console.error('Error fetching reservations:', err2);
    const reservationCount = (reservations || []).length;

    // Tables
    const { data: allTables, error: err3 } = await supabase
      .from('tables')
      .select('id, status');
    if (err3) console.error('Error fetching tables:', err3);
    const tables = allTables || [];
    const occupied = tables.filter(t => t.status === 'occupied').length;

    // Low stock items
    const { data: allInventory, error: err4 } = await supabase
      .from('inventory')
      .select('*');
    if (err4) console.error('Error fetching inventory:', err4);
    const lowStockItems = (allInventory || []).filter(i => Number(i.quantity) <= Number(i.minimum_stock));

    // Recent orders with user names for display (last 10 overall)
    const { data: recentOrdersData, error: err5 } = await supabase
      .from('orders')
      .select('id, order_number, total_amount, status, created_at, customer_id, users:customer_id(name)')
      .order('created_at', { ascending: false })
      .limit(10);
    if (err5) console.error('Error fetching recent orders:', err5);
    const recentOrders = recentOrdersData || [];

    return {
      orderStats: { 
        total: orders.length, 
        revenue, 
        pending, 
        preparing, 
        ready,
        couponsUsedToday,
        discountGivenToday,
        firstTimeCustomers
      },
      reservationCount,
      tableStats: { total: tables.length, occupied },
      lowStockItems,
      recentOrders,
    };
  }

  // Get all orders for management (with user info and items)
  async getAllOrders(statusFilter) {
    let query = supabase
      .from('orders')
      .select('id, order_number, total_amount, status, created_at, table_number, special_instructions, customer_id, users:customer_id(name, mobile), order_items(id, item_name, quantity, price)')
      .order('created_at', { ascending: false });

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // Get today's orders
  async getTodayOrders() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { data, error } = await supabase
      .from('orders')
      .select('id, order_number, total_amount, status, created_at, table_number, special_instructions, customer_id, users:customer_id(name, mobile), order_items(id, item_name, quantity, price)')
      .gte('created_at', todayStart.toISOString())
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  // Update order status
  async updateOrderStatus(orderId, newStatus) {
    // Get full order detail first to get table_number and items
    const orderDetails = await this.getOrderById(orderId);

    const { data, error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)
      .select('id, order_number, status, customer_id, table_number')
      .single();
    if (error) throw error;

    // Update table status based on order status
    if (orderDetails.table_number) {
      if (newStatus === 'preparing') {
        await supabase.from('tables').update({ status: 'occupied' }).eq('table_number', parseInt(orderDetails.table_number));
      } else if (['completed', 'cancelled'].includes(newStatus)) {
        await supabase.from('tables').update({ status: 'available' }).eq('table_number', parseInt(orderDetails.table_number));
      }
    }

    // If completed, reduce inventory
    if (newStatus === 'completed') {
      try {
        const inventoryService = require('./inventoryService');
        const notificationService = require('./notificationService');
        if (orderDetails.order_items && orderDetails.order_items.length > 0) {
          for (const item of orderDetails.order_items) {
            await inventoryService.reduceStock(item.item_name, item.quantity);
          }
        }
        
        // Notify managers if stock is low
        const lowStock = await inventoryService.getLowStockItems();
        if (lowStock.length > 0) {
          await notificationService.notifyManagers({
            title: 'Low Stock Alert',
            message: `${lowStock.length} item(s) below minimum stock level`,
            type: 'inventory'
          });
        }
      } catch (invErr) {
        console.error('Inventory reduction error in managerService:', invErr);
      }
    }

    return data;
  }

  // Get single order details
  async getOrderById(orderId) {
    const { data, error } = await supabase
      .from('orders')
      .select('id, order_number, total_amount, status, created_at, table_number, special_instructions, customer_id, users:customer_id(name, mobile), order_items(id, item_name, quantity, price)')
      .eq('id', orderId)
      .single();
    if (error) throw error;
    return data;
  }

  // Get all reservations for management
  async getAllReservations() {
    const { data, error } = await supabase
      .from('reservations')
      .select('*, tables(table_number, capacity), users:customer_id(name, mobile, email)')
      .order('reservation_date', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  // Update reservation status
  async updateReservationStatus(reservationId, newStatus) {
    const { data, error } = await supabase
      .from('reservations')
      .update({ status: newStatus })
      .eq('id', reservationId)
      .select('*')
      .single();
    if (error) throw error;

    // Update table status based on reservation status
    if (data.table_id) {
      if (newStatus === 'confirmed') {
        await supabase.from('tables').update({ status: 'reserved' }).eq('id', data.table_id);
      } else if (['cancelled', 'completed'].includes(newStatus)) {
        await supabase.from('tables').update({ status: 'available' }).eq('id', data.table_id);
      }
    }

    return data;
  }

  // Table management summary
  async getTablesSummary() {
    const { data, error } = await supabase.from('tables').select('*').order('table_number');
    if (error) throw error;
    return data || [];
  }

  // Get menu items (for manager menu management)
  async getMenuItems() {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*, categories(name, icon)')
      .order('name');
    return { data: data || [], error };
  }

  // Get inventory items
  async getInventory() {
    const { data, error } = await supabase.from('inventory').select('*').order('item_name');
    return { data: data || [], error };
  }

  // Analytics data
  async getAnalytics() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek).toISOString();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();

    const fetchRevenue = async (gte) => {
      const { data } = await supabase
        .from('orders')
        .select('total_amount')
        .gte('created_at', gte)
        .neq('status', 'cancelled');
      return (data || []).reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    };

    const [daily, weekly, monthly, yearly] = await Promise.all([
      fetchRevenue(startOfDay),
      fetchRevenue(startOfWeek),
      fetchRevenue(startOfMonth),
      fetchRevenue(startOfYear),
    ]);

    // Top selling items
    const { data: topItems } = await supabase
      .from('order_items')
      .select('item_name, quantity')
      .order('quantity', { ascending: false })
      .limit(5);

    return { daily, weekly, monthly, yearly, topItems: topItems || [] };
  }

  // Send notification to customer
  async sendCustomerNotification(userId, title, message, type = 'order') {
    const { error } = await supabase
      .from('notifications')
      .insert({ user_id: userId, title, message, type });
    if (error) console.error('Failed to send notification:', error);
  }
}

module.exports = new ManagerService();
