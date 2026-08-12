import { Navigate } from 'react-router-dom'
import { useAuthContext } from '../context/authContext'

interface Props {
  children: React.ReactNode
  allowedRole?: 'customer' | 'operator' | 'admin'
}

export function ProtectedRoute({ children, allowedRole }: Props) {
  const { isAuthenticated, user, isLoading } = useAuthContext()

  if (isLoading) return <div style={{ textAlign: 'center', marginTop: '40px' }}>Cargando...</div>

  if (!isAuthenticated) return <Navigate to="/login" replace />

  if (allowedRole && user?.role !== allowedRole) {
    const homeByRole = { admin: '/admin', operator: '/operator', customer: '/dashboard' }
    return <Navigate to={homeByRole[user?.role ?? 'customer']} replace />
  }

  return <>{children}</>
}
