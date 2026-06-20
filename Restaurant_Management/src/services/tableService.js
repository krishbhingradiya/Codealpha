const supabase = require('../config/supabase');

class TableService {
  async getAllTables() {
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .order('table_number', { ascending: true });
    
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getTableById(id) {
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw new Error('Table not found');
    return data;
  }

  async createTable({ table_number, capacity, status = 'available' }) {
    const { data, error } = await supabase
      .from('tables')
      .insert([{ table_number: parseInt(table_number), capacity: parseInt(capacity), status }])
      .select()
      .single();
    
    if (error) {
      if (error.code === '23505') throw new Error('Table number already exists');
      throw new Error(error.message);
    }
    return data;
  }

  async updateTable(id, updates) {
    const { data, error } = await supabase
      .from('tables')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  }

  async updateStatus(id, status) {
    const validStatuses = ['available', 'reserved', 'occupied'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid table status');
    }
    return this.updateTable(id, { status });
  }

  async deleteTable(id) {
    const { error } = await supabase
      .from('tables')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(error.message);
    return true;
  }

  async getAvailableTables(date, time, guests) {
    const { data: allTables } = await supabase
      .from('tables')
      .select('*')
      .gte('capacity', parseInt(guests))
      .order('capacity', { ascending: true });
    
    if (!allTables || allTables.length === 0) return [];
    
    // Get reservations for the given date/time
    const { data: reservations } = await supabase
      .from('reservations')
      .select('table_id')
      .eq('reservation_date', date)
      .eq('reservation_time', time)
      .in('status', ['pending', 'confirmed']);
    
    const reservedTableIds = (reservations || []).map(r => r.table_id);
    
    return allTables.filter(t => !reservedTableIds.includes(t.id));
  }

  async getOccupancyStats() {
    const tables = await this.getAllTables();
    return {
      total: tables.length,
      available: tables.filter(t => t.status === 'available').length,
      reserved: tables.filter(t => t.status === 'reserved').length,
      occupied: tables.filter(t => t.status === 'occupied').length
    };
  }
}

module.exports = new TableService();
