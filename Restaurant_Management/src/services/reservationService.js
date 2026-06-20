const supabase = require('../config/supabase');

class ReservationService {
  async createReservation(customerId, { table_id, reservation_date, reservation_time, guests, notes }) {
    // Check for duplicate reservation
    const { data: existing } = await supabase
      .from('reservations')
      .select('id')
      .eq('table_id', table_id)
      .eq('reservation_date', reservation_date)
      .eq('reservation_time', reservation_time)
      .in('status', ['pending', 'confirmed']);
    
    if (existing && existing.length > 0) {
      throw new Error('This table is already reserved for the selected date and time');
    }

    const { data, error } = await supabase
      .from('reservations')
      .insert([{
        customer_id: customerId,
        table_id,
        reservation_date,
        reservation_time,
        guests: parseInt(guests),
        notes,
        status: 'pending'
      }])
      .select('*, tables(table_number, capacity), users(name, email, mobile)')
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  }

  async getReservationById(id) {
    const { data, error } = await supabase
      .from('reservations')
      .select('*, tables(table_number, capacity), users(name, email, mobile)')
      .eq('id', id)
      .single();
    
    if (error) throw new Error('Reservation not found');
    return data;
  }

  async getCustomerReservations(customerId) {
    const { data, error } = await supabase
      .from('reservations')
      .select('*, tables(table_number, capacity)')
      .eq('customer_id', customerId)
      .order('reservation_date', { ascending: false });
    
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getAllReservations(filters = {}) {
    let query = supabase
      .from('reservations')
      .select('*, tables(table_number, capacity), users(name, email, mobile)')
      .order('reservation_date', { ascending: true });
    
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.date) {
      query = query.eq('reservation_date', filters.date);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getActiveReservations() {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('reservations')
      .select('*, tables(table_number, capacity), users(name, email, mobile)')
      .gte('reservation_date', today)
      .in('status', ['pending', 'confirmed'])
      .order('reservation_date', { ascending: true });
    
    if (error) throw new Error(error.message);
    return data || [];
  }

  async updateStatus(id, status) {
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid reservation status');
    }

    const { data, error } = await supabase
      .from('reservations')
      .update({ status })
      .eq('id', id)
      .select('*, tables(table_number, capacity), users(name, email, mobile)')
      .single();
    
    if (error) throw new Error(error.message);
    
    // Update table status based on reservation status
    if (data.table_id) {
      if (status === 'confirmed') {
        await supabase.from('tables').update({ status: 'reserved' }).eq('id', data.table_id);
      } else if (['cancelled', 'completed'].includes(status)) {
        await supabase.from('tables').update({ status: 'available' }).eq('id', data.table_id);
      }
    }
    
    return data;
  }

  async getReservationCount() {
    const today = new Date().toISOString().split('T')[0];
    
    const { data } = await supabase
      .from('reservations')
      .select('id')
      .gte('reservation_date', today)
      .in('status', ['pending', 'confirmed']);
    
    return (data || []).length;
  }
}

module.exports = new ReservationService();
