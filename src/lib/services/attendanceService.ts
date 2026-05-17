import { supabase } from '../../lib/supabase'
import type { AttendanceLog, AttendanceRecord, Employee } from '../../lib/types/database'

export type AttendanceStatus = 'Present' | 'Late' | 'Half Day' | 'Absent' | 'Leave' | 'Present (Late)'

export interface AttendanceWithEmployee extends AttendanceRecord {
  employee_name: string
  employee_role: string
  employee_avatar: string
  overtime_hours: string
  warning?: string
}

export interface AttendanceActionResult {
  record: AttendanceRecord
  statusLabel?: string
  workingTime?: string
  warning?: string
}

export const OFFICE_START = { hours: 9, minutes: 0 }
export const OFFICE_END = { hours: 17, minutes: 0 }
const HALF_DAY_WORK_HOURS = 4

function todayISO(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseTime12h(time: string): Date | null {
  if (!time || time === '-') return null
  const match = time.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i)
  if (!match) return null
  let hours = parseInt(match[1], 10)
  const mins = parseInt(match[2], 10)
  const period = match[3]?.toUpperCase()

  if (period === 'PM' && hours !== 12) hours += 12
  if (period === 'AM' && hours === 12) hours = 0

  const d = new Date()
  d.setHours(hours, mins, 0, 0)
  return d
}

function formatTimeTo12h(date: Date): string {
  let hours = date.getHours()
  const mins = date.getMinutes()
  const period = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12 || 12
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')} ${period}`
}

function calculateHours(checkIn: string, checkOut: string): string {
  const inT = parseTime12h(checkIn)
  const outT = parseTime12h(checkOut)
  if (!inT || !outT) return '0.00'

  let diff = (outT.getTime() - inT.getTime()) / (1000 * 60 * 60)
  if (diff < 0) diff += 24
  return Math.max(0, diff).toFixed(2)
}

function calculateOvertime(checkIn: string, checkOut: string): string {
  const outT = parseTime12h(checkOut)
  if (!outT) return '0.00'

  const officeEnd = new Date(outT)
  officeEnd.setHours(OFFICE_END.hours, OFFICE_END.minutes, 0, 0)
  if (outT.getTime() <= officeEnd.getTime()) return '0.00'

  return ((outT.getTime() - officeEnd.getTime()) / (1000 * 60 * 60)).toFixed(2)
}

function isLateCheckIn(checkIn: string): boolean {
  const inT = parseTime12h(checkIn)
  if (!inT) return false
  const officeStart = new Date(inT)
  officeStart.setHours(OFFICE_START.hours, OFFICE_START.minutes, 0, 0)
  return inT.getTime() > officeStart.getTime()
}

function isEarlyCheckout(checkOut: string): boolean {
  const outT = parseTime12h(checkOut)
  if (!outT) return false
  const officeEnd = new Date(outT)
  officeEnd.setHours(OFFICE_END.hours, OFFICE_END.minutes, 0, 0)
  return outT.getTime() < officeEnd.getTime()
}

function normalizeStatus(status: AttendanceStatus, checkIn: string, checkOut?: string): AttendanceStatus {
  if (status === 'Absent' || status === 'Leave') return status
  if (!checkIn || checkIn === '-') return 'Absent'

  const hours = checkOut && checkOut !== '-' ? parseFloat(calculateHours(checkIn, checkOut)) : 0
  if (checkOut && checkOut !== '-' && hours > 0 && hours < HALF_DAY_WORK_HOURS) return 'Half Day'
  if (isLateCheckIn(checkIn)) return 'Late'
  return 'Present'
}

function buildAttendanceWarning(checkIn?: string, checkOut?: string): string | undefined {
  if (checkIn && checkIn !== '-' && isLateCheckIn(checkIn)) {
    return 'Check-in is after the 9:00 AM office start.'
  }
  if (checkOut && checkOut !== '-' && isEarlyCheckout(checkOut)) {
    return 'Check-out is before the 5:00 PM office end.'
  }
  return undefined
}

async function addAttendanceLog(
  recordId: string,
  employeeId: string,
  action: string,
  previousValue: Partial<AttendanceRecord> | null,
  newValue: Partial<AttendanceRecord>,
  note?: string,
) {
  const { data: sessionData } = await supabase.auth.getSession()
  const actorEmail = sessionData.session?.user.email ?? 'system'

  const { error } = await supabase.from('attendance_logs').insert({
    attendance_record_id: recordId,
    employee_id: employeeId,
    action,
    previous_value: previousValue,
    new_value: newValue,
    note: note ?? '',
    actor_email: actorEmail,
  })

  if (error) {
    console.warn('Attendance log was not saved:', error.message)
  }
}

export async function getAttendanceRecords(date?: string) {
  let query = supabase.from('attendance_records').select('*')
  if (date) query = query.eq('date', date)
  const { data, error } = await query.order('date', { ascending: false })
  if (error) throw error
  return data as AttendanceRecord[]
}

