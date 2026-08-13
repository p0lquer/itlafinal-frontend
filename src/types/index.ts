export interface User {
    user_id: string
    name: string
    email: string
    role: 'customer' | 'operator' | 'admin'
}

export interface AuthResponse {
    token: string
    name: string
    email: string
    role: 'customer' | 'operator' | 'admin'
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
  payment_status?: 'pending' | 'paid' | 'cancelled' | string

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
  id: number
  name: string
  description: string
  base_price: number
  price_per_weight: number
  price_per_piece: number
  /** Compatibilidad temporal para el callback existente del selector. */
  Name: string
}

export type PaymentMethod = 'card' | 'cash' | 'transfer'

export interface PaymentSummary {
  order: Order
  subtotal: number
  total: number
  currency: string
  payment_status: 'pending' | 'paid' | 'cancelled'
  invoice_number?: string
  paid_at?: string
}

export interface PaymentReceipt extends PaymentSummary {
  payment_method: PaymentMethod
}

export interface PaymentRecord {
  id: string
  order_id: string
  amount: number
  currency: string
  method: PaymentMethod
  status: 'paid'
  receipt_number: string
  paid_at: string
}

export type UserRole = 'customer' | 'operator' | 'admin'

export interface AdminUser {
  id: string
  name: string
  email: string
  role: UserRole
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface PaginationMeta {
  page: number
  page_size: number
  total: number
  total_pages: number
}

export interface AdminUsersResponse {
  users: AdminUser[]
  pagination: PaginationMeta
}

export interface AnalyticsPoint { label: string; value: number }
export interface AnalyticsDashboard {
  summary: { orders_today: number; in_process: number; ready_for_pickup: number; delivered_today: number; active_customers: number; paid_revenue: number }
  orders_by_status: AnalyticsPoint[]
  orders_by_service: AnalyticsPoint[]
  orders_trend: AnalyticsPoint[]
  revenue_trend: AnalyticsPoint[]
  users_by_role: AnalyticsPoint[]
}
