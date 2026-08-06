export interface User {
    user_id: string
    name: string
    email: string
    role: 'customer' | 'operator'
}

export interface AuthResponse {
    Token: string
    Name: string
    Email: string
    Role: 'customer' | 'operator'
    user_id?: string
}

export interface LoginPayload {
    Email: string
    Password: string
}

export interface RegisterPayload {
    Name: string
    Email: string
    Password: string
    Phone?: string
    OperatorKey?: string
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
  ServiceType?: string
  service_type_id?: string
  PiecesCount: number
  Weight: number
  price: number
  EstimatedTime: number
  CreatedAt: string
  updated_at: string
  ReadyAt?: string
  Notes?: string

}

export interface NewOrderPayload {
  CustomerID: string
  Notes: string
  PiecesCount: number
  ServiceType: string
  Weight: number

}

export interface NewCustomerPayload {
  id: string
  name: string
  phone: string
  email: string
}

export interface ServiceType {
  ID: number
  Name: string
  Description: string
  BasePrice: number
  PricePerWeight: number
  PricePerPiece: number
}