export async function getAttendanceWithEmployees(date: string): Promise<AttendanceWithEmployee[]> {
  const { data: records, error: recErr } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('date', date)
    .order('check_in', { ascending: true })
  if (recErr) throw recErr

  const { data: employees, error: empErr } = await supabase
    .from('employees')
    .select('id, name, role, avatar, status')
    .order('name')
  if (empErr) throw empErr

  const { data: leaves, error: leaveErr } = await supabase
    .from('leave_requests')
    .select('employee_id')
    .eq('status', 'Approved')
    .lte('start_date', date)
    .gte('end_date', date)
  if (leaveErr) throw leaveErr

  const recordMap = new Map<string, AttendanceRecord>()
  for (const r of records ?? []) recordMap.set(r.employee_id, r as AttendanceRecord)

  const leaveMap = new Set<string>()
  for (const l of leaves ?? []) leaveMap.add(l.employee_id)

  return (employees ?? []).map((emp: any) => {
    const rec = recordMap.get(emp.id)
    if (rec) {
      return {
        ...rec,
        employee_name: emp.name,
        employee_role: emp.role,
        employee_avatar: emp.avatar,
        overtime_hours: calculateOvertime(rec.check_in, rec.check_out),
        warning: buildAttendanceWarning(rec.check_in, rec.check_out),
      }
    }

    return {
      id: `absent-${emp.id}`,
      employee_id: emp.id,
      date,
      check_in: '-',
      check_out: '-',
      status: leaveMap.has(emp.id) ? 'Leave' : 'Absent',
      hours: '0.00',
      employee_name: emp.name,
      employee_role: emp.role,
      employee_avatar: emp.avatar,
      overtime_hours: '0.00',
    }
  })
}

export async function getAttendanceByEmployee(employeeId: string) {
  const { data, error } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('employee_id', employeeId)
    .order('date', { ascending: false })
  if (error) throw error
  return data as AttendanceRecord[]
}

