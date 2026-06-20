const supabase = require('../config/supabase');

class AdminService {
  async getAllUsers(filters = {}) {
    let query = supabase
      .from('users')
      .select('id, name, email, mobile, role, created_at')
      .order('created_at', { ascending: false });
    
    if (filters.role) {
      query = query.eq('role', filters.role);
    }

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  }

  async updateUserRole(userId, role) {
    const validRoles = ['customer', 'manager', 'admin'];
    if (!validRoles.includes(role)) {
      throw new Error('Invalid role');
    }

    const { data, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', userId)
      .select('id, name, email, role')
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  }

  async deleteUser(userId) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);
    
    if (error) throw new Error(error.message);
    return true;
  }

  async getActivityLogs(limit = 50) {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*, users(name, email, role)')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getSystemStats() {
    const { data: users } = await supabase.from('users').select('role');
    const { data: orders } = await supabase.from('orders').select('total_amount, status');
    const { data: reservations } = await supabase.from('reservations').select('status');
    const { data: menuItems } = await supabase.from('menu_items').select('id');
    
    const allUsers = users || [];
    const allOrders = orders || [];
    
    return {
      totalUsers: allUsers.length,
      customers: allUsers.filter(u => u.role === 'customer').length,
      managers: allUsers.filter(u => u.role === 'manager').length,
      admins: allUsers.filter(u => u.role === 'admin').length,
      totalOrders: allOrders.length,
      totalRevenue: allOrders
        .filter(o => ['completed', 'served'].includes(o.status))
        .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0),
      totalReservations: (reservations || []).length,
      totalMenuItems: (menuItems || []).length
    };
  }
}

module.exports = new AdminService();
