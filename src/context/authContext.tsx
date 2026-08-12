import { createContext, useContext, useState, useEffect } from 'react'
import type { User } from '../types'

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  saveSession: (token: string, user: User) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<User | null>(null)
  const [token, setToken]     = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Al cargar la app, recuperar la sesión guardada
  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    const savedUser  = localStorage.getItem('user')

    if (savedToken && savedUser) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setToken(savedToken)
        setUser(JSON.parse(savedUser))
      } catch {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    const clearExpiredSession = () => {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setToken(null)
      setUser(null)
    }
    window.addEventListener('auth:unauthorized', clearExpiredSession)
    return () => window.removeEventListener('auth:unauthorized', clearExpiredSession)
  }, [])

  const saveSession = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      saveSession,
      logout,
      // Una sesión válida siempre debe contener el token y la identidad del usuario.
      isAuthenticated: !!token && !!user,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook para consumir el contexto fácilmente
// eslint-disable-next-line react-refresh/only-export-components
export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext debe usarse dentro de AuthProvider')
  return ctx
}
