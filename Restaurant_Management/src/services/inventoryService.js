const supabase = require('../config/supabase');

class InventoryService {
  async getAllItems() {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('item_name', { ascending: true });
    
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getItemById(id) {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw new Error('Inventory item not found');
    return data;
  }

  async createItem({ item_name, quantity, unit, minimum_stock }) {
    const { data, error } = await supabase
      .from('inventory')
      .insert([{
        item_name,
        quantity: parseFloat(quantity) || 0,
        unit: unit || 'pcs',
        minimum_stock: parseFloat(minimum_stock) || 10
      }])
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  }

  async updateItem(id, updates) {
    if (updates.quantity) updates.quantity = parseFloat(updates.quantity);
    if (updates.minimum_stock) updates.minimum_stock = parseFloat(updates.minimum_stock);
    updates.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('inventory')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  }

  async deleteItem(id) {
    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(error.message);
    return true;
  }

  async reduceStock(itemName, quantity) {
    // Find inventory item by name (case-insensitive partial match)
    const { data: items } = await supabase
      .from('inventory')
      .select('*')
      .ilike('item_name', `%${itemName}%`)
      .limit(1);
    
    if (items && items.length > 0) {
      const item = items[0];
      const newQty = Math.max(0, parseFloat(item.quantity) - parseFloat(quantity));
      
      await supabase
        .from('inventory')
        .update({ quantity: newQty, updated_at: new Date().toISOString() })
        .eq('id', item.id);
      
      return { ...item, quantity: newQty };
    }
    return null;
  }

  async getLowStockItems() {
    const { data, error } = await supabase
      .from('inventory')
      .select('*');
    
    if (error) throw new Error(error.message);
    
    // Filter where quantity < minimum_stock
    return (data || []).filter(item => parseFloat(item.quantity) < parseFloat(item.minimum_stock));
  }

  async getLowStockCount() {
    const items = await this.getLowStockItems();
    return items.length;
  }
}

module.exports = new InventoryService();
