const supabase = require('../config/supabase');

class NotificationService {
  async create({ user_id, title, message, type = 'info' }) {
    const { data, error } = await supabase
      .from('notifications')
      .insert([{ user_id, title, message, type }])
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  }

  async getUserNotifications(userId, limit = 20) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getUnreadCount(userId) {
    const { data, error } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('is_read', false);
    
    if (error) return 0;
    return (data || []).length;
  }

  async markAsRead(id) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    
    if (error) throw new Error(error.message);
    return true;
  }

  async markAllAsRead(userId) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    
    if (error) throw new Error(error.message);
    return true;
  }

  // Notify all managers
  async notifyManagers({ title, message, type }) {
    const { data: managers } = await supabase
      .from('users')
      .select('id')
      .in('role', ['manager', 'admin']);
    
    if (managers && managers.length > 0) {
      const notifications = managers.map(m => ({
        user_id: m.id,
        title,
        message,
        type
      }));
      
      await supabase.from('notifications').insert(notifications);
    }
  }

  // Notify specific customer
  async notifyCustomer(customerId, { title, message, type }) {
    return this.create({ user_id: customerId, title, message, type });
  }
}

// Activity logging
async function logActivity(userId, action, details = null) {
  try {
    await supabase
      .from('activity_logs')
      .insert([{ user_id: userId, action, details }]);
  } catch (e) {
    console.error('Activity log error:', e.message);
  }
}

module.exports = Object.assign(new NotificationService(), { logActivity });
