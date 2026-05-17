import { supabase } from '../../lib/supabase'
import type { Role } from '../../lib/types/database'

export async function getRoles() {
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .order('name')
  if (error) throw error
  return data as Role[]
}

export async function createRole(role: Omit<Role, 'id'>) {
  const { data, error } = await supabase
    .from('roles')
    .insert(role)
    .select()
    .single()
  if (error) throw error
  return data as Role
}

export async function updateRole(id: string, updates: Partial<Role>) {
  const { data, error } = await supabase
    .from('roles')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Role
}

export async function deleteRole(id: string) {
  const { error } = await supabase
    .from('roles')
    .delete()
    .eq('id', id)
  if (error) throw error
}
