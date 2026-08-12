import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, register } from '../api/auth'
import { useAuthContext } from '../context/authContext'
import type { LoginPayload, RegisterPayload, User } from '../types'

export function useAuth() {
    const { saveSession, logout } = useAuthContext()
    const navigate = useNavigate()
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const handleLogin = async (payload: LoginPayload) => {
        setIsLoading(true)
        setError(null)
        try {
            const data = await login(payload)

            const user: User = {
                user_id: '',    // viene del token pero lo dejamos vacío por ahora
                name: data.name,
                email: data.email,
                role: data.role,
            }

            saveSession(data.token, user)

            // Redirigir según el rol
            if (data.role === 'operator') {
                navigate('/operator')
            } else {
                navigate('/dashboard')
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al iniciar sesión'
            // Axios manda el error del backend en err.response.data.error
            const axiosErr = err as { response?: { data?: { error?: string } } }
            setError(axiosErr.response?.data?.error ?? msg)
        } finally {
            setIsLoading(false)
        }
    }

    const handleRegister = async (payload: RegisterPayload) => {
        setIsLoading(true)
        setError(null)
        try {
            await register(payload)
            navigate('/login') // después de registrarse, ir al login
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { error?: string } } }
            setError(axiosErr.response?.data?.error ?? 'Error al registrarse')
        } finally {
            setIsLoading(false)
        }
    }

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return { handleLogin, handleRegister, handleLogout, error, isLoading }
}
