import { supabase } from '../../lib/supabase'
import type { Employee, AttendanceRecord, LeaveRequest, PayrollRecord, Department } from '../../lib/types/database'

// ── Dashboard Stats ─────────────────────────────────────────
export interface DashboardStats {
  totalEmployees: number
  presentToday: number
  presentPercentage: string
  pendingLeaves: number
  monthlyPayroll: number
  lateToday: number
  absentToday: number
  onLeaveToday: number
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const todayISO = new Date().toISOString().split('T')[0]

  // Fetch all active employees
  const { data: employees, error: empErr } = await supabase
    .from('employees')
    .select('id, status')
  if (empErr) throw empErr
  const totalEmployees = (employees ?? []).length

  // Fetch today's attendance records
  const { data: attendance, error: attErr } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('date', todayISO)
  if (attErr) throw attErr

  const records = (attendance ?? []) as AttendanceRecord[]
  const presentToday = records.filter(r =>
    r.status === 'Present' || r.status === 'Present (Late)' || r.status === 'Late'
  ).length
  const lateToday = records.filter(r =>
    r.status === 'Present (Late)' || r.status === 'Late'
  ).length

  // Fetch approved leaves overlapping today for on-leave count
  const { data: todayLeaves, error: tlErr } = await supabase
    .from('leave_requests')
    .select('id')
    .eq('status', 'Approved')
    .lte('start_date', todayISO)
    .gte('end_date', todayISO)
  if (tlErr) throw tlErr
  const onLeaveToday = (todayLeaves ?? []).length

  // Absent = total employees - present - on leave (who haven't checked in)
  const checkedInIds = new Set(records.map(r => r.employee_id))
  const leaveIds = new Set((todayLeaves ?? []).map((l: any) => l.employee_id))
  const absentToday = totalEmployees - presentToday - onLeaveToday

  const presentPercentage = totalEmployees > 0
    ? ((presentToday / totalEmployees) * 100).toFixed(1)
    : '0.0'

  // Pending leave requests
  const { count: pendingLeaves, error: plErr } = await supabase
    .from('leave_requests')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'Pending')
  if (plErr) throw plErr

  // Monthly payroll: sum net_salary for the most recent month
  const { data: payrollData, error: payErr } = await supabase
    .from('payroll')
    .select('net_salary, month')
    .order('pay_date', { ascending: false })
  if (payErr) throw payErr

  let monthlyPayroll = 0
  if (payrollData && payrollData.length > 0) {
    const latestMonth = payrollData[0].month
    monthlyPayroll = payrollData
      .filter(p => p.month === latestMonth)
      .reduce((sum, p) => sum + (p.net_salary || 0), 0)
  }

  return {
    totalEmployees,
    presentToday,
    presentPercentage,
    pendingLeaves: pendingLeaves ?? 0,
    monthlyPayroll,
    lateToday,
    absentToday: Math.max(0, absentToday),
    onLeaveToday,
  }
}

// ── Attendance Trend (last 6 months) ────────────────────────
export interface AttendanceTrendPoint {
  month: string
  present: number
  absent: number
  late: number
}

export async function getAttendanceTrend(): Promise<AttendanceTrendPoint[]> {
  const now = new Date()
  const result: AttendanceTrendPoint[] = []

  // Get total employees count (for absent calculation)
  const { count: totalEmp } = await supabase
    .from('employees')
    .select('id', { count: 'exact', head: true })

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year = d.getFullYear()
    const month = d.getMonth()
    const monthName = d.toLocaleString('en-US', { month: 'short' })

    // Date range for this month
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const lastDay = new Date(year, month + 1, 0).getDate()
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    const { data: records, error } = await supabase
      .from('attendance_records')
      .select('status, employee_id, date')
      .gte('date', startDate)
      .lte('date', endDate)
    if (error) throw error

    const recs = records ?? []

    // Count unique employee-days
    const presentDays = recs.filter(r =>
      r.status === 'Present' || r.status === 'Present (Late)' || r.status === 'Late'
    ).length
    const lateDays = recs.filter(r =>
      r.status === 'Present (Late)' || r.status === 'Late'
    ).length
    const absentDays = recs.filter(r => r.status === 'Absent').length

    result.push({
      month: monthName,
      present: presentDays,
      absent: absentDays,
      late: lateDays,
    })
  }

  return result
}

