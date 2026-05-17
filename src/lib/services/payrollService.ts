import { supabase } from '../../lib/supabase'
import type { PayrollRecord } from '../../lib/types/database'

export async function getPayrollData(month?: string) {
  let query = supabase.from('payroll').select('*')
  if (month) {
    query = query.eq('month', month)
  }
  const { data, error } = await query.order('pay_date', { ascending: false })
  if (error) throw error
  return data as PayrollRecord[]
}

export async function getPayslip(id: string) {
  const { data, error } = await supabase
    .from('payroll')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as PayrollRecord
}

export async function getPayrollByEmployee(employeeId: string) {
  const { data, error } = await supabase
    .from('payroll')
    .select('*')
    .eq('employee_id', employeeId)
    .order('pay_date', { ascending: false })
  if (error) throw error
  return data as PayrollRecord[]
}

export async function createPayrollRecord(record: Omit<PayrollRecord, 'id'>) {
  const { data, error } = await supabase
    .from('payroll')
    .insert(record)
    .select()
    .single()
  if (error) throw error
  return data as PayrollRecord
}
