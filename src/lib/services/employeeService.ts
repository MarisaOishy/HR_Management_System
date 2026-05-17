import { supabase } from '../../lib/supabase'
import type { Employee } from '../../lib/types/database'
import { inferPhoneCountry, toInternationalPhone } from '../phone'

export const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024
export const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export function validateAvatarFile(file: File): string | null {
  if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
    return 'Please select a valid image file (JPG, PNG, WebP, or GIF).'
  }
  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    return 'Image must be smaller than 5 MB.'
  }
  return null
}

function getAvatarStoragePath(publicUrl?: string | null): string | null {
  if (!publicUrl || publicUrl.startsWith('data:')) return null

  const marker = '/storage/v1/object/public/avatars/'
  const markerIndex = publicUrl.indexOf(marker)
  if (markerIndex === -1) return null

  const pathWithQuery = publicUrl.slice(markerIndex + marker.length)
  return decodeURIComponent(pathWithQuery.split('?')[0])
}

/**
 * Upload an avatar image file.
 * Tries Supabase Storage bucket "avatars" first.
 * Falls back to a base-64 data URL so the feature always works.
 */
export async function uploadAvatar(file: File, employeeId: string): Promise<string> {
  const validationError = validateAvatarFile(file)
  if (validationError) throw new Error(validationError)

  const ext = file.name.split('.').pop() ?? 'png'
  const filePath = `${employeeId}-${Date.now()}.${ext}`

  try {
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) throw uploadError

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
    return data.publicUrl
  } catch {
    // Fallback: convert to data URL so it still works without a storage bucket
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  }
}

export async function replaceAvatar(file: File, employeeId: string, oldAvatarUrl?: string | null): Promise<string> {
  const nextAvatarUrl = await uploadAvatar(file, employeeId)
  const oldPath = getAvatarStoragePath(oldAvatarUrl)

  if (oldPath) {
    await supabase.storage.from('avatars').remove([oldPath])
  }

  return nextAvatarUrl
}

export async function getEmployees() {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('name')
  if (error) throw error
  return data as Employee[]
}

export async function getEmployeeById(id: string) {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as Employee
}

export async function createEmployee(employee: Omit<Employee, 'created_at'>) {
  const normalizedPhone = normalizeEmployeePhone(employee.phone)
  await ensureUniqueEmployeePhone(normalizedPhone)

  const { data, error } = await supabase
    .from('employees')
    .insert({ ...employee, phone: normalizedPhone })
    .select()
    .single()
  if (error) throw error
  return data as Employee
}

export async function updateEmployee(id: string, updates: Partial<Employee>) {
  const normalizedUpdates = { ...updates }
  if (updates.phone !== undefined) {
    normalizedUpdates.phone = normalizeEmployeePhone(updates.phone)
    await ensureUniqueEmployeePhone(normalizedUpdates.phone, id)
  }

  const { data, error } = await supabase
    .from('employees')
    .update(normalizedUpdates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Employee
}

export async function deleteEmployee(id: string) {
  const { error } = await supabase
    .from('employees')
    .delete()
    .eq('id', id)
  if (error) throw error
}

function normalizeEmployeePhone(phone?: string | null) {
  if (!phone) throw new Error('Phone number is required.')
  return toInternationalPhone(phone, inferPhoneCountry(phone))
}

function normalizePhoneForCompare(phone?: string | null) {
  if (!phone) return ''
  try {
    return normalizeEmployeePhone(phone)
  } catch {
    return phone.replace(/\D/g, '')
  }
}

async function ensureUniqueEmployeePhone(phone: string, currentEmployeeId?: string) {
  const { data, error } = await supabase
    .from('employees')
    .select('id, phone')

  if (error) throw error

  const duplicate = (data ?? []).find((employee) => {
    if (currentEmployeeId && employee.id === currentEmployeeId) return false
    return normalizePhoneForCompare(employee.phone) === phone
  })

  if (duplicate) {
    throw new Error('Another employee already uses this phone number.')
  }
}
