-- Disable Row Level Security (RLS) for all tables
-- This allows all authenticated and anonymous users to read/write data.
-- Run this in your Supabase SQL Editor to resolve the RLS violation errors.

ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances DISABLE ROW LEVEL SECURITY;
ALTER TABLE payroll DISABLE ROW LEVEL SECURITY;
ALTER TABLE performance_reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings DISABLE ROW LEVEL SECURITY;

-- Alternatively, if you want to KEEP RLS enabled but allow authenticated users to do everything,
-- you can run the following instead (uncomment to use):

/*
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all authenticated users" ON employees FOR ALL TO authenticated USING (true);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all authenticated users" ON departments FOR ALL TO authenticated USING (true);

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all authenticated users" ON roles FOR ALL TO authenticated USING (true);

ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all authenticated users" ON attendance_records FOR ALL TO authenticated USING (true);

ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all authenticated users" ON attendance_logs FOR ALL TO authenticated USING (true);

ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all authenticated users" ON leave_requests FOR ALL TO authenticated USING (true);

ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all authenticated users" ON leave_balances FOR ALL TO authenticated USING (true);

ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all authenticated users" ON payroll FOR ALL TO authenticated USING (true);

ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all authenticated users" ON performance_reviews FOR ALL TO authenticated USING (true);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all authenticated users" ON system_settings FOR ALL TO authenticated USING (true);
*/
