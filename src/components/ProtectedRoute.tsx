import { Navigate } from 'react-router-dom'
import { useAuthContext } from '../context/authContext'

interface Props {
  children: React.ReactNode
  allowedRole?: 'customer' | 'operator'
}

export function ProtectedRoute({ children, allowedRole }: Props) {
  const { isAuthenticated, user, isLoading } = useAuthContext()

  if (isLoading) return <div style={{ textAlign: 'center', marginTop: '40px' }}>Cargando...</div>

  if (!isAuthenticated) return <Navigate to="/login" replace />

  if (allowedRole && user?.role !== allowedRole) {
    return <Navigate to={user?.role === 'operator' ? '/operator' : '/dashboard'} replace />
  }

  return <>{children}</>
}