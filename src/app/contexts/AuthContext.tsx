import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../../lib/supabase'
import type { Session, User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  /** Role derived from user_metadata.role, or inferred from the user's email */
  role: string
  /** Friendly display name for the signed-in user */
  displayName: string
  /** Two-letter initials based on displayName */
  initials: string
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  role: 'HR Admin',
  displayName: 'HR Admin',
  initials: 'HA',
})

function deriveRoleFromEmail(email?: string | null): string {
  if (!email) return 'HR Admin'
  const local = email.split('@')[0].toLowerCase()
  if (local === 'hr.admin' || local.startsWith('hr.admin')) return 'HR Admin'
  if (local === 'hr' || local.startsWith('hr.')) return 'HR'
  return 'Employee'
}

function toDisplayName(user: User | null, role: string): string {
  const metaName = user?.user_metadata?.name as string | undefined
  if (metaName && metaName.trim()) return metaName.trim()
  return role
}

function toInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get the initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const user = session?.user ?? null
  const role = (user?.user_metadata?.role as string) || deriveRoleFromEmail(user?.email)
  const displayName = toDisplayName(user, role)
  const initials = toInitials(displayName)

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        role,
        displayName,
        initials,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

/** Convenience check: true if role is Admin, HR Admin or HR */
export function isAdminOrHR(role: string): boolean {
  return role === 'Admin' || role === 'HR Admin' || role === 'HR'
}

/** Roles allowed to approve or reject leave requests */
export function canApproveLeaves(role: string): boolean {
  return role === 'Admin' || role === 'HR Admin'
}

/** True for the Employee self-service role */
export function isEmployee(role: string): boolean {
  return role === 'Employee'
}
