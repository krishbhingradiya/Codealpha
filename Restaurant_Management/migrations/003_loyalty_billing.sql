-- ============================================================
-- Customer Loyalty and Billing Database Schema
-- ============================================================

-- 1. Create coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  discount_percent INTEGER NOT NULL,
  max_discount DECIMAL(10,2) DEFAULT 200.00,
  min_order DECIMAL(10,2) DEFAULT 299.00,
  used BOOLEAN DEFAULT FALSE,
  disabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  CONSTRAINT unique_customer_coupon UNIQUE (code, customer_email)
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_customer ON coupons(customer_email);

-- 2. Create coupon_usage table
CREATE TABLE IF NOT EXISTS coupon_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  discount_amount DECIMAL(10,2) NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon ON coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_order ON coupon_usage(order_id);

-- 3. Create invoice_logs table
CREATE TABLE IF NOT EXISTS invoice_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  invoice_number VARCHAR(100) NOT NULL,
  customer_name VARCHAR(100),
  total_amount DECIMAL(10,2) NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_logs_order ON invoice_logs(order_id);

-- 4. Alter orders table to store discount details
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50);

-- Enable RLS and set public policy (auth handled by app layer)
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON coupons FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON coupon_usage FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE invoice_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON invoice_logs FOR ALL TO anon USING (true) WITH CHECK (true);
