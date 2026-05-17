import { Navigate } from 'react-router'
import { useAuth } from '../contexts/AuthContext'

interface AdminProtectedRouteProps {
  children: React.ReactNode
}

/**
 * Route guard that restricts access to Admin-role users only.
 * Reuses the existing AuthContext pattern. Non-admin users
 * are redirected to the main dashboard.
 */
export default function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { user, loading, role } = useAuth()

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />
  }

  if (role !== 'Admin') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
