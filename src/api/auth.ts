import type { AuthResponse, LoginPayload, RegisterPayload } from '../types'
import client from './clients'

export const login = async (payload: LoginPayload): Promise<AuthResponse> => {
    const { data } = await client.post<AuthResponse>('/auth/login', payload)
    return data
}

export const register = async (payload: RegisterPayload): Promise<{ message: string }> => {
    const { data } = await client.post('/auth/register', payload)
    return data
}

export const getMe = async () => {
    const { data } = await client.get('/auth/me')
    return data
}