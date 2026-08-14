import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAnalytics } from '../api/admin'
import ThemeToggle from '../components/ThemeToggle'
import { useAuthContext } from '../context/authContext'
import type { AnalyticsDashboard, AnalyticsPoint } from '../types'
import './AdminAnalytics.css'

const money = (value: number) => new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(value)
const labels: Record<string, string> = { recibida: 'Recibidas', en_proceso: 'En proceso', lista: 'Listas', entregada: 'Entregadas', customer: 'Clientes', operator: 'Operadores', admin: 'Administradores' }
const color = ['#16864d', '#1769a7', '#9a6500', '#7a4caf', '#b13b50', '#087f76']

function BarChart({ title, subtitle, points, currency = false }: { title: string; subtitle: string; points: AnalyticsPoint[]; currency?: boolean }) {
  const safePoints = points.filter((point) => Number.isFinite(point.value) && point.value >= 0 && point.label.trim() !== '')
  const max = Math.max(...safePoints.map((point) => point.value), 1)
  const total = safePoints.reduce((sum, point) => sum + point.value, 0)
  return <section className="analytics-card" aria-labelledby={`chart-${title}`}><header><div><p>{subtitle}</p><h2 id={`chart-${title}`}>{title}</h2></div><span aria-label={`Total: ${currency ? money(total) : total.toLocaleString('es-DO')}`}>{currency ? money(total) : total.toLocaleString('es-DO')}</span></header><div className="analytics-bars">{safePoints.length ? safePoints.map((point, index) => {
    const value = currency ? money(point.value) : point.value.toLocaleString('es-DO')
    const label = labels[point.label] ?? point.label
    return <div className="analytics-bar" key={point.label} tabIndex={0} aria-label={`${label}: ${value}`}><div className="analytics-bar__track" aria-hidden="true"><i style={{ height: `${point.value > 0 ? Math.max(5, point.value / max * 100) : 0}%`, background: color[index % color.length] }} /></div><b>{value}</b><small title={label}>{label}</small></div>
  }) : <p className="analytics-empty">Aún no hay datos.</p>}</div></section>
}

export default function AdminAnalytics() {
  const { user, logout } = useAuthContext()
  const [data, setData] = useState<AnalyticsDashboard | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const hasData = useRef(false)
  const latestRequest = useRef(0)
  const load = useCallback(async () => {
    const requestId = ++latestRequest.current
    const isRefresh = hasData.current
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError('')
    try {
      const response = await getAnalytics()
      if (requestId !== latestRequest.current) return
      setData(response)
      hasData.current = true
    } catch {
      if (requestId !== latestRequest.current) return
      setError('No fue posible cargar las estadísticas. Intenta nuevamente.')
    } finally {
      if (requestId === latestRequest.current) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }, [])
  useEffect(() => { const timer = window.setTimeout(() => { void load() }, 0); return () => window.clearTimeout(timer) }, [load])
  const summary = data?.summary
  const refreshLabel = refreshing ? 'Actualizando…' : '↻ Actualizar datos'
  return <main className="analytics-page"><header className="analytics-header"><div><span>TIMEGOBETTER · ADMINISTRACIÓN</span><h1>Estadísticas del negocio</h1><p>Una lectura clara de operación, clientes y cobros de demostración.</p></div><nav aria-label="Acciones de administración"><Link to="/admin">Gestionar usuarios</Link><ThemeToggle /><b>{user?.name ?? 'Administrador'}</b><button type="button" onClick={logout}>Cerrar sesión</button></nav></header><section className="analytics-shell">{loading ? <div className="analytics-state" role="status" aria-live="polite">Calculando indicadores…</div> : !data && error ? <div className="analytics-state" role="alert"><p>{error}</p><button type="button" onClick={() => void load()}>Reintentar</button></div> : data && <><div className="analytics-heading"><div><p>VISTA GENERAL</p><h2>Así se mueve TimeGoBetter hoy</h2></div><button type="button" disabled={refreshing} onClick={() => void load()}>{refreshLabel}</button></div>{error && <p className="analytics-refresh-error" role="alert">{error}</p>}<section className="analytics-kpis" aria-label="Indicadores principales"><Kpi label="Órdenes de hoy" value={summary!.orders_today} accent="green" /><Kpi label="En proceso" value={summary!.in_process} accent="blue" /><Kpi label="Listas para retirar" value={summary!.ready_for_pickup} accent="gold" /><Kpi label="Entregadas hoy" value={summary!.delivered_today} accent="purple" /><Kpi label="Clientes activos" value={summary!.active_customers} accent="green" /><Kpi label="Ingresos cobrados (histórico)" value={money(summary!.paid_revenue)} accent="green" /></section><section className="analytics-grid"><BarChart title="Órdenes por día" subtitle="ÚLTIMOS 7 DÍAS" points={data.orders_trend} /><BarChart title="Cobros registrados" subtitle="ÚLTIMOS 7 DÍAS · DEMO" points={data.revenue_trend} currency /><BarChart title="Estado de producción" subtitle="ÓRDENES ACTUALES E HISTÓRICAS" points={data.orders_by_status} /><BarChart title="Servicios más solicitados" subtitle="CATÁLOGO" points={data.orders_by_service} /><BarChart title="Composición de usuarios" subtitle="CUENTAS REGISTRADAS" points={data.users_by_role} /></section><p className="analytics-note">Los ingresos y comprobantes pertenecen al modo de pago simulado de esta demostración académica.</p></>}</section></main>
}

function Kpi({ label, value, accent }: { label: string; value: string | number; accent: string }) { return <article className={`analytics-kpi analytics-kpi--${accent}`}><span>{label}</span><strong>{value}</strong></article> }
