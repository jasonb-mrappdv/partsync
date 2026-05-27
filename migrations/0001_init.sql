-- PartSync initial schema for Cloudflare D1.
-- Mirrors base44/entities/*.jsonc + a users table for auth.

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user', -- admin | vendor | technician | user
  vendor_id TEXT,                    -- non-null when role='vendor'; FK to vendors.id
  email_verified INTEGER NOT NULL DEFAULT 0,
  created_date TEXT NOT NULL DEFAULT (datetime('now')),
  updated_date TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_vendor ON users(vendor_id);

CREATE TABLE part_orders (
  id TEXT PRIMARY KEY,
  part_number TEXT NOT NULL,
  purchase_order TEXT NOT NULL,
  vendor_id TEXT,
  vendor_name TEXT,
  vendor_order_number TEXT,
  tracking_number TEXT,
  estimated_delivery TEXT,
  customer_email TEXT,
  customer_name TEXT,
  status TEXT NOT NULL DEFAULT 'Pending',
  notification_sent INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  part_category TEXT,
  created_by TEXT,
  created_date TEXT NOT NULL DEFAULT (datetime('now')),
  updated_date TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_part_orders_vendor ON part_orders(vendor_id);
CREATE INDEX idx_part_orders_status ON part_orders(status);
CREATE INDEX idx_part_orders_created ON part_orders(created_date DESC);

CREATE TABLE return_logs (
  id TEXT PRIMARY KEY,
  part_number TEXT NOT NULL,
  purchase_order TEXT,
  vendor_id TEXT,
  vendor_name TEXT,
  issue_type TEXT NOT NULL,
  photo_url TEXT,
  description TEXT,
  log_status TEXT NOT NULL DEFAULT 'Reported',
  reported_by TEXT,
  order_id TEXT,
  created_by TEXT,
  created_date TEXT NOT NULL DEFAULT (datetime('now')),
  updated_date TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_return_logs_vendor ON return_logs(vendor_id);
CREATE INDEX idx_return_logs_order ON return_logs(order_id);
CREATE INDEX idx_return_logs_created ON return_logs(created_date DESC);

CREATE TABLE vendors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  key_contact TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  directory TEXT,
  part_categories TEXT,           -- JSON array
  avg_score REAL,
  total_orders INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_by TEXT,
  created_date TEXT NOT NULL DEFAULT (datetime('now')),
  updated_date TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE routing_rules (
  id TEXT PRIMARY KEY,
  rule_name TEXT NOT NULL,
  description TEXT,
  part_category TEXT,
  vendor_id TEXT NOT NULL,
  vendor_name TEXT,
  priority INTEGER NOT NULL DEFAULT 1,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_by TEXT,
  created_date TEXT NOT NULL DEFAULT (datetime('now')),
  updated_date TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE technician_logs (
  id TEXT PRIMARY KEY,
  technician_name TEXT NOT NULL,
  technician_email TEXT,
  quarter TEXT NOT NULL,
  year INTEGER,
  quarter_number INTEGER,
  return_count INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_by TEXT,
  created_date TEXT NOT NULL DEFAULT (datetime('now')),
  updated_date TEXT NOT NULL DEFAULT (datetime('now'))
);
