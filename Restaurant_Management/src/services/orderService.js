const supabase = require('../config/supabase');
const { generateOrderNumber } = require('../utils/orderNumber');

class OrderService {
  async createOrder(customerId, { table_number, special_instructions, items, coupon_code }) {
    const orderNumber = generateOrderNumber();
    
    // Fetch customer details
    const { data: customer } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', customerId)
      .single();
    
    // Calculate subtotal
    let subtotalAmount = 0;
    for (const item of items) {
      subtotalAmount += item.price * item.quantity;
    }

    let discountAmount = 0;
    let finalAmount = subtotalAmount;

    // Validate coupon if provided
    if (coupon_code) {
      const couponService = require('./couponService');
      try {
        const { discount } = await couponService.validateCoupon(coupon_code, customer.email, subtotalAmount);
        discountAmount = discount;
        finalAmount = Math.max(0, subtotalAmount - discountAmount);
      } catch (err) {
        throw new Error(`Coupon validation failed: ${err.message}`);
      }
    }
    
    // Insert order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        customer_id: customerId,
        table_number: parseInt(table_number) || null,
        order_number: orderNumber,
        special_instructions,
        total_amount: finalAmount,
        discount_amount: discountAmount,
        coupon_code: coupon_code || null,
        status: 'pending'
      }])
      .select()
      .single();
    
    if (orderError) throw new Error(orderError.message);
    
    // Apply coupon (mark used and create usage log)
    if (coupon_code && discountAmount > 0) {
      const couponService = require('./couponService');
      try {
        await couponService.applyCoupon(coupon_code, order.id, customerId, customer.email, subtotalAmount);
      } catch (err) {
        console.error('Failed to apply coupon usage on DB:', err);
      }
    }

    // Insert order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      menu_item_id: item.menu_item_id,
      item_name: item.name,
      quantity: item.quantity,
      price: item.price
    }));
    
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);
    
    if (itemsError) throw new Error(itemsError.message);

    // Create Invoice Log entry
    const invoiceNumber = `INV-${orderNumber.substring(4)}`;
    try {
      const { error: invoiceErr } = await supabase
        .from('invoice_logs')
        .insert([{
          order_id: order.id,
          invoice_number: invoiceNumber,
          customer_name: customer ? customer.name : 'Customer',
          total_amount: finalAmount
        }]);

      if (invoiceErr) console.error('Failed to log invoice:', invoiceErr);

      // Log invoice generation in activity logs
      const { logActivity } = require('./notificationService');
      await logActivity(customerId, 'Invoice Generated', `Invoice ${invoiceNumber} automatically generated for order ${orderNumber}`);
    } catch (invoiceLogErr) {
      console.error('Error logging invoice details:', invoiceLogErr);
    }
    
    return { ...order, items: orderItems };
  }

  async getOrderById(id) {
    const { data: order, error } = await supabase
      .from('orders')
      .select('*, users(name, email, mobile)')
      .eq('id', id)
      .single();
    
    if (error) throw new Error('Order not found');
    
    // Get order items
    const { data: items } = await supabase
      .from('order_items')
      .select('*, menu_items(name, image_url)')
      .eq('order_id', id);
    
    return { ...order, items: items || [] };
  }

  async getOrderByNumber(orderNumber) {
    const { data: order, error } = await supabase
      .from('orders')
      .select('*, users(name, email)')
      .eq('order_number', orderNumber)
      .single();
    
    if (error) throw new Error('Order not found');
    
    const { data: items } = await supabase
      .from('order_items')
      .select('*, menu_items(name, image_url)')
      .eq('order_id', order.id);
    
    return { ...order, items: items || [] };
  }

  async getCustomerOrders(customerId) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getAllOrders(filters = {}) {
    let query = supabase
      .from('orders')
      .select('*, users(name, email, mobile)')
      .order('created_at', { ascending: false });
    
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters.date) {
      query = query.gte('created_at', `${filters.date}T00:00:00`)
                    .lte('created_at', `${filters.date}T23:59:59`);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getTodayOrders() {
    const today = new Date().toISOString().split('T')[0];
    return this.getAllOrders({ date: today });
  }

  async updateOrderStatus(id, status) {
    const validStatuses = ['pending', 'preparing', 'ready', 'served', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid order status');
    }
    
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  }

  async getTodayRevenue() {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('orders')
      .select('total_amount')
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`)
      .in('status', ['completed', 'served']);
    
    if (error) return 0;
    return (data || []).reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
  }

  async getOrderStats() {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: todayOrders } = await supabase
      .from('orders')
      .select('id, status, total_amount')
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`);
    
    const orders = todayOrders || [];
    
    return {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      preparing: orders.filter(o => o.status === 'preparing').length,
      ready: orders.filter(o => o.status === 'ready').length,
      completed: orders.filter(o => ['completed', 'served'].includes(o.status)).length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      revenue: orders
        .filter(o => ['completed', 'served'].includes(o.status))
        .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0)
    };
  }
}

module.exports = new OrderService();
