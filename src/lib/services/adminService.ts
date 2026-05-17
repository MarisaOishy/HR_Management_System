import { supabase } from '../../lib/supabase'
import type {
  Employee,
  Department,
  Role,
  AuditLog,
  SystemSetting,
  LeaveRequest,
  PayrollRecord,
  AttendanceRecord,
} from '../../lib/types/database'

// ══════════════════════════════════════════════════════════════
// ADMIN DASHBOARD STATS
// ══════════════════════════════════════════════════════════════

export interface AdminDashboardStats {
  totalEmployees: number
  activeEmployees: number
  totalDepartments: number
  totalRoles: number
  pendingLeaves: number
  pendingPayrolls: number
  presentToday: number
  absentToday: number
  lateToday: number
  onLeaveToday: number
  monthlyPayroll: number
  recentAuditLogs: AuditLog[]
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const todayISO = new Date().toISOString().split('T')[0]

  // Parallel fetch for performance
  const [
    employeesRes,
    departmentsRes,
    rolesRes,
    pendingLeavesRes,
    pendingPayrollRes,
    attendanceRes,
    todayLeavesRes,
    payrollRes,
    auditRes,
  ] = await Promise.all([
    supabase.from('employees').select('id, status'),
    supabase.from('departments').select('id', { count: 'exact', head: true }),
    supabase.from('roles').select('id', { count: 'exact', head: true }),
    supabase.from('leave_requests').select('id', { count: 'exact', head: true }).eq('status', 'Pending'),
    supabase.from('payroll').select('id', { count: 'exact', head: true }).eq('status', 'Pending'),
    supabase.from('attendance_records').select('status').eq('date', todayISO),
    supabase.from('leave_requests').select('id').eq('status', 'Approved').lte('start_date', todayISO).gte('end_date', todayISO),
    supabase.from('payroll').select('net_salary, month').order('pay_date', { ascending: false }),
    supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(5),
  ])

  const employees = employeesRes.data ?? []
  const totalEmployees = employees.length
  const activeEmployees = employees.filter(e => e.status === 'Active').length

  const attendance = attendanceRes.data ?? []
  const presentToday = attendance.filter(r =>
    r.status === 'Present' || r.status === 'Present (Late)' || r.status === 'Late'
  ).length
  const lateToday = attendance.filter(r =>
    r.status === 'Present (Late)' || r.status === 'Late'
  ).length
  const onLeaveToday = (todayLeavesRes.data ?? []).length
  const absentToday = Math.max(0, totalEmployees - presentToday - onLeaveToday)

  let monthlyPayroll = 0
  const payrollData = payrollRes.data ?? []
  if (payrollData.length > 0) {
    const latestMonth = payrollData[0].month
    monthlyPayroll = payrollData
      .filter(p => p.month === latestMonth)
      .reduce((sum, p) => sum + (p.net_salary || 0), 0)
  }

  return {
    totalEmployees,
    activeEmployees,
    totalDepartments: departmentsRes.count ?? 0,
    totalRoles: rolesRes.count ?? 0,
    pendingLeaves: pendingLeavesRes.count ?? 0,
    pendingPayrolls: pendingPayrollRes.count ?? 0,
    presentToday,
    absentToday,
    lateToday,
    onLeaveToday,
    monthlyPayroll,
    recentAuditLogs: (auditRes.data ?? []) as AuditLog[],
  }
}

// ══════════════════════════════════════════════════════════════
// USER MANAGEMENT
// ══════════════════════════════════════════════════════════════

export async function getUsers(): Promise<Employee[]> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('name')
  if (error) throw error
  return data as Employee[]
}

export async function getUserById(id: string): Promise<Employee> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as Employee
}

export async function createUser(user: Omit<Employee, 'created_at'>): Promise<Employee> {
  const { data, error } = await supabase
    .from('employees')
    .insert(user)
    .select()
    .single()
  if (error) throw error
  return data as Employee
}

export async function updateUser(id: string, updates: Partial<Employee>): Promise<Employee> {
  const { data, error } = await supabase
    .from('employees')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Employee
}

