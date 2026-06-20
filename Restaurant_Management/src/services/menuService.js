const supabase = require('../config/supabase');

class MenuService {
  async getAllCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });
    
    if (error) throw new Error(error.message);
    return data || [];
  }

  async createCategory(name, icon = '🍽️') {
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .order('sort_order', { ascending: false })
      .limit(1);
    
    const nextOrder = existing && existing.length > 0 ? (existing[0].sort_order || 0) + 1 : 1;
    
    const { data, error } = await supabase
      .from('categories')
      .insert([{ name, icon, sort_order: nextOrder }])
      .select()
      .single();
    
    if (error) {
      if (error.code === '23505') throw new Error('Category already exists');
      throw new Error(error.message);
    }
    return data;
  }

  async deleteCategory(id) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(error.message);
    return true;
  }

  async getAllMenuItems(filters = {}) {
    let query = supabase
      .from('menu_items')
      .select('*, categories(name, icon)')
      .order('created_at', { ascending: false });
    
    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id);
    }
    
    if (filters.available !== undefined) {
      query = query.eq('available', filters.available);
    }
    
    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getMenuItemById(id) {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*, categories(name, icon)')
      .eq('id', id)
      .single();
    
    if (error) throw new Error('Menu item not found');
    return data;
  }

  async createMenuItem({ name, category_id, description, price, image_url, available }) {
    const { data, error } = await supabase
      .from('menu_items')
      .insert([{ name, category_id, description, price: parseFloat(price), image_url, available: available !== false }])
      .select('*, categories(name, icon)')
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  }

  async updateMenuItem(id, updates) {
    if (updates.price) updates.price = parseFloat(updates.price);
    
    const { data, error } = await supabase
      .from('menu_items')
      .update(updates)
      .eq('id', id)
      .select('*, categories(name, icon)')
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  }

  async deleteMenuItem(id) {
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(error.message);
    return true;
  }

  async toggleAvailability(id) {
    const item = await this.getMenuItemById(id);
    
    const { data, error } = await supabase
      .from('menu_items')
      .update({ available: !item.available })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  }
}

module.exports = new MenuService();
