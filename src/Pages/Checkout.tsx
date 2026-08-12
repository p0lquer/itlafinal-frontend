import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import { getPaymentSummary, payOrder } from '../api/payments'
import type { Order, PaymentMethod, PaymentReceipt, PaymentSummary } from '../types'
import './Checkout.css'

const money = (value: number, currency = 'DOP') => new Intl.NumberFormat('es-DO', { style: 'currency', currency }).format(value || 0)
const date = (value?: string) => value ? new Date(value).toLocaleString('es-DO', { dateStyle: 'medium', timeStyle: 'short' }) : '--'
const orderFrom = (raw: unknown): Order | null => {
  if (!raw || typeof raw !== 'object') return null
  const row = raw as Record<string, unknown>
  const id = String(row.ID ?? row.id ?? '')
  if (!id) return null
  return { ID: id, CustomerID: String(row.CustomerID ?? row.customer_id ?? ''), Status: String(row.Status ?? row.status ?? ''), ServiceType: String(row.ServiceType ?? row.service_type ?? ''), PiecesCount: Number(row.PiecesCount ?? row.pieces_count ?? 0), Weight: Number(row.Weight ?? row.weight ?? 0), price: Number(row.price ?? row.estimated_cost ?? 0), EstimatedTime: Number(row.EstimatedTime ?? row.estimated_time_minutes ?? 0), CreatedAt: String(row.CreatedAt ?? row.created_at ?? ''), updated_at: String(row.updated_at ?? ''), Notes: String(row.Notes ?? row.notes ?? '') }
}

export default function Checkout() {
  const { orderId = '' } = useParams()
  const { state } = useLocation()
  const initialOrder = orderFrom((state as { order?: unknown } | null)?.order)
  const [summary, setSummary] = useState<PaymentSummary | null>(initialOrder ? { order: initialOrder, subtotal: initialOrder.price, total: initialOrder.price, currency: 'DOP', payment_status: initialOrder.payment_status === 'paid' ? 'paid' : 'pending' } : null)
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null)
  const [method, setMethod] = useState<PaymentMethod>('card')
  const [loading, setLoading] = useState(!initialOrder)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    void (async () => {
      try {
        setLoading(true)
        const result = await getPaymentSummary(orderId)
        if (alive) setSummary({ ...result, order: orderFrom(result.order) ?? result.order })
      } catch {
        if (alive && !initialOrder) setError('No pudimos cargar el detalle de cobro. Vuelve a intentarlo desde tus órdenes.')
      } finally { if (alive) setLoading(false) }
    })()
    return () => { alive = false }
  }, [initialOrder, orderId])

  const current = receipt ?? summary
  const order = current?.order
  async function confirmPayment() {
    if (!order) return
    setPaying(true); setError('')
    try { setReceipt(await payOrder(order.ID, method)) }
    catch { setError('No se pudo registrar el pago. Confirma tu conexión e inténtalo nuevamente.') }
    finally { setPaying(false) }
  }

  if (loading) return <main className="checkout-page checkout-loading">Preparando tu cobro seguro…</main>
  if (!current || !order) return <main className="checkout-page checkout-loading"><p>{error || 'Orden no disponible.'}</p><Link to="/dashboard">Volver a mis órdenes</Link></main>
  const completed = Boolean(receipt || current.payment_status === 'paid')
  return <main className="checkout-page">
    <header className="checkout-topbar"><Link to="/dashboard" className="checkout-brand">TimeGoBetter <span>· Portal del cliente</span></Link><ThemeToggle /></header>
    <section className="checkout-shell">
      <Link className="checkout-back" to="/dashboard">← Volver a mis órdenes</Link>
      {completed ? <Invoice receipt={(receipt ?? current) as PaymentReceipt} onPrint={() => window.print()} /> : <>
        <div className="checkout-intro"><p className="checkout-eyebrow">PAGO SEGURO</p><h1>Revisa y paga tu orden</h1><p>Confirma el detalle de tu servicio antes de finalizar el cobro.</p></div>
        <div className="checkout-grid"><section className="checkout-card"><h2>Detalle del servicio</h2><div className="checkout-order-id">Orden #{order.ID.slice(0, 8).toUpperCase()}</div><div className="checkout-details"><div><span>Servicio</span><strong>{order.ServiceType}</strong></div><div><span>Peso</span><strong>{order.Weight} lb</strong></div><div><span>Piezas</span><strong>{order.PiecesCount}</strong></div><div><span>Estado</span><strong className="checkout-ready">Lista para retirar</strong></div></div>{order.Notes && <p className="checkout-notes"><span>Notas</span>{order.Notes}</p>}</section>
          <section className="checkout-card checkout-payment"><h2>Forma de pago</h2><div className="checkout-methods">{([['card','Tarjeta','Pago simulado con tarjeta'],['transfer','Transferencia','Confirmación inmediata'],['cash','Efectivo','Paga al retirar tus prendas']] as [PaymentMethod,string,string][]).map(([value,label,description]) => <label key={value} className={method === value ? 'is-selected' : ''}><input type="radio" name="payment" value={value} checked={method === value} onChange={() => setMethod(value)} /><strong>{label}</strong><small>{description}</small></label>)}</div><div className="checkout-total"><span>Total a pagar</span><strong>{money(current.total, current.currency)}</strong><small>Impuestos incluidos</small></div>{error && <p className="checkout-error" role="alert">{error}</p>}<button className="checkout-pay-button" onClick={() => void confirmPayment()} disabled={paying}>{paying ? 'Procesando pago…' : `Pagar ${money(current.total, current.currency)}`}</button><p className="checkout-secure">🔒 Pago seguro · Recibirás tu comprobante al confirmar.</p></section></div>
      </>}
    </section>
  </main>
}

function Invoice({ receipt, onPrint }: { receipt: PaymentReceipt, onPrint: () => void }) {
  const order = receipt.order
  return <section className="invoice" id="invoice"><div className="invoice-hero"><p>TIMEGOBETTER · COMPROBANTE DIGITAL</p><h1>¡Pago confirmado!</h1><span>Gracias por confiar en nuestro cuidado.</span></div><div className="invoice-body"><div className="invoice-meta"><div><span>Factura</span><strong>{receipt.invoice_number ?? `TGB-${order.ID.slice(0, 8).toUpperCase()}`}</strong></div><div><span>Fecha de pago</span><strong>{date(receipt.paid_at)}</strong></div><div><span>Método</span><strong>{{ card: 'Tarjeta', transfer: 'Transferencia', cash: 'Efectivo' }[receipt.payment_method] ?? 'Pago'}</strong></div></div><hr /><div className="invoice-line"><div><strong>{order.ServiceType}</strong><span>{order.PiecesCount} {order.PiecesCount === 1 ? 'pieza' : 'piezas'} · {order.Weight} lb</span></div><strong>{money(receipt.total, receipt.currency)}</strong></div><div className="invoice-total"><span>Total pagado</span><strong>{money(receipt.total, receipt.currency)}</strong></div><div className="invoice-footer"><span>Orden #{order.ID.slice(0, 8).toUpperCase()} · Estado: lista para retirar</span><strong>Presenta esta factura al retirar tus prendas.</strong></div><div className="invoice-actions"><button onClick={onPrint}>Descargar factura PDF</button><Link to="/dashboard">Ir a mis órdenes</Link></div></div></section>
}