export async function deleteUser(id: string): Promise<void> {
  const { error } = await supabase
    .from('employees')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function toggleUserStatus(id: string, currentStatus: string): Promise<Employee> {
  const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active'
  return updateUser(id, { status: newStatus })
}

// ══════════════════════════════════════════════════════════════
// ROLE & PERMISSION MANAGEMENT
// ══════════════════════════════════════════════════════════════

export const ALL_PERMISSIONS = [
  'employees.view', 'employees.create', 'employees.edit', 'employees.delete',
  'attendance.view', 'attendance.manage',
  'leaves.view', 'leaves.approve', 'leaves.request',
  'payroll.view', 'payroll.process', 'payroll.approve',
  'departments.view', 'departments.manage',
  'roles.view', 'roles.manage',
  'reports.view', 'reports.export',
  'settings.view', 'settings.manage',
  'audit.view',
  'admin.access',
] as const

export type Permission = typeof ALL_PERMISSIONS[number]

export async function getAdminRoles(): Promise<Role[]> {
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .order('name')
  if (error) throw error
  return data as Role[]
}

export async function createAdminRole(role: Omit<Role, 'id'>): Promise<Role> {
  const { data, error } = await supabase
    .from('roles')
    .insert(role)
    .select()
    .single()
  if (error) throw error
  return data as Role
}

export async function updateAdminRole(id: string, updates: Partial<Role>): Promise<Role> {
  const { data, error } = await supabase
    .from('roles')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Role
}

export async function deleteAdminRole(id: string): Promise<void> {
  const { error } = await supabase
    .from('roles')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ══════════════════════════════════════════════════════════════
// DEPARTMENT MANAGEMENT (Admin-level operations)
// ══════════════════════════════════════════════════════════════

export async function getAdminDepartments(): Promise<Department[]> {
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .order('name')
  if (error) throw error
  return data as Department[]
}

export async function createAdminDepartment(dept: Omit<Department, 'id'>): Promise<Department> {
  const { data, error } = await supabase
    .from('departments')
    .insert(dept)
    .select()
    .single()
  if (error) throw error
  return data as Department
}

export async function updateAdminDepartment(id: string, updates: Partial<Department>): Promise<Department> {
  const { data, error } = await supabase
    .from('departments')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Department
}

export async function deleteAdminDepartment(id: string): Promise<void> {
  const { error } = await supabase
    .from('departments')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ══════════════════════════════════════════════════════════════
// APPROVAL CENTER
// ══════════════════════════════════════════════════════════════

export interface ApprovalItem {
  id: string
  type: 'leave' | 'payroll' | 'attendance'
  title: string
  description: string
  requestedBy: string
  requestedDate: string
  status: string
  raw: any
}

export async function getPendingApprovals(): Promise<ApprovalItem[]> {
  const approvals: ApprovalItem[] = []

  // Pending leave requests
  const { data: leaves } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('status', 'Pending')
    .order('applied_date', { ascending: false })

  for (const leave of (leaves ?? []) as LeaveRequest[]) {
    approvals.push({
      id: leave.id,
      type: 'leave',
      title: `${leave.type} Request`,
      description: `${leave.days} day(s) from ${leave.start_date} to ${leave.end_date}. Reason: ${leave.reason || 'N/A'}`,
      requestedBy: leave.employee_name,
      requestedDate: leave.applied_date,
      status: leave.status,
      raw: leave,
    })
  }

  // Pending payroll
  const { data: payrolls } = await supabase
    .from('payroll')
    .select('*')
    .eq('status', 'Pending')
    .order('month', { ascending: false })

  for (const pay of (payrolls ?? []) as PayrollRecord[]) {
    approvals.push({
      id: pay.id,
      type: 'payroll',
      title: `Payroll — ${pay.month}`,
      description: `Net salary: Tk ${pay.net_salary.toLocaleString()} for ${pay.employee_name}`,
      requestedBy: pay.employee_name,
      requestedDate: pay.pay_date || '',
      status: pay.status,
      raw: pay,
    })
  }

  return approvals
}

export async function approveLeave(id: string): Promise<void> {
  const { error } = await supabase
    .from('leave_requests')
    .update({ status: 'Approved' })
    .eq('id', id)
  if (error) throw error
}

export async function rejectLeave(id: string): Promise<void> {
  const { error } = await supabase
    .from('leave_requests')
    .update({ status: 'Rejected' })
    .eq('id', id)
  if (error) throw error
}

export async function approvePayroll(id: string): Promise<void> {
  const { error } = await supabase
    .from('payroll')
    .update({ status: 'Paid', pay_date: new Date().toISOString().split('T')[0] })
    .eq('id', id)
  if (error) throw error
}

export async function rejectPayroll(id: string): Promise<void> {
  const { error } = await supabase
    .from('payroll')
    .update({ status: 'Rejected' })
    .eq('id', id)
  if (error) throw error
}

export async function getApprovalHistory(): Promise<ApprovalItem[]> {
  const approvals: ApprovalItem[] = []

  const { data: leaves } = await supabase
    .from('leave_requests')
    .select('*')
    .in('status', ['Approved', 'Rejected'])
    .order('applied_date', { ascending: false })
    .limit(50)

  for (const leave of (leaves ?? []) as LeaveRequest[]) {
    approvals.push({
      id: leave.id,
      type: 'leave',
      title: `${leave.type} Request`,
      description: `${leave.days} day(s) — ${leave.reason || 'N/A'}`,
      requestedBy: leave.employee_name,
      requestedDate: leave.applied_date,
      status: leave.status,
      raw: leave,
    })
  }

  const { data: payrolls } = await supabase
    .from('payroll')
    .select('*')
    .in('status', ['Paid', 'Rejected'])
    .order('pay_date', { ascending: false })
    .limit(50)

  for (const pay of (payrolls ?? []) as PayrollRecord[]) {
    approvals.push({
      id: pay.id,
      type: 'payroll',
      title: `Payroll — ${pay.month}`,
      description: `Net salary: Tk ${pay.net_salary.toLocaleString()}`,
      requestedBy: pay.employee_name,
      requestedDate: pay.pay_date || '',
      status: pay.status,
      raw: pay,
    })
  }

  return approvals
}

// ══════════════════════════════════════════════════════════════
// AUDIT LOGS
// ══════════════════════════════════════════════════════════════

export async function getAuditLogs(filters?: {
  action?: string
  resource_type?: string
  actor_email?: string
  limit?: number
}): Promise<AuditLog[]> {
  let query = supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters?.action) query = query.eq('action', filters.action)
  if (filters?.resource_type) query = query.eq('resource_type', filters.resource_type)
  if (filters?.actor_email) query = query.ilike('actor_email', `%${filters.actor_email}%`)

  query = query.limit(filters?.limit ?? 100)

  const { data, error } = await query
  if (error) throw error
  return data as AuditLog[]
}

export async function createAuditLog(log: {
  actor_email: string
  action: string
  resource_type: string
  resource_id?: string
  details?: Record<string, any>
}): Promise<void> {
  const { error } = await supabase
    .from('audit_logs')
    .insert({
      actor_id: '',
      actor_email: log.actor_email,
      action: log.action,
      resource_type: log.resource_type,
      resource_id: log.resource_id || '',
      details: log.details || {},
      ip_address: '',
    })
  if (error) throw error
}

// ══════════════════════════════════════════════════════════════
// REPORTS & ANALYTICS
// ══════════════════════════════════════════════════════════════

export interface AttendanceReportRow {
  employee_id: string
  employee_name: string
  total_present: number
  total_absent: number
  total_late: number
  total_leave: number
  avg_hours: string
}

export async function getAttendanceReport(month: string): Promise<AttendanceReportRow[]> {
  // Parse month like "2026-04" → start/end dates
  const [year, mon] = month.split('-').map(Number)
  const startDate = `${year}-${String(mon).padStart(2, '0')}-01`
  const lastDay = new Date(year, mon, 0).getDate()
  const endDate = `${year}-${String(mon).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  const { data: employees } = await supabase.from('employees').select('id, name').order('name')
  const { data: records } = await supabase
    .from('attendance_records')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)

  const empMap = new Map<string, string>()
  for (const e of (employees ?? [])) empMap.set(e.id, e.name)

  const grouped = new Map<string, AttendanceRecord[]>()
  for (const r of (records ?? []) as AttendanceRecord[]) {
    const list = grouped.get(r.employee_id) || []
    list.push(r)
    grouped.set(r.employee_id, list)
  }

  const result: AttendanceReportRow[] = []
  for (const [empId, empName] of empMap) {
    const recs = grouped.get(empId) || []
    const totalPresent = recs.filter(r => r.status === 'Present' || r.status === 'Present (Late)').length
    const totalLate = recs.filter(r => r.status === 'Late' || r.status === 'Present (Late)').length
    const totalAbsent = recs.filter(r => r.status === 'Absent').length
    const totalLeave = recs.filter(r => r.status === 'Leave').length
    const hours = recs.map(r => parseFloat(r.hours || '0')).filter(h => h > 0)
    const avgHours = hours.length > 0 ? (hours.reduce((a, b) => a + b, 0) / hours.length).toFixed(1) : '0.0'

    result.push({
      employee_id: empId,
      employee_name: empName,
      total_present: totalPresent,
      total_absent: totalAbsent,
      total_late: totalLate,
      total_leave: totalLeave,
      avg_hours: avgHours,
    })
  }

  return result
}

export interface PayrollReportRow {
  employee_name: string
  month: string
  basic_salary: number
  allowances: number
  deductions: number
  net_salary: number
  status: string
}

export async function getPayrollReport(month?: string): Promise<PayrollReportRow[]> {
  let query = supabase.from('payroll').select('*').order('employee_name')
  if (month) query = query.eq('month', month)

  const { data, error } = await query
  if (error) throw error

  return (data ?? []).map((p: any) => ({
    employee_name: p.employee_name,
    month: p.month,
    basic_salary: p.basic_salary,
    allowances: p.allowances,
    deductions: p.deductions,
    net_salary: p.net_salary,
    status: p.status,
  }))
}

export interface EmployeeGrowthPoint {
  month: string
  count: number
}

export async function getEmployeeGrowthReport(): Promise<EmployeeGrowthPoint[]> {
  const { data: employees, error } = await supabase
    .from('employees')
    .select('join_date')
    .order('join_date')
  if (error) throw error

  const emps = employees ?? []
  const now = new Date()
  const result: EmployeeGrowthPoint[] = []

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
    const monthName = d.toLocaleString('en-US', { month: 'short', year: '2-digit' })
    const cutoff = d.toISOString().split('T')[0]
    const count = emps.filter(e => e.join_date <= cutoff).length
    result.push({ month: monthName, count })
  }

  return result
}

export interface LeaveTrendPoint {
  month: string
  approved: number
  rejected: number
  pending: number
}

export async function getLeaveTrendReport(): Promise<LeaveTrendPoint[]> {
  const { data: leaves, error } = await supabase
    .from('leave_requests')
    .select('status, applied_date')
    .order('applied_date')
  if (error) throw error

  const now = new Date()
  const result: LeaveTrendPoint[] = []

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthName = d.toLocaleString('en-US', { month: 'short' })
    const year = d.getFullYear()
    const month = d.getMonth()

    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const lastDay = new Date(year, month + 1, 0).getDate()
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    const monthLeaves = (leaves ?? []).filter(
      (l: any) => l.applied_date >= startDate && l.applied_date <= endDate
    )

    result.push({
      month: monthName,
      approved: monthLeaves.filter((l: any) => l.status === 'Approved').length,
      rejected: monthLeaves.filter((l: any) => l.status === 'Rejected').length,
      pending: monthLeaves.filter((l: any) => l.status === 'Pending').length,
    })
  }

  return result
}

// ══════════════════════════════════════════════════════════════
// SYSTEM SETTINGS
// ══════════════════════════════════════════════════════════════

export async function getSystemSettings(category?: string): Promise<SystemSetting[]> {
  let query = supabase.from('system_settings').select('*').order('key')
  if (category) query = query.eq('category', category)

  const { data, error } = await query
  if (error) throw error
  return data as SystemSetting[]
}

export async function updateSystemSetting(id: string, value: any, updatedBy: string): Promise<SystemSetting> {
  const { data, error } = await supabase
    .from('system_settings')
    .update({
      value,
      updated_at: new Date().toISOString(),
      updated_by: updatedBy,
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as SystemSetting
}

// ══════════════════════════════════════════════════════════════
// CSV EXPORT UTILITY
// ══════════════════════════════════════════════════════════════

export function exportToCSV(data: Record<string, any>[], filename: string): void {
  if (data.length === 0) return

  const headers = Object.keys(data[0])
  const csvRows = [
    headers.join(','),
    ...data.map(row =>
      headers.map(h => {
        const val = row[h]
        const str = val === null || val === undefined ? '' : String(val)
        return `"${str.replace(/"/g, '""')}"`
      }).join(',')
    ),
  ]

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.click()
  URL.revokeObjectURL(url)
}
