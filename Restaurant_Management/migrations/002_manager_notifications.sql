/* Migration: Manager Notifications */
CREATE TABLE IF NOT EXISTS manager_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  manager_id UUID REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  seen BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_manager_notifications_manager ON manager_notifications(manager_id);
CREATE INDEX idx_manager_notifications_order ON manager_notifications(order_id);

-- Enable RLS and allow anon (service handles auth)
ALTER TABLE manager_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON manager_notifications FOR ALL TO anon USING (true) WITH CHECK (true);