export async function getAttendanceLogs(recordId: string) {
  const { data, error } = await supabase
    .from('attendance_logs')
    .select('*')
    .eq('attendance_record_id', recordId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as AttendanceLog[]
}

export async function getAllEmployees() {
  const { data, error } = await supabase
    .from('employees')
    .select('id, name, role, avatar, status')
    .order('name')
  if (error) throw error
  return data as Pick<Employee, 'id' | 'name' | 'role' | 'avatar' | 'status'>[]
}

export interface CreateAttendanceInput {
  employee_id: string
  date: string
  status: AttendanceStatus
  check_in?: string
  check_out?: string
  note?: string
}

export async function createAttendance(input: CreateAttendanceInput): Promise<AttendanceRecord> {
  const { employee_id, date, status, check_in, check_out, note } = input

  const { data: employee, error: empErr } = await supabase
    .from('employees')
    .select('id')
    .eq('id', employee_id)
    .maybeSingle()
  if (empErr) throw empErr
  if (!employee) throw new Error('Employee could not be verified.')

  const { data: existing } = await supabase
    .from('attendance_records')
    .select('id')
    .eq('employee_id', employee_id)
    .eq('date', date)
    .maybeSingle()
  if (existing) throw new Error('Attendance record already exists for this employee on this date.')

  const ci = status === 'Absent' || status === 'Leave' ? '-' : (check_in || '-')
  const co = status === 'Absent' || status === 'Leave' ? '-' : (check_out || '-')
  if (status !== 'Absent' && status !== 'Leave' && ci === '-') {
    throw new Error('Check-in is required for present, late, or half-day attendance.')
  }
  if (co !== '-' && ci === '-') throw new Error('Check-in is required before check-out.')
  const hours = ci !== '-' && co !== '-' ? calculateHours(ci, co) : '0.00'
  const finalStatus = normalizeStatus(status, ci, co)

  const { data, error } = await supabase
    .from('attendance_records')
    .insert({ employee_id, date, check_in: ci, check_out: co, status: finalStatus, hours })
    .select()
    .single()
  if (error) throw error

  await addAttendanceLog(data.id, employee_id, 'create', null, data as AttendanceRecord, note)
  return data as AttendanceRecord
}

export interface UpdateAttendanceInput {
  status?: AttendanceStatus
  check_in?: string
  check_out?: string
  note?: string
}

export async function updateAttendance(recordId: string, input: UpdateAttendanceInput): Promise<AttendanceRecord> {
  const { data: current, error: fetchErr } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('id', recordId)
    .single()
  if (fetchErr) throw fetchErr
  if (!current) throw new Error('Attendance record not found.')

  const statusToUse = input.status ?? (current.status as AttendanceStatus)
  const ci = statusToUse === 'Absent' || statusToUse === 'Leave' ? '-' : (input.check_in ?? current.check_in ?? '-')
  const co = statusToUse === 'Absent' || statusToUse === 'Leave' ? '-' : (input.check_out ?? current.check_out ?? '-')
  if (co !== '-' && ci === '-') throw new Error('Check-in is required before check-out.')

  const hours = ci !== '-' && co !== '-' ? calculateHours(ci, co) : '0.00'
  const finalStatus = normalizeStatus(statusToUse, ci, co)

  const { data, error } = await supabase
    .from('attendance_records')
    .update({ status: finalStatus, check_in: ci, check_out: co, hours })
    .eq('id', recordId)
    .select()
    .single()
  if (error) throw error

  await addAttendanceLog(recordId, current.employee_id, 'correction', current, data as AttendanceRecord, input.note)
  return data as AttendanceRecord
}

export async function undoAttendanceCheckout(recordId: string, note = 'Undo check-out'): Promise<AttendanceRecord> {
  const { data: current, error: fetchErr } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('id', recordId)
    .single()
  if (fetchErr) throw fetchErr
  if (!current) throw new Error('Attendance record not found.')

  const status = normalizeStatus(current.status as AttendanceStatus, current.check_in, '-')
  const { data, error } = await supabase
    .from('attendance_records')
    .update({ check_out: '-', hours: '0.00', status })
    .eq('id', recordId)
    .select()
    .single()
  if (error) throw error

  await addAttendanceLog(recordId, current.employee_id, 'undo_checkout', current, data as AttendanceRecord, note)
  return data as AttendanceRecord
}

export async function deleteAttendance(recordId: string): Promise<void> {
  const { data: current } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('id', recordId)
    .maybeSingle()

  const { error } = await supabase.from('attendance_records').delete().eq('id', recordId)
  if (error) throw error
  if (current) {
    await addAttendanceLog(recordId, current.employee_id, 'delete', current, {}, 'Deleted attendance record')
  }
}

export async function getEmployeeByEmail(email: string) {
  const { data, error } = await supabase
    .from('employees')
    .select('id, name, role, avatar, status')
    .eq('email', email)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function getTodayRecord(employeeId: string): Promise<AttendanceRecord | null> {
  const { data, error } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('date', todayISO())
    .maybeSingle()
  if (error) throw error
  return data as AttendanceRecord | null
}

export async function selfCheckIn(employeeId: string): Promise<AttendanceActionResult> {
  const today = todayISO()
  const { data: employee, error: empErr } = await supabase
    .from('employees')
    .select('id, status')
    .eq('id', employeeId)
    .maybeSingle()
  if (empErr) throw empErr
  if (!employee) throw new Error('Employee identity could not be verified.')
  if (employee.status && employee.status !== 'Active') throw new Error('Only active employees can check in.')

  const { data: existing } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('date', today)
    .maybeSingle()
  if (existing?.check_in && existing.check_in !== '-') throw new Error('You have already checked in today.')

  const now = new Date()
  const checkInTime = formatTimeTo12h(now)
  const status = normalizeStatus('Present', checkInTime)

  const { data, error } = await supabase
    .from('attendance_records')
    .insert({
      employee_id: employeeId,
      date: today,
      check_in: checkInTime,
      check_out: '-',
      status,
      hours: '0.00',
    })
    .select()
    .single()
  if (error) throw error

  const warning = buildAttendanceWarning(checkInTime)
  await addAttendanceLog(data.id, employeeId, 'check_in', null, data as AttendanceRecord, warning)
  return { record: data as AttendanceRecord, statusLabel: status === 'Late' ? 'Late' : 'On Time', warning }
}

export async function selfCheckOut(employeeId: string): Promise<AttendanceActionResult> {
  const { data: existing, error: fetchErr } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('date', todayISO())
    .maybeSingle()
  if (fetchErr) throw fetchErr
  if (!existing || existing.check_in === '-') throw new Error('You must check in before checking out.')
  if (existing.check_out && existing.check_out !== '-') throw new Error('You have already checked out today.')

  const checkOutTime = formatTimeTo12h(new Date())
  const hours = calculateHours(existing.check_in, checkOutTime)
  const status = normalizeStatus(existing.status as AttendanceStatus, existing.check_in, checkOutTime)

  const totalMins = Math.round(parseFloat(hours) * 60)
  const workingTime = `${Math.floor(totalMins / 60)} hrs ${totalMins % 60} mins`

  const { data, error } = await supabase
    .from('attendance_records')
    .update({ check_out: checkOutTime, hours, status })
    .eq('id', existing.id)
    .select()
    .single()
  if (error) throw error

  const warning = buildAttendanceWarning(existing.check_in, checkOutTime)
  await addAttendanceLog(existing.id, employeeId, 'check_out', existing, data as AttendanceRecord, warning)
  return { record: data as AttendanceRecord, workingTime, warning }
}
