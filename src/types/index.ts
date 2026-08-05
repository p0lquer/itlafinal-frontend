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
  ID: string
  CustomerID: string
  Status: string
  service_type?: string
  service_type_id?: string
  ServiceType?: string
  CreatedAt: string
  EstimatedTime: number
  ReadyAt?: string
  Notes?: string
  PiecesCount: number
  Weight: number
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
  ID: string
  Name: string
  Description: string
  Created_at: string
  base_price: number
  price_per_weight: number
  price_per_piece: number
}