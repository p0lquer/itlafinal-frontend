import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAnalytics } from '../api/admin'
import ThemeToggle from '../components/ThemeToggle'
import { useAuthContext } from '../context/authContext'
import type { AnalyticsDashboard, AnalyticsPoint } from '../types'
import './AdminAnalytics.css'

const money = (value: number) => new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(value)
const labels: Record<string, string> = { recibida: 'Recibidas', en_proceso: 'En proceso', lista: 'Listas', entregada: 'Entregadas', customer: 'Clientes', operator: 'Operadores', admin: 'Administradores' }
const color = ['#32e58d', '#63b3ff', '#f4c66b', '#bf94ff', '#ff8c9a', '#42d9c8']

function BarChart({ title, subtitle, points, currency = false }: { title: string; subtitle: string; points: AnalyticsPoint[]; currency?: boolean }) {
  const max = Math.max(...points.map((point) => point.value), 1)
  return <section className="analytics-card"><header><div><p>{subtitle}</p><h2>{title}</h2></div><span>{points.reduce((sum, point) => sum + point.value, 0).toLocaleString('es-DO')}</span></header><div className="analytics-bars">{points.length ? points.map((point, index) => <div className="analytics-bar" key={point.label}><div className="analytics-bar__track"><i style={{ height: `${Math.max(5, point.value / max * 100)}%`, background: color[index % color.length] }} title={`${point.label}: ${currency ? money(point.value) : point.value}`} /></div><b>{currency ? money(point.value) : point.value.toLocaleString('es-DO')}</b><small>{labels[point.label] ?? point.label}</small></div>) : <p className="analytics-empty">Aún no hay datos.</p>}</div></section>
}

export default function AdminAnalytics() {
  const { user, logout } = useAuthContext()
  const [data, setData] = useState<AnalyticsDashboard | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const load = useCallback(async () => { setLoading(true); setError(''); try { setData(await getAnalytics()) } catch { setError('No fue posible cargar las estadísticas. Intenta nuevamente.') } finally { setLoading(false) } }, [])
  useEffect(() => { const timer = window.setTimeout(() => { void load() }, 0); return () => window.clearTimeout(timer) }, [load])
  const summary = data?.summary
  return <main className="analytics-page"><header className="analytics-header"><div><span>TIMEGOBETTER · ADMINISTRACIÓN</span><h1>Estadísticas del negocio</h1><p>Una lectura clara de operación, clientes y cobros de demostración.</p></div><div><Link to="/admin">Gestionar usuarios</Link><ThemeToggle /><b>{user?.name ?? 'Administrador'}</b><button onClick={logout}>Cerrar sesión</button></div></header><section className="analytics-shell">{loading ? <div className="analytics-state">Calculando indicadores…</div> : error ? <div className="analytics-state"><p>{error}</p><button onClick={() => void load()}>Reintentar</button></div> : data && <><div className="analytics-heading"><div><p>VISTA GENERAL</p><h2>Así se mueve TimeGoBetter hoy</h2></div><button onClick={() => void load()}>↻ Actualizar datos</button></div><section className="analytics-kpis"><Kpi label="Órdenes de hoy" value={summary!.orders_today} accent="green" /><Kpi label="En proceso" value={summary!.in_process} accent="blue" /><Kpi label="Listas para retirar" value={summary!.ready_for_pickup} accent="gold" /><Kpi label="Entregadas hoy" value={summary!.delivered_today} accent="purple" /><Kpi label="Clientes activos" value={summary!.active_customers} accent="green" /><Kpi label="Ingresos cobrados" value={money(summary!.paid_revenue)} accent="green" /></section><section className="analytics-grid"><BarChart title="Órdenes por día" subtitle="ÚLTIMOS 7 DÍAS" points={data.orders_trend} /><BarChart title="Cobros registrados" subtitle="ÚLTIMOS 7 DÍAS · DEMO" points={data.revenue_trend} currency /><BarChart title="Estado de producción" subtitle="ÓRDENES ACTUALES E HISTÓRICAS" points={data.orders_by_status} /><BarChart title="Servicios más solicitados" subtitle="CATÁLOGO" points={data.orders_by_service} /><BarChart title="Composición de usuarios" subtitle="CUENTAS REGISTRADAS" points={data.users_by_role} /></section><p className="analytics-note">Los ingresos y comprobantes pertenecen al modo de pago simulado de esta demostración académica.</p></>}</section></main>
}

function Kpi({ label, value, accent }: { label: string; value: string | number; accent: string }) { return <article className={`analytics-kpi analytics-kpi--${accent}`}><span>{label}</span><strong>{value}</strong></article> }
