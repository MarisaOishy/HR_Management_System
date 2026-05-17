export interface Database {
  public: {
    Tables: {
      employees: {
        Row: Employee
        Insert: Omit<Employee, 'created_at'> & { created_at?: string }
        Update: Partial<Omit<Employee, 'id'>>
      }
      departments: {
        Row: Department
        Insert: Omit<Department, 'id'> & { id?: string }
        Update: Partial<Omit<Department, 'id'>>
      }
      roles: {
        Row: Role
        Insert: Omit<Role, 'id'> & { id?: string }
        Update: Partial<Omit<Role, 'id'>>
      }
      attendance_records: {
        Row: AttendanceRecord
        Insert: Omit<AttendanceRecord, 'id'> & { id?: string }
        Update: Partial<Omit<AttendanceRecord, 'id'>>
      }
      attendance_logs: {
        Row: AttendanceLog
        Insert: Omit<AttendanceLog, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<AttendanceLog, 'id'>>
      }
      leave_requests: {
        Row: LeaveRequest
        Insert: Omit<LeaveRequest, 'id'> & { id?: string }
        Update: Partial<Omit<LeaveRequest, 'id'>>
      }
      leave_balances: {
        Row: LeaveBalance
        Insert: Omit<LeaveBalance, 'id'> & { id?: string }
        Update: Partial<Omit<LeaveBalance, 'id'>>
      }
      payroll: {
        Row: PayrollRecord
        Insert: Omit<PayrollRecord, 'id'> & { id?: string }
        Update: Partial<Omit<PayrollRecord, 'id'>>
      }
      performance_reviews: {
        Row: PerformanceReview
        Insert: Omit<PerformanceReview, 'id'> & { id?: string }
        Update: Partial<Omit<PerformanceReview, 'id'>>
      }
      audit_logs: {
        Row: AuditLog
        Insert: Omit<AuditLog, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<AuditLog, 'id'>>
      }
      system_settings: {
        Row: SystemSetting
        Insert: Omit<SystemSetting, 'id'> & { id?: string }
        Update: Partial<Omit<SystemSetting, 'id'>>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// ── Row types ────────────────────────────────────────────────

export interface Employee {
  id: string
  name: string
  email: string
  role: string
  department: string
  phone: string
  join_date: string
  salary: number
  status: string
  avatar: string
  address: string
  emergency_contact: string
  date_of_birth: string
  gender: string
  created_at: string
}

export interface Department {
  id: string
  name: string
  head: string
  employees_count: number
  budget: number
}

export interface Role {
  id: string
  name: string
  permissions: string[]
  users_count: number
}

export interface AttendanceRecord {
  id: string
  employee_id: string
  date: string
  check_in: string
  check_out: string
  status: string
  hours: string
}

export interface AttendanceLog {
  id: string
  attendance_record_id: string
  employee_id: string
  action: string
  previous_value: Partial<AttendanceRecord> | null
  new_value: Partial<AttendanceRecord>
  note: string
  actor_email: string
  created_at: string
}

export interface LeaveRequest {
  id: string
  employee_id: string
  employee_name: string
  type: string
  start_date: string
  end_date: string
  days: number
  reason: string
  status: string
  applied_date: string
}

export interface LeaveBalance {
  id: string
  employee_id: string
  annual_leave: number
  sick_leave: number
  casual_leave: number
}

export interface PayrollRecord {
  id: string
  employee_id: string
  employee_name: string
  month: string
  basic_salary: number
  allowances: number
  deductions: number
  net_salary: number
  status: string
  pay_date: string
}

export interface PerformanceReview {
  id: string
  employee_id: string
  employee_name: string
  period: string
  rating: number
  technical_skills: number
  communication: number
  teamwork: number
  leadership: number
  reviewer: string
  review_date: string
  comments: string
  goals: string[]
}

// ── Admin Module types ───────────────────────────────────────

export interface AuditLog {
  id: string
  actor_id: string
  actor_email: string
  action: string
  resource_type: string
  resource_id: string
  details: Record<string, any>
  ip_address: string
  created_at: string
}

export interface SystemSetting {
  id: string
  key: string
  value: any
  category: string
  description: string
  updated_at: string
  updated_by: string
}
