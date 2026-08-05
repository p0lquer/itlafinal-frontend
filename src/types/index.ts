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
    user_id?: string
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

export interface Customer {
  ID: string
  Name: string
  Phone: string
  Email: string
}

export interface Order {
  id: string
  customer_id: string
  service_type: string
  status: string
  pieces_count: number
  weight: number
  price: number
  notes: string
  estimated_time_minutes: number
  created_at: string
  updated_at: string
  ready_at?: string | null
}

export interface NewOrderPayload {
  customer_id: string
  notes: string
  pieces_count: number
  service_type: string
  weight: number

}

export interface NewCustomerPayload {
  id: string
  name: string
  phone: string
  email: string
}

export interface ServiceType {
  id: number
  name: string
  description: string
  base_price: number
  price_per_weight: number
  price_per_piece: number
}