// ── Employee Growth (last 6 months based on join_date) ──────
export interface EmployeeGrowthPoint {
  month: string
  count: number
}

export async function getEmployeeGrowth(): Promise<EmployeeGrowthPoint[]> {
  const { data: employees, error } = await supabase
    .from('employees')
    .select('join_date')
    .order('join_date')
  if (error) throw error

  const emps = employees ?? []
  const now = new Date()
  const result: EmployeeGrowthPoint[] = []

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i + 1, 0) // last day of month
    const monthName = d.toLocaleString('en-US', { month: 'short' })
    const cutoff = d.toISOString().split('T')[0]

    // Count employees who joined on or before this month's end
    const count = emps.filter(e => e.join_date <= cutoff).length
    result.push({ month: monthName, count })
  }

  return result
}

// ── Department Distribution ─────────────────────────────────
export interface DeptDistribution {
  name: string
  value: number
}

export async function getDepartmentDistribution(): Promise<DeptDistribution[]> {
  const { data: departments, error } = await supabase
    .from('departments')
    .select('name, employees_count')
    .order('employees_count', { ascending: false })
  if (error) throw error

  return (departments ?? []).map(d => ({
    name: d.name,
    value: d.employees_count || 0,
  }))
}

// ── Recent Activities (from leave_requests + attendance) ─────
export interface RecentActivity {
  id: string
  user: string
  action: string
  details: string
  timestamp: string
  icon: 'calendar' | 'check' | 'user' | 'briefcase'
}

export async function getRecentActivities(): Promise<RecentActivity[]> {
  const activities: RecentActivity[] = []

  // Recent leave requests (last 10)
  const { data: leaves, error: leaveErr } = await supabase
    .from('leave_requests')
    .select('*')
    .order('applied_date', { ascending: false })
    .limit(10)
  if (leaveErr) throw leaveErr

  for (const leave of (leaves ?? []) as LeaveRequest[]) {
    const action =
      leave.status === 'Pending' ? 'submitted leave request' :
      leave.status === 'Approved' ? 'had leave request approved' :
      'had leave request rejected'

    activities.push({
      id: `leave-${leave.id}`,
      user: leave.employee_name,
      action,
      details: `${leave.type} (${formatDateRange(leave.start_date, leave.end_date)})`,
      timestamp: getRelativeTime(leave.applied_date),
      icon: 'calendar',
    })
  }

  // Recent attendance check-ins today
  const todayISO = new Date().toISOString().split('T')[0]
  const { data: todayAtt, error: attErr } = await supabase
    .from('attendance_records')
    .select('*, employees!inner(name)')
    .eq('date', todayISO)
    .order('check_in', { ascending: false })
    .limit(5)

  // If the join doesn't work, try a simpler approach
  if (!attErr && todayAtt) {
    for (const att of todayAtt) {
      const empName = (att as any).employees?.name || 'Employee'
      if (att.check_in && att.check_in !== '-') {
        activities.push({
          id: `att-in-${att.id}`,
          user: empName,
          action: 'checked in',
          details: `at ${att.check_in}${att.status === 'Present (Late)' ? ' (Late)' : ''}`,
          timestamp: 'Today',
          icon: 'check',
        })
      }
    }
  }

  // Sort by timestamp relevance and return top 6
  return activities.slice(0, 6)
}

// ── Helpers ─────────────────────────────────────────────────

function formatDateRange(start: string, end: string): string {
  const s = new Date(start + 'T00:00:00')
  const e = new Date(end + 'T00:00:00')
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  if (s.getFullYear() !== e.getFullYear()) {
    return `${s.toLocaleDateString('en-US', { ...opts, year: 'numeric' })} – ${e.toLocaleDateString('en-US', { ...opts, year: 'numeric' })}`
  }
  return `${s.toLocaleDateString('en-US', opts)} – ${e.toLocaleDateString('en-US', { ...opts, year: 'numeric' })}`
}

function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week(s) ago`
  return `${Math.floor(diffDays / 30)} month(s) ago`
}
