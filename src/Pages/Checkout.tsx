import { useEffect, useMemo, useState } from 'react'
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
  const initialOrder = useMemo(() => orderFrom((state as { order?: unknown } | null)?.order), [state])
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
        if (!initialOrder) setLoading(true)
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
        <div className="checkout-grid"><section className="checkout-card checkout-detail-card"><div className="card-glow" /><h2>Detalle del servicio</h2><div className="checkout-order-id">Orden #{order.ID.slice(0, 8).toUpperCase()}</div><div className="checkout-details"><div><span>Servicio</span><strong>{order.ServiceType}</strong></div><div><span>Peso</span><strong>{order.Weight} lb</strong></div><div><span>Piezas</span><strong>{order.PiecesCount}</strong></div><div><span>Estado</span><strong className="checkout-ready">Lista para retirar</strong></div></div>{order.Notes && <p className="checkout-notes"><span>Notas</span>{order.Notes}</p>}</section>
          <section className="checkout-card checkout-payment"><h2>Forma de pago</h2><div className="checkout-methods">{([['card', 'Tarjeta', 'Pago simulado con tarjeta'], ['transfer', 'Transferencia', 'Confirmación inmediata'], ['cash', 'Efectivo', 'Paga al retirar tus prendas']] as [PaymentMethod, string, string][]).map(([value, label, description]) => <label key={value} className={method === value ? 'is-selected' : ''}><input type="radio" name="payment" value={value} checked={method === value} onChange={() => setMethod(value)} /><span className="payment-radio" aria-hidden="true" /><span className="payment-copy"><strong>{label}</strong><small>{description}</small></span></label>)}</div><div className="checkout-total"><span>Total a pagar</span><strong>{money(current.total, current.currency)}</strong><small>Impuestos incluidos</small></div>{error && <p className="checkout-error" role="alert">{error}</p>}<button className="checkout-pay-button" onClick={() => void confirmPayment()} disabled={paying}>{paying ? 'Procesando pago…' : `Pagar ${money(current.total, current.currency)}`}</button><p className="checkout-secure"><span aria-hidden="true">⌑</span> Pago seguro · Recibirás tu comprobante al confirmar.</p></section></div>
      </>}
    </section>
  </main>
}

function Invoice({ receipt, onPrint }: { receipt: PaymentReceipt, onPrint: () => void }) {
  const order = receipt.order
  const invoiceNumber = receipt.invoice_number ?? `TGB-${order.ID.slice(0, 8).toUpperCase()}`
  const customerName = (order as Order & { CustomerName?: string }).CustomerName || 'Cliente TimeGoBetter'
  return <section className="invoice-wrap"><div className="invoice-actions no-print"><button className="invoice-print" onClick={onPrint}>⌑ Descargar PDF</button><Link to="/dashboard">Ir a mis órdenes</Link></div><section className="invoice" id="invoice"><div className="invoice-watermark" aria-hidden="true">PAGADO</div><div className="invoice-body"><header className="invoice-header"><div><p className="invoice-kicker">TIMEGOBETTER · FACTURA DIGITAL</p><h1>Factura</h1><strong>TimeGoBetter</strong><p>Servicios de lavandería</p></div><div className="invoice-reference"><p><span>Factura #</span><strong>{invoiceNumber}</strong></p><p><span>Fecha</span><strong>{date(receipt.paid_at)}</strong></p><p><span>Orden ID</span><strong>#{order.ID.slice(0, 8).toUpperCase()}</strong></p></div></header><section className="invoice-client"><span>Cliente</span><strong>{customerName}</strong></section><section className="invoice-table"><div className="invoice-table-head"><span>Servicio</span><span>Piezas</span><span>Peso</span><span>Total</span></div><div className="invoice-line"><strong>{order.ServiceType}</strong><span>{order.PiecesCount}</span><span>{order.Weight} lb</span><strong>{money(receipt.total, receipt.currency)}</strong></div></section><section className="invoice-summary"><div className="invoice-paid">✓ <span>PAGADO</span></div><div className="invoice-totals"><p><span>Subtotal</span><strong>{money(receipt.total, receipt.currency)}</strong></p><p><span>Impuestos (ITBIS)</span><strong>Incluido</strong></p><p className="invoice-grand-total"><span>Total</span><strong>{money(receipt.total, receipt.currency)}</strong></p></div></section><footer className="invoice-footer"><p>Gracias por confiar en <strong>TimeGoBetter</strong>.</p><span>Presenta esta factura al retirar tus prendas.</span></footer></div></section></section>
}
