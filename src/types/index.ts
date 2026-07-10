export interface User {
    user_id: string
    name: string
    email: string
    role: 'customer' | 'operator'
}

export interface AuthResponse {
    token: string
    name: string
    email: string
    role: 'customer' | 'operator'
}

export interface LoginPayload {
    email: string
    password: string
}

export interface RegisterPayload {
    name: string
    email: string
    password: string
    phone?: string
    operator_key?: string
}
