import client from './clients'

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
  CreatedAt: string
}

export interface NewOrderPayload {
  customer_id: string
  notes: string
  pieces_count: number
  service_type: string
}

export interface NewCustomerPayload {
  id: string
  name: string
  phone: string
  email: string
}

export async function getCustomers() {
  const { data } = await client.get<Customer[]>('/customers')
  return data ?? []
}

export async function getOrders() {
  const { data } = await client.get<Order[]>('/orders')
  return data ?? []
}

export async function createOrder(payload: NewOrderPayload) {
  const { data } = await client.post('/orders', payload)
  return data
}

export async function createCustomer(payload: NewCustomerPayload) {
  const { data } = await client.post('/customers', payload)
  return data
}

export async function updateOrderStatus(orderId: string, status: string) {
  const { data } = await client.patch(`/orders/${orderId}/status`, { status })
  return data
}

export async function deleteOrder(orderId: string) {
  const { data } = await client.delete(`/orders/${orderId}`)
  return data
}