import { useCallback, useEffect, useState } from 'react'
import { useAuthContext } from '../context/authContext'
import { deleteAdminUser, getAdminUsers, setUserActive, type AdminUserFilters } from '../api/admin'
import type { AdminUser, UserRole } from '../types'
import ThemeToggle from '../components/ThemeToggle'
import './AdminDashboard.css'

const PAGE_SIZE = 5
const roleLabel: Record<UserRole, string> = { customer: 'Cliente', operator: 'Operador', admin: 'Administrador' }

type Toast = { message: string; tone: 'success' | 'error' } | null
type PendingAction = { user: AdminUser; action: 'block' | 'unblock' | 'delete' } | null

function messageFrom(error: unknown, fallback: string) {
  const response = error as { response?: { data?: { error?: string; message?: string } } }
  return response.response?.data?.message ?? response.response?.data?.error ?? fallback
}

function dateLabel(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function AdminDashboard() {
  const { user, logout } = useAuthContext()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [filters, setFilters] = useState<AdminUserFilters>({ page: 1, page_size: PAGE_SIZE, search: '', role: '', status: '' })
  const [searchInput, setSearchInput] = useState('')
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState<Toast>(null)
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [saving, setSaving] = useState(false)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await getAdminUsers(filters)
      setUsers(response.users ?? [])
      setTotal(response.pagination?.total ?? 0)
      setTotalPages(Math.max(1, response.pagination?.total_pages ?? 1))
    } catch (requestError) {
      setError(messageFrom(requestError, 'No fue posible cargar los usuarios.'))
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    // Programar la carga evita actualizar estado de forma sincrÃ³nica al montar.
    const timer = window.setTimeout(() => { void loadUsers() }, 0)
    return () => window.clearTimeout(timer)
  }, [loadUsers])
  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => setToast(null), 4000)
    return () => window.clearTimeout(id)
  }, [toast])

  const updateFilters = (values: Partial<AdminUserFilters>) => setFilters((current) => ({ ...current, ...values, page: 1 }))
  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault()
    updateFilters({ search: searchInput.trim() })
  }

  const confirmAction = async () => {
    if (!pendingAction) return
    const { user: target, action } = pendingAction
    setSaving(true)
    try {
      if (action === 'delete') await deleteAdminUser(target.id)
      else await setUserActive(target.id, action === 'unblock')
      setToast({ tone: 'success', message: action === 'delete' ? 'Usuario eliminado correctamente.' : `Usuario ${action === 'block' ? 'bloqueado' : 'desbloqueado'} correctamente.` })
      setPendingAction(null)
      await loadUsers()
    } catch (requestError) {
      setToast({ tone: 'error', message: messageFrom(requestError, 'No se pudo completar esta acción.') })
    } finally {
      setSaving(false)
    }
  }

  const actionDescription = pendingAction?.action === 'delete'
    ? `Eliminarás de forma permanente a ${pendingAction.user.name}. Esta acción no se puede deshacer.`
    : `${pendingAction?.action === 'block' ? 'Bloquearás' : 'Desbloquearás'} a ${pendingAction?.user.name}. ${pendingAction?.action === 'block' ? 'No podrá iniciar sesión mientras esté bloqueado.' : 'Podrá volver a iniciar sesión.'}`

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div className="admin-header__content">
          <div>
            <span className="admin-kicker">TimeGoBetter · Administración</span>
            <h1>Gestión de usuarios</h1>
            <p>Administra clientes y operadores desde un solo lugar.</p>
          </div>
          <div className="admin-profile">
            <ThemeToggle />
            <span>{user?.name ?? 'Administrador'}</span>
            <button type="button" onClick={logout}>Cerrar sesión</button>
          </div>
        </div>
      </header>

      <section className="admin-shell" aria-label="Panel de usuarios">
        <div className="admin-summary"><strong>{total}</strong><span>usuarios registrados</span></div>
        <div className="admin-card">
          <div className="admin-toolbar">
            <form className="admin-search" onSubmit={submitSearch}>
              <label className="sr-only" htmlFor="admin-user-search">Buscar usuario</label>
              <input id="admin-user-search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Buscar por nombre o correo" />
              <button type="submit">Buscar</button>
            </form>
            <div className="admin-filters">
              <select aria-label="Filtrar por rol" value={filters.role} onChange={(event) => updateFilters({ role: event.target.value as UserRole | '' })}>
                <option value="">Todos los roles</option><option value="customer">Clientes</option><option value="operator">Operadores</option><option value="admin">Administradores</option>
              </select>
              <select aria-label="Filtrar por estado" value={filters.status} onChange={(event) => updateFilters({ status: event.target.value as 'active' | 'blocked' | '' })}>
                <option value="">Todos los estados</option><option value="active">Activos</option><option value="blocked">Bloqueados</option>
              </select>
            </div>
          </div>

          {loading ? <div className="admin-state"><span className="admin-spinner" />Cargando usuarios…</div> : error ? (
            <div className="admin-state admin-state--error"><p>{error}</p><button type="button" onClick={() => void loadUsers()}>Reintentar</button></div>
          ) : users.length === 0 ? (
            <div className="admin-state"><span className="admin-empty-icon">⌕</span><h2>No hay usuarios para mostrar</h2><p>Ajusta los filtros o realiza otra búsqueda.</p></div>
          ) : <>
            <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Usuario</th><th>Rol</th><th>Estado</th><th>Registro</th><th><span className="sr-only">Acciones</span></th></tr></thead>
              <tbody>{users.map((listedUser) => <tr key={listedUser.id}>
                <td data-label="Usuario"><strong>{listedUser.name}</strong><span>{listedUser.email}</span></td>
                <td data-label="Rol"><span className={`admin-badge admin-badge--${listedUser.role}`}>{roleLabel[listedUser.role] ?? listedUser.role}</span></td>
                <td data-label="Estado"><span className={`admin-status ${listedUser.is_active ? 'admin-status--active' : 'admin-status--blocked'}`}>{listedUser.is_active ? 'Activo' : 'Bloqueado'}</span></td>
                <td data-label="Registro">{dateLabel(listedUser.created_at)}</td>
                <td className="admin-actions" data-label="Acciones">
                  {listedUser.id !== user?.user_id && <>
                    <button type="button" onClick={() => setPendingAction({ user: listedUser, action: listedUser.is_active ? 'block' : 'unblock' })}>{listedUser.is_active ? 'Bloquear' : 'Desbloquear'}</button>
                    <button type="button" className="admin-delete" onClick={() => setPendingAction({ user: listedUser, action: 'delete' })}>Eliminar</button>
                  </>}
                </td>
              </tr>)}</tbody></table></div>
            <nav className="admin-pagination" aria-label="Paginación de usuarios"><span>Página {filters.page} de {totalPages}</span><div><button type="button" disabled={filters.page <= 1} onClick={() => setFilters((value) => ({ ...value, page: value.page - 1 }))}>Anterior</button><button type="button" disabled={filters.page >= totalPages} onClick={() => setFilters((value) => ({ ...value, page: value.page + 1 }))}>Siguiente</button></div></nav>
          </>}
        </div>
      </section>

      {toast && <div className={`admin-toast admin-toast--${toast.tone}`} role="status">{toast.message}<button type="button" aria-label="Cerrar" onClick={() => setToast(null)}>×</button></div>}
      {pendingAction && <div className="admin-dialog-backdrop" onMouseDown={() => !saving && setPendingAction(null)}><section className="admin-dialog" role="alertdialog" aria-modal="true" aria-labelledby="admin-dialog-title" onMouseDown={(event) => event.stopPropagation()}><span>Confirmar acción</span><h2 id="admin-dialog-title">{pendingAction.action === 'delete' ? '¿Eliminar usuario?' : `¿${pendingAction.action === 'block' ? 'Bloquear' : 'Desbloquear'} usuario?`}</h2><p>{actionDescription}</p><div><button type="button" disabled={saving} onClick={() => setPendingAction(null)}>Cancelar</button><button type="button" className={pendingAction.action === 'delete' ? 'admin-delete' : ''} disabled={saving} onClick={() => void confirmAction()}>{saving ? 'Guardando…' : pendingAction.action === 'delete' ? 'Eliminar' : 'Confirmar'}</button></div></section></div>}
    </main>
  )
}
