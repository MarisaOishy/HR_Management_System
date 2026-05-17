-- =============================================
-- Admin Module Schema Extensions
-- Run this AFTER schema.sql in Supabase Dashboard → SQL Editor
-- =============================================

-- Audit Logs table — tracks all sensitive admin actions
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  actor_id TEXT,
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System Settings table — global configuration key-value store
CREATE TABLE IF NOT EXISTS system_settings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  category TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT
);

-- =============================================
-- Indexes
-- =============================================
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor_email);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_settings_key ON system_settings(key);
CREATE INDEX IF NOT EXISTS idx_settings_category ON system_settings(category);

-- =============================================
-- RLS (disabled to match existing pattern)
-- =============================================
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings DISABLE ROW LEVEL SECURITY;

-- =============================================
-- Default system settings seed
-- =============================================
INSERT INTO system_settings (id, key, value, category, description) VALUES
('set-1', 'company_name', '"BanglaHR"', 'general', 'Company display name'),
('set-2', 'timezone', '"Asia/Dhaka"', 'general', 'Default system timezone'),
('set-3', 'date_format', '"DD/MM/YYYY"', 'general', 'Date display format'),
('set-4', 'max_login_attempts', '5', 'security', 'Maximum failed login attempts before lockout'),
('set-5', 'session_timeout_mins', '30', 'security', 'Session timeout in minutes'),
('set-6', 'password_min_length', '8', 'security', 'Minimum password length'),
('set-7', 'enable_2fa', 'false', 'security', 'Two-factor authentication toggle'),
('set-8', 'enable_notifications', 'true', 'features', 'Global notification toggle'),
('set-9', 'enable_self_checkin', 'true', 'features', 'Allow employee self check-in'),
('set-10', 'enable_leave_auto_approve', 'false', 'features', 'Auto-approve leave requests'),
('set-11', 'payroll_currency', '"BDT"', 'payroll', 'Currency for payroll calculations'),
('set-12', 'payroll_cycle', '"Monthly"', 'payroll', 'Payroll processing cycle')
ON CONFLICT (id) DO NOTHING;
