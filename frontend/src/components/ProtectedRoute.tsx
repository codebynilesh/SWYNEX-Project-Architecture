import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LoadingSpinner } from './LoadingSpinner'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <LoadingSpinner fullPage label="Checking authentication..." />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

export function PublicOnly({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <LoadingSpinner fullPage label="Loading..." />
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}
