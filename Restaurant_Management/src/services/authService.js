const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class AuthService {
  async createUser({ name, email, mobile, password, role = 'customer' }) {
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const { data, error } = await supabase
      .from('users')
      .insert([{ name, email, mobile, password: hashedPassword, role }])
      .select('id, name, email, mobile, role, created_at')
      .single();
    
    if (error) {
      if (error.code === '23505') {
        throw new Error('An account with this email already exists');
      }
      throw new Error(error.message);
    }
    
    return data;
  }

  async findByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message);
    }
    
    return data;
  }

  async findById(id) {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, mobile, role, created_at')
      .eq('id', id)
      .single();
    
    if (error) return null;
    return data;
  }

  async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  generateToken(user) {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return null;
    }
  }

  async updateProfile(id, { name, mobile }) {
    const { data, error } = await supabase
      .from('users')
      .update({ name, mobile })
      .eq('id', id)
      .select('id, name, email, mobile, role')
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  }

  async changePassword(id, currentPassword, newPassword) {
    const { data: user } = await supabase
      .from('users')
      .select('password')
      .eq('id', id)
      .single();
    
    if (!user) throw new Error('User not found');
    
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) throw new Error('Current password is incorrect');
    
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    const { error } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', id);
    
    if (error) throw new Error(error.message);
    return true;
  }
}

module.exports = new AuthService();
