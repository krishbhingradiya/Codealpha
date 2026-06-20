-- ============================================================
-- Restaurant Management System — Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension (usually enabled by default in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  mobile VARCHAR(20),
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'manager', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================
-- 2. CATEGORIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  icon VARCHAR(50) DEFAULT '🍽️',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. MENU ITEMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_menu_items_category ON menu_items(category_id);
CREATE INDEX idx_menu_items_available ON menu_items(available);

-- ============================================================
-- 4. TABLES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS tables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_number INTEGER UNIQUE NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 4,
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'occupied'))
);

CREATE INDEX idx_tables_status ON tables(status);

-- ============================================================
-- 5. RESERVATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  guests INTEGER NOT NULL,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reservations_customer ON reservations(customer_id);
CREATE INDEX idx_reservations_date ON reservations(reservation_date);
CREATE INDEX idx_reservations_status ON reservations(status);

-- ============================================================
-- 6. ORDERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  table_number INTEGER,
  order_number VARCHAR(20) UNIQUE NOT NULL,
  special_instructions TEXT,
  total_amount DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'served', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at);
CREATE INDEX idx_orders_number ON orders(order_number);

-- ============================================================
-- 7. ORDER ITEMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  item_name VARCHAR(200) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10,2) NOT NULL
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- ============================================================
-- 8. INVENTORY TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_name VARCHAR(200) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit VARCHAR(50) DEFAULT 'pcs',
  minimum_stock DECIMAL(10,2) DEFAULT 10,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  message TEXT,
  type VARCHAR(50) DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at);

-- ============================================================
-- 10. ACTIVITY LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at);

-- ============================================================
-- ROW LEVEL SECURITY — Allow anon key full access
-- (Auth is handled at the application level)
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for anon (service handles auth)
CREATE POLICY "Allow all for anon" ON users FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON categories FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON menu_items FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON tables FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON reservations FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON orders FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON order_items FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON inventory FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON notifications FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON activity_logs FOR ALL TO anon USING (true) WITH CHECK (true);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Default Categories
INSERT INTO categories (name, icon, sort_order) VALUES
  ('Pizza', '🍕', 1),
  ('Burger', '🍔', 2),
  ('Pasta', '🍝', 3),
  ('Sandwich', '🥪', 4),
  ('Cold Drinks', '🥤', 5),
  ('Coffee', '☕', 6),
  ('Dessert', '🍰', 7)
ON CONFLICT (name) DO NOTHING;

-- Default Admin (password: Admin@123 — bcrypt hash)
INSERT INTO users (name, email, mobile, password, role) VALUES
  ('Admin', 'admin@restaurant.com', '9999999999', '$2a$12$LJ3m4ys3GZfbFMjLgMGEKuYgGn7ZqFGfnY8GXcEqT4Rj8XkVN0qHe', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Default Tables
INSERT INTO tables (table_number, capacity, status) VALUES
  (1, 2, 'available'),
  (2, 2, 'available'),
  (3, 4, 'available'),
  (4, 4, 'available'),
  (5, 4, 'available'),
  (6, 6, 'available'),
  (7, 6, 'available'),
  (8, 8, 'available'),
  (9, 8, 'available'),
  (10, 10, 'available')
ON CONFLICT (table_number) DO NOTHING;

-- Sample Menu Items (using category IDs from seed above)
INSERT INTO menu_items (name, category_id, description, price, available) VALUES
  ('Margherita Pizza', (SELECT id FROM categories WHERE name = 'Pizza'), 'Classic pizza with fresh mozzarella, tomatoes, and basil', 149.00, true),
  ('Pepperoni Pizza', (SELECT id FROM categories WHERE name = 'Pizza'), 'Loaded with spicy pepperoni and melted cheese', 199.00, true),
  ('BBQ Chicken Pizza', (SELECT id FROM categories WHERE name = 'Pizza'), 'Smoky BBQ sauce, grilled chicken, red onions', 229.00, true),
  ('Classic Burger', (SELECT id FROM categories WHERE name = 'Burger'), 'Juicy beef patty with lettuce, tomato, and special sauce', 149.00, true),
  ('Cheese Burger', (SELECT id FROM categories WHERE name = 'Burger'), 'Double cheddar cheese with caramelized onions', 179.00, true),
  ('Veggie Burger', (SELECT id FROM categories WHERE name = 'Burger'), 'Plant-based patty with avocado and sprouts', 159.00, true),
  ('Spaghetti Bolognese', (SELECT id FROM categories WHERE name = 'Pasta'), 'Rich meat sauce over al dente spaghetti', 199.00, true),
  ('Fettuccine Alfredo', (SELECT id FROM categories WHERE name = 'Pasta'), 'Creamy parmesan sauce with fettuccine', 179.00, true),
  ('Penne Arrabbiata', (SELECT id FROM categories WHERE name = 'Pasta'), 'Spicy tomato sauce with garlic and chili', 149.00, true),
  ('Club Sandwich', (SELECT id FROM categories WHERE name = 'Sandwich'), 'Triple-decker with turkey, bacon, lettuce, tomato', 149.00, true),
  ('Grilled Chicken Sandwich', (SELECT id FROM categories WHERE name = 'Sandwich'), 'Herb-marinated chicken with pesto mayo', 179.00, true),
  ('Coca Cola', (SELECT id FROM categories WHERE name = 'Cold Drinks'), 'Classic refreshing Coca Cola (330ml)', 49.00, true),
  ('Fresh Orange Juice', (SELECT id FROM categories WHERE name = 'Cold Drinks'), 'Freshly squeezed orange juice', 79.00, true),
  ('Iced Lemonade', (SELECT id FROM categories WHERE name = 'Cold Drinks'), 'House-made lemonade with mint', 69.00, true),
  ('Espresso', (SELECT id FROM categories WHERE name = 'Coffee'), 'Rich single-shot espresso', 79.00, true),
  ('Cappuccino', (SELECT id FROM categories WHERE name = 'Coffee'), 'Espresso with steamed milk foam', 99.00, true),
  ('Latte', (SELECT id FROM categories WHERE name = 'Coffee'), 'Smooth espresso with velvety steamed milk', 119.00, true),
  ('Chocolate Cake', (SELECT id FROM categories WHERE name = 'Dessert'), 'Rich dark chocolate layer cake', 199.00, true),
  ('Tiramisu', (SELECT id FROM categories WHERE name = 'Dessert'), 'Classic Italian coffee-flavored dessert', 229.00, true),
  ('Cheesecake', (SELECT id FROM categories WHERE name = 'Dessert'), 'New York style creamy cheesecake', 199.00, true)
ON CONFLICT DO NOTHING;

-- Sample Inventory
INSERT INTO inventory (item_name, quantity, unit, minimum_stock) VALUES
  ('Pizza Dough', 50, 'pcs', 10),
  ('Mozzarella Cheese', 20, 'kg', 5),
  ('Tomato Sauce', 30, 'liters', 5),
  ('Burger Buns', 100, 'pcs', 20),
  ('Beef Patties', 80, 'pcs', 15),
  ('Lettuce', 15, 'kg', 3),
  ('Chicken Breast', 25, 'kg', 5),
  ('Pasta', 40, 'kg', 8),
  ('Coffee Beans', 10, 'kg', 2),
  ('Milk', 20, 'liters', 5),
  ('Coca Cola', 100, 'cans', 20),
  ('Orange Juice', 30, 'liters', 5),
  ('Chocolate', 8, 'kg', 2),
  ('Cream Cheese', 10, 'kg', 3),
  ('Bread Slices', 60, 'pcs', 15)
ON CONFLICT DO NOTHING;
