import client from './clients'
import type { Customer, Order, NewOrderPayload, NewCustomerPayload } from '../types'
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

export async function getMyOrders() {
  const { data } = await client.get<Order[]>('/orders/mine')
  return data ?? []
}