import { supabase } from '../../lib/supabase'
import type { Department } from '../../lib/types/database'

export async function getDepartments() {
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .order('name')
  if (error) throw error
  return data as Department[]
}

export async function getDepartmentById(id: string) {
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as Department
}

export async function createDepartment(department: Omit<Department, 'id'>) {
  const { data, error } = await supabase
    .from('departments')
    .insert(department)
    .select()
    .single()
  if (error) throw error
  return data as Department
}

export async function updateDepartment(id: string, updates: Partial<Department>) {
  const { data, error } = await supabase
    .from('departments')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Department
}

export async function deleteDepartment(id: string) {
  const { error } = await supabase
    .from('departments')
    .delete()
    .eq('id', id)
  if (error) throw error
}
