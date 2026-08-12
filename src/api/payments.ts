import client from './clients'
import type { PaymentMethod, PaymentReceipt, PaymentRecord, PaymentSummary } from '../types'

/** Resumen que se muestra antes de cobrar una orden lista para retiro. */
export async function getPaymentSummary(orderId: string) {
  const { data } = await client.get<PaymentSummary>(`/orders/${orderId}/payment-summary`)
  return data
}

/** Pago simulado: el backend registra el cobro y devuelve el comprobante. */
export async function payOrder(orderId: string, method: PaymentMethod) {
  const { data } = await client.post<PaymentReceipt>(`/orders/${orderId}/payments`, { method })
  return data
}

export async function getPaymentHistory() {
  const { data } = await client.get<{ data: PaymentRecord[] }>('/payments/mine')
  return data.data
}
