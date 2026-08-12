import { Navigate } from 'react-router-dom'
import { useAuthContext } from '../context/authContext'

interface Props {
  children: React.ReactNode
}

const homeByRole = {
  admin: '/admin',
  operator: '/operator',
  customer: '/dashboard',
} as const

/**
 * Evita que una sesión ya iniciada vuelva a las pantallas públicas.
 * También espera a que se restaure localStorage para no mostrar un
 * formulario de acceso durante un instante al recargar la aplicación.
 */
export function PublicOnlyRoute({ children }: Props) {
  const { isAuthenticated, user, isLoading } = useAuthContext()

  if (isLoading) return <div style={{ textAlign: 'center', marginTop: '40px' }}>Cargando...</div>

  if (isAuthenticated && user) {
    return <Navigate to={homeByRole[user.role]} replace />
  }

  return <>{children}</>
}
