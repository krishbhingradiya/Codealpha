const supabase = require('../config/supabase');

class ReportService {
  async getSalesReport(period = 'daily') {
    let startDate;
    const now = new Date();
    
    switch (period) {
      case 'daily':
        startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
        break;
      case 'weekly':
        startDate = new Date(now.setDate(now.getDate() - 7)).toISOString();
        break;
      case 'monthly':
        startDate = new Date(now.setMonth(now.getMonth() - 1)).toISOString();
        break;
      default:
        startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
    }

    const { data, error } = await supabase
      .from('orders')
      .select('id, order_number, total_amount, status, created_at, users(name)')
      .gte('created_at', startDate)
      .in('status', ['completed', 'served'])
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(error.message);
    
    const orders = data || [];
    const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
    
    return {
      period,
      orders,
      totalOrders: orders.length,
      totalRevenue,
      averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0
    };
  }

  async getTopSellingItems(limit = 10) {
    const { data, error } = await supabase
      .from('order_items')
      .select('item_name, quantity, price, menu_item_id');
    
    if (error) throw new Error(error.message);
    
    // Aggregate by item name
    const itemMap = {};
    (data || []).forEach(item => {
      if (!itemMap[item.item_name]) {
        itemMap[item.item_name] = { name: item.item_name, totalQuantity: 0, totalRevenue: 0 };
      }
      itemMap[item.item_name].totalQuantity += item.quantity;
      itemMap[item.item_name].totalRevenue += item.price * item.quantity;
    });
    
    return Object.values(itemMap)
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, limit);
  }

  async getMostOrderedCategories() {
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('menu_item_id, quantity');
    
    if (!orderItems || orderItems.length === 0) return [];
    
    // Get menu items with categories
    const menuItemIds = [...new Set(orderItems.map(i => i.menu_item_id).filter(Boolean))];
    
    if (menuItemIds.length === 0) return [];
    
    const { data: menuItems } = await supabase
      .from('menu_items')
      .select('id, category_id, categories(name)')
      .in('id', menuItemIds);
    
    // Map menu items to categories
    const categoryMap = {};
    (menuItems || []).forEach(mi => {
      const catName = mi.categories?.name || 'Uncategorized';
      if (!categoryMap[catName]) {
        categoryMap[catName] = { name: catName, totalOrders: 0 };
      }
    });
    
    orderItems.forEach(oi => {
      const mi = (menuItems || []).find(m => m.id === oi.menu_item_id);
      if (mi) {
        const catName = mi.categories?.name || 'Uncategorized';
        if (categoryMap[catName]) {
          categoryMap[catName].totalOrders += oi.quantity;
        }
      }
    });
    
    return Object.values(categoryMap).sort((a, b) => b.totalOrders - a.totalOrders);
  }

  async getDashboardStats() {
    const today = new Date().toISOString().split('T')[0];
    
    // Today's orders
    const { data: todayOrders } = await supabase
      .from('orders')
      .select('id, status, total_amount')
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`);
    
    const orders = todayOrders || [];
    const completedOrders = orders.filter(o => ['completed', 'served'].includes(o.status));
    
    // Revenue
    const revenue = completedOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
    
    // Total users
    const { data: users } = await supabase.from('users').select('id, role');
    
    // Total menu items
    const { data: menuItems } = await supabase.from('menu_items').select('id');
    
    return {
      ordersToday: orders.length,
      revenueToday: revenue,
      totalUsers: (users || []).length,
      totalCustomers: (users || []).filter(u => u.role === 'customer').length,
      totalManagers: (users || []).filter(u => u.role === 'manager').length,
      totalMenuItems: (menuItems || []).length,
      pendingOrders: orders.filter(o => o.status === 'pending').length
    };
  }
}

module.exports = new ReportService();
