-- =============================================
-- HRMS Seed Data for Supabase
-- Run this AFTER schema.sql in Supabase Dashboard → SQL Editor
-- =============================================

-- Employees
INSERT INTO employees (id, name, email, role, department, phone, join_date, salary, status, avatar, address, emergency_contact, date_of_birth, gender) VALUES
('EMP000', 'System Admin', 'admin@banglahr.com.bd', 'Admin', 'Engineering', '+1 (555) 000-0000', '2020-01-01', 150000, 'Active', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop', '1 Admin Way, San Francisco, CA 94101', '+1 (555) 000-0001', '1980-01-01', 'Male'),
('EMP001', 'Sadia Rahman', 'sarah.johnson@company.com', 'Senior Software Engineer', 'Engineering', '+1 (555) 123-4567', '2022-01-15', 95000, 'Active', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop', '123 Main St, San Francisco, CA 94102', '+1 (555) 987-6543', '1990-05-20', 'Female'),
('EMP002', 'Mehdi Hasan', 'michael.chen@company.com', 'Product Manager', 'Product', '+1 (555) 234-5678', '2021-06-20', 105000, 'Active', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop', '456 Oak Ave, San Francisco, CA 94103', '+1 (555) 876-5432', '1988-11-12', 'Male'),
('EMP003', 'Nusrat Jahan', 'emily.rodriguez@company.com', 'UX Designer', 'Design', '+1 (555) 345-6789', '2022-03-10', 85000, 'Active', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop', '789 Pine St, San Francisco, CA 94104', '+1 (555) 765-4321', '1992-08-30', 'Female'),
('EMP004', 'Rakib Hossain', 'james.wilson@company.com', 'Marketing Manager', 'Marketing', '+1 (555) 456-7890', '2020-09-01', 90000, 'Active', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop', '321 Elm St, San Francisco, CA 94105', '+1 (555) 654-3210', '1985-03-15', 'Male'),
('EMP005', 'Farhana Akter', 'hr@banglahr.com.bd', 'HR Manager', 'Human Resources', '+1 (555) 567-8901', '2021-11-15', 88000, 'Active', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop', '654 Maple Ave, San Francisco, CA 94106', '+1 (555) 543-2109', '1991-07-25', 'Female'),
('EMP006', 'Tanvir Ahmed', 'david.kim@company.com', 'Software Engineer', 'Engineering', '+1 (555) 678-9012', '2023-02-01', 82000, 'Active', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop', '987 Birch Ln, San Francisco, CA 94107', '+1 (555) 432-1098', '1993-12-10', 'Male'),
('EMP007', 'Ayesha Siddiqua', 'lisa.anderson@company.com', 'Sales Director', 'Sales', '+1 (555) 789-0123', '2019-04-12', 115000, 'Active', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop', '147 Cedar St, San Francisco, CA 94108', '+1 (555) 321-0987', '1986-02-18', 'Female'),
('EMP008', 'Shafiqul Islam', 'robert.martinez@company.com', 'DevOps Engineer', 'Engineering', '+1 (555) 890-1234', '2022-07-20', 92000, 'On Leave', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop', '258 Willow Dr, San Francisco, CA 94109', '+1 (555) 210-9876', '1989-09-05', 'Male')
ON CONFLICT (id) DO NOTHING;

-- Departments
INSERT INTO departments (id, name, head, employees_count, budget) VALUES
('dept-1', 'Engineering', 'Sadia Rahman', 45, 4500000),
('dept-2', 'Product', 'Mehdi Hasan', 12, 1200000),
('dept-3', 'Design', 'Nusrat Jahan', 8, 680000),
('dept-4', 'Marketing', 'Rakib Hossain', 15, 1350000),
('dept-5', 'Human Resources', 'Farhana Akter', 6, 528000),
('dept-6', 'Sales', 'Ayesha Siddiqua', 25, 2875000)
ON CONFLICT (id) DO NOTHING;

-- Roles
INSERT INTO roles (id, name, permissions, users_count) VALUES
('role-1', 'Admin', '["all"]', 3),
('role-2', 'HR Manager', '["employees", "attendance", "leaves", "payroll"]', 5),
('role-3', 'Manager', '["team_view", "attendance", "leaves"]', 12),
('role-4', 'Employee', '["self_view", "request_leave"]', 95)
ON CONFLICT (id) DO NOTHING;

-- Attendance Records
INSERT INTO attendance_records (id, employee_id, date, check_in, check_out, status, hours) VALUES
('att-1', 'EMP001', '2026-04-06', '09:00 AM', '06:00 PM', 'Present', '9.0'),
('att-2', 'EMP002', '2026-04-06', '08:45 AM', '05:45 PM', 'Present', '9.0'),
('att-3', 'EMP003', '2026-04-06', '09:15 AM', '06:15 PM', 'Late', '9.0'),
('att-4', 'EMP004', '2026-04-06', '09:00 AM', '06:00 PM', 'Present', '9.0'),
('att-5', 'EMP005', '2026-04-06', '08:30 AM', '05:30 PM', 'Present', '9.0'),
('att-6', 'EMP006', '2026-04-06', '09:30 AM', '06:30 PM', 'Late', '9.0'),
('att-7', 'EMP007', '2026-04-06', '09:00 AM', '06:00 PM', 'Present', '9.0'),
('att-8', 'EMP008', '2026-04-06', '-', '-', 'Absent', '0.0')
ON CONFLICT (id) DO NOTHING;

-- Leave Requests
INSERT INTO leave_requests (id, employee_id, employee_name, type, start_date, end_date, days, reason, status, applied_date) VALUES
('leave-1', 'EMP001', 'Sadia Rahman', 'Annual Leave', '2026-04-15', '2026-04-19', 5, 'Family vacation', 'Approved', '2026-03-20'),
('leave-2', 'EMP003', 'Nusrat Jahan', 'Sick Leave', '2026-04-08', '2026-04-09', 2, 'Medical appointment', 'Pending', '2026-04-05'),
('leave-3', 'EMP008', 'Shafiqul Islam', 'Parental Leave', '2026-04-01', '2026-04-30', 30, 'Newborn care', 'Approved', '2026-03-01'),
('leave-4', 'EMP002', 'Mehdi Hasan', 'Annual Leave', '2026-05-10', '2026-05-12', 3, 'Personal matters', 'Pending', '2026-04-04')
ON CONFLICT (id) DO NOTHING;

-- Leave Balances
INSERT INTO leave_balances (id, employee_id, annual_leave, sick_leave, casual_leave) VALUES
('lb-1', 'EMP001', 15, 10, 5),
('lb-2', 'EMP002', 18, 12, 7),
('lb-3', 'EMP003', 20, 10, 5),
('lb-4', 'EMP004', 22, 12, 8),
('lb-5', 'EMP005', 16, 10, 5),
('lb-6', 'EMP006', 12, 10, 5),
('lb-7', 'EMP007', 25, 12, 10),
('lb-8', 'EMP008', 14, 8, 5)
ON CONFLICT (id) DO NOTHING;

-- Payroll
INSERT INTO payroll (id, employee_id, employee_name, month, basic_salary, allowances, deductions, net_salary, status, pay_date) VALUES
('pay-1', 'EMP001', 'Sadia Rahman', 'March 2026', 95000, 5000, 8500, 91500, 'Paid', '2026-03-31'),
('pay-2', 'EMP002', 'Mehdi Hasan', 'March 2026', 105000, 6000, 10000, 101000, 'Paid', '2026-03-31'),
('pay-3', 'EMP003', 'Nusrat Jahan', 'March 2026', 85000, 4000, 7500, 81500, 'Paid', '2026-03-31')
ON CONFLICT (id) DO NOTHING;

-- Performance Reviews
INSERT INTO performance_reviews (id, employee_id, employee_name, period, rating, technical_skills, communication, teamwork, leadership, reviewer, review_date, comments, goals) VALUES
('perf-1', 'EMP001', 'Sadia Rahman', 'Q1 2026', 4.5, 5, 4, 5, 4, 'CTO', '2026-04-01', 'Excellent performance, strong technical leadership', '["Lead new project", "Mentor junior developers"]'),
('perf-2', 'EMP002', 'Mehdi Hasan', 'Q1 2026', 4.2, 4, 5, 4, 4, 'VP Product', '2026-04-02', 'Great product vision and stakeholder management', '["Launch mobile app", "Improve user engagement"]')
ON CONFLICT (id) DO NOTHING;
