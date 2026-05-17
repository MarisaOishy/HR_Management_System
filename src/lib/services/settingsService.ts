import { supabase } from '../supabase'
import type { SystemSetting } from '../types/database'

export type SettingsMap = Record<string, any>

const DEFAULT_COMPANY_SETTINGS: SettingsMap = {
  company_name: 'BanglaHR',
  company_email: 'info@banglahr.com.bd',
  company_phone: '+880255000000',
  company_address: 'Motijheel C/A, Dhaka 1000, Bangladesh',
  company_website: 'https://banglahr.com.bd',
  industry: 'technology',
  office_start_time: '09:00',
  office_end_time: '17:00',
  working_days: '5',
  timezone: 'Asia/Dhaka',
  annual_leave_days: 20,
  sick_leave_days: 10,
  casual_leave_days: 5,
  email_notifications: true,
  leave_notifications: true,
  attendance_notifications: true,
}

const DEFAULT_SECURITY_SETTINGS: SettingsMap = {
  sms_2fa: false,
  authenticator_2fa: false,
  profile_visibility: true,
  activity_status: true,
  email_visibility: true,
}

export function getDefaultSettings(category: 'company' | 'security') {
  return category === 'company' ? DEFAULT_COMPANY_SETTINGS : DEFAULT_SECURITY_SETTINGS
}

export async function getSettingsMap(category: 'company' | 'security'): Promise<SettingsMap> {
  const defaults = getDefaultSettings(category)
  const { data, error } = await supabase
    .from('system_settings')
    .select('*')
    .in('key', Object.keys(defaults))

  if (error) throw error

  return (data ?? []).reduce<SettingsMap>((acc, setting) => {
    acc[setting.key] = setting.value
    return acc
  }, { ...defaults })
}

export async function saveSettingsMap(category: 'company' | 'security', values: SettingsMap, updatedBy = ''): Promise<void> {
  const defaults = getDefaultSettings(category)
  const keys = Object.keys(defaults)
  const rows = keys.map((key) => ({
    key,
    value: values[key] ?? defaults[key],
    category,
    description: readableDescription(key),
    updated_at: new Date().toISOString(),
    updated_by: updatedBy,
  }))

  const { error } = await supabase
    .from('system_settings')
    .upsert(rows, { onConflict: 'key' })

  if (error) throw error
}

export async function getRecentSecurityLogs(email?: string): Promise<SystemSetting[]> {
  const { data, error } = await supabase
    .from('system_settings')
    .select('*')
    .eq('category', 'security')
    .order('updated_at', { ascending: false })
    .limit(5)

  if (error) throw error
  return (data ?? []).filter((setting) => !email || !setting.updated_by || setting.updated_by === email) as SystemSetting[]
}

function readableDescription(key: string) {
  return key
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
