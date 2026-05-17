import { supabase } from '../../lib/supabase'
import type { LeaveRequest, LeaveBalance, Employee } from '../../lib/types/database'

export async function getLeaveRequests(status?: string) {
  let query = supabase.from('leave_requests').select('*')
  if (status) {
    query = query.eq('status', status)
  }
  const { data, error } = await query.order('applied_date', { ascending: false })
  if (error) throw error
  return data as LeaveRequest[]
}

export async function getLeaveRequestsByEmployee(employeeId: string) {
  const { data, error } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('employee_id', employeeId)
    .order('applied_date', { ascending: false })
  if (error) throw error
  return data as LeaveRequest[]
}

export async function getEmployeeByEmailForLeave(email: string) {
  const { data, error } = await supabase
    .from('employees')
    .select('id, name, email')
    .eq('email', email)
    .maybeSingle()
  if (error) throw error
  return data as Pick<Employee, 'id' | 'name' | 'email'> | null
}

export async function createLeaveRequest(request: Omit<LeaveRequest, 'id'>) {
  const { data, error } = await supabase
    .from('leave_requests')
    .insert(request)
    .select()
    .single()
  if (error) throw error
  return data as LeaveRequest
}

export async function updateLeaveStatus(id: string, status: 'Approved' | 'Rejected') {
  const { data, error } = await supabase
    .from('leave_requests')
    .update({ status })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as LeaveRequest
}

export async function getLeaveBalances() {
  const { data, error } = await supabase
    .from('leave_balances')
    .select('*')
  if (error) throw error
  return data as LeaveBalance[]
}

export async function getLeaveBalanceByEmployee(employeeId: string) {
  const { data, error } = await supabase
    .from('leave_balances')
    .select('*')
    .eq('employee_id', employeeId)
    .maybeSingle()
  if (error) throw error
  return data as LeaveBalance | null
}

export async function deductLeaveBalance(employeeId: string, leaveType: string, days: number) {
  // Map leave type to the correct column
  let columnToUpdate: 'annual_leave' | 'sick_leave' | 'casual_leave' | '' = '';
  if (leaveType.toLowerCase().includes('annual')) columnToUpdate = 'annual_leave';
  else if (leaveType.toLowerCase().includes('sick')) columnToUpdate = 'sick_leave';
  else if (leaveType.toLowerCase().includes('casual')) columnToUpdate = 'casual_leave';
  else return; // Don't deduct for unpaid/parental etc if not in balance table

  const balance = await getLeaveBalanceByEmployee(employeeId);

  // If there's no balance row yet for this employee, create one using schema defaults
  // and subtract the requested days from the relevant column.
  if (!balance) {
    const defaults = { annual_leave: 20, sick_leave: 10, casual_leave: 5 };
    const newRow = {
      employee_id: employeeId,
      annual_leave: Math.max(0, defaults.annual_leave - (columnToUpdate === 'annual_leave' ? days : 0)),
      sick_leave: Math.max(0, defaults.sick_leave - (columnToUpdate === 'sick_leave' ? days : 0)),
      casual_leave: Math.max(0, defaults.casual_leave - (columnToUpdate === 'casual_leave' ? days : 0)),
    };
    const { data, error } = await supabase
      .from('leave_balances')
      .insert(newRow)
      .select()
      .single();
    if (error) throw error;
    return data as LeaveBalance;
  }

  // Calculate new balance and update
  const currentDays = balance[columnToUpdate] as number;
  const newDays = Math.max(0, currentDays - days);

  const { data, error } = await supabase
    .from('leave_balances')
    .update({ [columnToUpdate]: newDays })
    .eq('employee_id', employeeId)
    .select()
    .single();

  if (error) throw error;
  return data as LeaveBalance;
}
