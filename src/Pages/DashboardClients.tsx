import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./DashboardClients.css";
import ServiceTypeSelect from "../components/ServiceTypeSelect";
import OrderDetailModal from "../components/OrderDetailModal";
import { useAuthContext } from "../context/authContext";
import { getMe } from "../api/auth";
import { createOrder, getMyOrders } from "../api/dashboard";
import type { NewOrderPayload, Order } from "../types";

const ORDER_STEPS = ["recibida", "en_proceso", "lista", "entregada"] as const;
const MAX_WEIGHT = 100;
const MAX_PIECES = 200;
const MAX_NOTES_LENGTH = 500;
const PAGE_SIZE = 5;

type OrderFilter = "todas" | "activas" | "lista" | "entregada";
type ConnectionState = "connecting" | "connected" | "reconnecting" | "offline";
type Toast = { tone: "success" | "info"; message: string } | null;

function statusLabel(status?: string) {
  const normalized = status?.toLowerCase() ?? "";
  const labels: Record<string, string> = {
    recibida: "Recibida",
    en_proceso: "En proceso",
    lista: "Lista para retirar",
    entregada: "Entregada",
  };

  return labels[normalized] ?? (status ? status.replaceAll("_", " ") : "En actualización");
}

function statusDescription(status?: string) {
  const descriptions: Record<string, string> = {
    recibida: "Hemos recibido tu orden y pronto será asignada.",
    en_proceso: "Estamos trabajando en tus prendas.",
    lista: "Tu orden está lista para retirar.",
    entregada: "Esta orden fue entregada. ¡Gracias por preferirnos!",
  };

  return descriptions[status?.toLowerCase() ?? ""] ?? "Estamos actualizando la información de tu orden.";
}

function statusClass(status?: string) {
  const normalized = status?.toLowerCase();
  return ORDER_STEPS.includes(normalized as (typeof ORDER_STEPS)[number]) ? normalized : "desconocido";
}

function getInitials(name?: string | null) {
  if (!name) return "U";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function formatOrderDate(date?: string, withTime = false) {
  if (!date) return "--";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "--";

  return parsed.toLocaleDateString("es-DO", withTime
    ? { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }
    : { day: "2-digit", month: "short", year: "numeric" });
}

function shortOrderId(id?: string) {
  return id ? `#${id.slice(0, 8).toUpperCase()}` : "Orden sin ID";
}

/** Acepta tanto el contrato actual del frontend como el JSON snake_case de la API. */
function normalizeOrder(value: unknown): Order | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const toString = (field: string) => typeof record[field] === "string" ? record[field] : "";
  const toNumber = (field: string) => {
    const number = Number(record[field]);
    return Number.isFinite(number) ? number : 0;
  };

  const id = toString("ID") || toString("id");
  if (!id) return null;

  return {
    ID: id,
    CustomerID: toString("CustomerID") || toString("customer_id"),
    Status: toString("Status") || toString("status"),
    ServiceType: toString("ServiceType") || toString("service_type"),
    service_type_id: toString("service_type_id"),
    PiecesCount: toNumber("PiecesCount") || toNumber("pieces_count"),
    Weight: toNumber("Weight") || toNumber("weight"),
    price: toNumber("price") || toNumber("estimated_cost"),
    EstimatedTime: toNumber("EstimatedTime") || toNumber("estimated_time_minutes"),
    CreatedAt: toString("CreatedAt") || toString("created_at"),
    updated_at: toString("updated_at") || toString("UpdatedAt") || toString("created_at"),
    ReadyAt: toString("ReadyAt") || toString("ready_at") || undefined,
    Notes: toString("Notes") || toString("notes") || undefined,
  };
}

function normalizeOrderList(payload: unknown) {
  const record = payload && typeof payload === "object" ? payload as Record<string, unknown> : null;
  const items = Array.isArray(payload)
    ? payload
    : record?.orders ?? record?.data ?? record?.items;

  if (!Array.isArray(items)) return null;
  return items.map(normalizeOrder).filter((order): order is Order => order !== null);
}

function OrderStatusTimeline({ status }: { status: string }) {
  const activeIndex = Math.max(ORDER_STEPS.indexOf(status.toLowerCase() as (typeof ORDER_STEPS)[number]), 0);

  return (
    <div className="client-order-progress" aria-label={`Estado actual: ${statusLabel(status)}`}>
      {ORDER_STEPS.map((step, index) => {
        const isCompleted = index <= activeIndex;
        const isCurrent = index === activeIndex;

        return (
          <div key={step} className="client-progress-segment">
            <div className={`client-progress-step ${isCompleted ? "is-completed" : ""} ${isCurrent ? "is-current" : ""}`}>
              <div className="client-progress-dot" aria-hidden="true">{isCompleted ? "✓" : ""}</div>
              <span>{statusLabel(step)}</span>
            </div>
            {index < ORDER_STEPS.length - 1 && <div className={`client-progress-line ${index < activeIndex ? "is-completed" : ""}`} />}
          </div>
        );
      })}
    </div>
  );
}

export default function DashboardClients() {
  const { user, token, logout } = useAuthContext();
  const [customerId, setCustomerId] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<OrderFilter>("todas");
  const [ordersPage, setOrdersPage] = useState(1);
  const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");
  const [toast, setToast] = useState<Toast>(null);
  const previousOrders = useRef<Order[]>([]);
  const [orderForm, setOrderForm] = useState<NewOrderPayload>({
    CustomerID: "",
    Notes: "",
    PiecesCount: 1,
    ServiceType: "",
    Weight: 1,
  });

  const resetOrderForm = useCallback((id: string) => {
    setOrderForm({ CustomerID: id, Notes: "", PiecesCount: 1, ServiceType: "", Weight: 1 });
    setFormError("");
  }, []);

  const loadMyOrders = useCallback(async (announceChanges = false) => {
    try {
      const payload = await getMyOrders();
      const normalized = normalizeOrderList(payload);

      if (!normalized) {
        setError("Recibimos una respuesta inesperada al cargar tus órdenes. Intenta nuevamente.");
        return false;
      }

      if (announceChanges) {
        const oldStatusByOrder = new Map(previousOrders.current.map((order) => [order.ID, order.Status]));
        const updated = normalized.find((order) => {
          const oldStatus = oldStatusByOrder.get(order.ID);
          return oldStatus && oldStatus.toLowerCase() !== order.Status.toLowerCase();
        });

        if (updated) {
          const message = updated.Status.toLowerCase() === "lista"
            ? `${shortOrderId(updated.ID)} está lista para retirar.`
            : `${shortOrderId(updated.ID)} cambió a “${statusLabel(updated.Status)}”.`;
          setToast({ tone: "info", message });
        }
      }

      previousOrders.current = normalized;
      setOrders(normalized);
      setError("");
      return true;
    } catch {
      setError("No pudimos cargar tu historial de órdenes. Verifica tu conexión e inténtalo de nuevo.");
      return false;
    }
  }, []);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        setLoading(true);
        setError("");
        const me = await getMe();
        if (!active) return;

        const resolvedCustomerId = me.user_id || "";
        setCustomerId(resolvedCustomerId);
        resetOrderForm(resolvedCustomerId);
        await loadMyOrders();
      } catch {
        if (active) setError("No pudimos identificar tu sesión. Actualiza la página o inicia sesión nuevamente.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => { active = false; };
  }, [loadMyOrders, resetOrderForm]);

  useEffect(() => {
    if (!token) return undefined;

    let socket: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let shouldReconnect = true;
    let attempts = 0;

    const connect = () => {
      const baseUrl = import.meta.env.VITE_WS_URL ?? "ws://localhost:8080/ws";
      const separator = baseUrl.includes("?") ? "&" : "?";
      setConnectionState(attempts ? "reconnecting" : "connecting");
      socket = new WebSocket(`${baseUrl}${separator}access_token=${encodeURIComponent(token)}`);

      socket.onopen = () => {
        attempts = 0;
        setConnectionState("connected");
      };
      socket.onmessage = () => { void loadMyOrders(true); };
      socket.onerror = () => socket?.close();
      socket.onclose = () => {
        if (!shouldReconnect) return;
        setConnectionState("reconnecting");
        const delay = Math.min(1000 * 2 ** attempts, 10_000);
        attempts += 1;
        retryTimer = setTimeout(connect, delay);
      };
    };

    connect();
    return () => {
      shouldReconnect = false;
      if (retryTimer) clearTimeout(retryTimer);
      socket?.close();
    };
  }, [loadMyOrders, token]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(timer);
  }, [toast]);

  const sortedOrders = useMemo(() => [...orders].sort((a, b) => {
    return new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime();
  }), [orders]);

  const visibleOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return sortedOrders.filter((order) => {
      const matchesFilter = filter === "todas"
        || (filter === "activas" && !["lista", "entregada"].includes(order.Status.toLowerCase()))
        || order.Status.toLowerCase() === filter;
      const matchesQuery = !normalizedQuery || [order.ID, order.ServiceType, order.Notes]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedQuery));
      return matchesFilter && matchesQuery;
    });
  }, [filter, query, sortedOrders]);
  const totalOrderPages = Math.max(1, Math.ceil(visibleOrders.length / PAGE_SIZE));
  const currentOrdersPage = Math.min(ordersPage, totalOrderPages);
  const paginatedOrders = visibleOrders.slice((currentOrdersPage - 1) * PAGE_SIZE, currentOrdersPage * PAGE_SIZE);

  const orderMetrics = useMemo(() => ({
    total: orders.length,
    inProgress: orders.filter((order) => ["recibida", "en_proceso"].includes(order.Status.toLowerCase())).length,
    ready: orders.filter((order) => order.Status.toLowerCase() === "lista").length,
    delivered: orders.filter((order) => order.Status.toLowerCase() === "entregada").length,
  }), [orders]);
  const visibleConnectionState = token ? connectionState : "offline";

  async function handleCreateOrder(event: React.FormEvent) {
    event.preventDefault();
    const weight = Number(orderForm.Weight);
    const pieces = Number(orderForm.PiecesCount);

    if (!customerId) {
      setFormError("No pudimos identificar tu cuenta. Actualiza la página e inténtalo otra vez.");
      return;
    }
    if (!orderForm.ServiceType.trim()) {
      setFormError("Selecciona el tipo de servicio que necesitas.");
      return;
    }
    if (!Number.isFinite(weight) || weight <= 0 || weight > MAX_WEIGHT) {
      setFormError(`Ingresa un peso entre 0.1 y ${MAX_WEIGHT} lb.`);
      return;
    }
    if (!Number.isInteger(pieces) || pieces < 1 || pieces > MAX_PIECES) {
      setFormError(`Ingresa entre 1 y ${MAX_PIECES} piezas.`);
      return;
    }
    if (orderForm.Notes.length > MAX_NOTES_LENGTH) {
      setFormError(`Las notas no pueden superar ${MAX_NOTES_LENGTH} caracteres.`);
      return;
    }

    setSubmitting(true);
    setFormError("");
    setError("");
    try {
      await createOrder({ ...orderForm, CustomerID: customerId, PiecesCount: pieces, Weight: weight, Notes: orderForm.Notes.trim() });
      setShowOrderModal(false);
      resetOrderForm(customerId);
      setToast({ tone: "success", message: "Tu orden fue recibida. Te avisaremos cuando cambie de estado." });
      await loadMyOrders();
    } catch {
      setFormError("No pudimos crear la orden. Revisa los datos e inténtalo nuevamente.");
    } finally {
      setSubmitting(false);
    }
  }

  const closeOrderForm = () => {
    setShowOrderModal(false);
    resetOrderForm(customerId);
  };

  return (
    <div className="client-dashboard-page">
      <header className="client-topbar">
        <div className="client-topbar-inner">
          <div className="client-brand">
            <div className="client-brand-icon" aria-hidden="true">T</div>
            <div className="client-brand-copy">
              <span className="client-brand-name">TimeGoBetter</span>
              <span className="client-brand-subtitle">Portal del cliente</span>
            </div>
          </div>

          <div className="client-topbar-user">
            <div className="client-live-status" title={visibleConnectionState === "connected" ? "Notificaciones en tiempo real activas" : "Las notificaciones se reconectarán automáticamente"}>
              <span className={`client-live-dot is-${visibleConnectionState}`} aria-hidden="true" />
              <span>{visibleConnectionState === "connected" ? "En tiempo real" : "Reconectando"}</span>
            </div>
            <div className="client-user-profile">
              <div className="client-user-avatar">{getInitials(user?.name)}</div>
              <div className="client-user-copy">
                <span className="client-user-welcome">Bienvenido/a</span>
                <strong>{user?.name ?? "Usuario"}</strong>
              </div>
            </div>
            <button type="button" className="client-logout-button" onClick={logout}>Cerrar sesión</button>
          </div>
        </div>
      </header>

      <div className="client-dashboard-shell">
        <main className="client-dashboard-main">
          <section className="client-page-intro" aria-labelledby="client-dashboard-title">
            <div>
              <p className="client-eyebrow">GESTIÓN DE LAVANDERÍA</p>
              <h1 id="client-dashboard-title">Tus prendas, siempre bajo control.</h1>
              <p>Consulta tu historial y recibe actualizaciones de cada orden en un solo lugar.</p>
            </div>
            <button className="client-btn-primary" onClick={() => setShowOrderModal(true)} disabled={!customerId}>
              <span aria-hidden="true">+</span> Nueva orden
            </button>
          </section>

          {toast && (
            <div className={`client-toast is-${toast.tone}`} role="status">
              <span aria-hidden="true">{toast.tone === "success" ? "✓" : "●"}</span>
              <p>{toast.message}</p>
              <button type="button" onClick={() => setToast(null)} aria-label="Cerrar notificación">×</button>
            </div>
          )}

          {error && (
            <div className="client-dashboard-error" role="alert">
              <div><strong>No se pudo completar la acción.</strong><span>{error}</span></div>
              <button type="button" onClick={() => { void loadMyOrders(); }}>Reintentar</button>
            </div>
          )}

          <section className="client-metrics" aria-label="Resumen de tus órdenes">
            <article><span>Órdenes totales</span><strong>{orderMetrics.total}</strong><small>En tu historial</small></article>
            <article><span>En curso</span><strong>{orderMetrics.inProgress}</strong><small>Recibidas o en proceso</small></article>
            <article><span>Listas para retirar</span><strong>{orderMetrics.ready}</strong><small>Ya puedes pasar por ellas</small></article>
            <article><span>Entregadas</span><strong>{orderMetrics.delivered}</strong><small>Órdenes finalizadas</small></article>
          </section>

          <div className="client-dashboard-grid">
            <section className="client-dashboard-card client-profile-card">
              <div className="client-card-heading"><div><p className="client-eyebrow">CUENTA</p><h2>Mi perfil</h2></div></div>
              <div className="client-profile-list">
                <div className="client-profile-row"><span className="profile-label">Nombre</span><span className="profile-value">{user?.name ?? "--"}</span></div>
                <div className="client-profile-row"><span className="profile-label">Correo</span><span className="profile-value">{user?.email ?? "--"}</span></div>
                <div className="client-profile-row"><span className="profile-label">ID de cliente</span><span className="profile-value client-profile-id">{customerId || "--"}</span></div>
              </div>
              <div className="client-workflow-hint">
                <strong>Así avanza tu orden</strong>
                <ol>{ORDER_STEPS.map((step) => <li key={step}>{statusLabel(step)}</li>)}</ol>
              </div>
            </section>

            <section className="client-dashboard-card client-orders-card">
              <div className="client-card-heading client-orders-heading">
                <div><p className="client-eyebrow">HISTORIAL</p><h2>Mis órdenes</h2><span>{loading ? "Cargando tu historial…" : `${visibleOrders.length} de ${orders.length} órdenes`}</span></div>
                <button type="button" className="client-refresh-button" onClick={() => { void loadMyOrders(true); }} disabled={loading}>Actualizar</button>
              </div>

              <div className="client-orders-toolbar">
                <label className="client-search-field"><span className="sr-only">Buscar en órdenes</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por servicio o número…" /></label>
                <label className="client-filter-field"><span className="sr-only">Filtrar órdenes por estado</span><select value={filter} onChange={(event) => setFilter(event.target.value as OrderFilter)}><option value="todas">Todos los estados</option><option value="activas">En curso</option><option value="lista">Listas para retirar</option><option value="entregada">Entregadas</option></select></label>
              </div>

              {loading ? (
                <div className="client-table-skeleton" aria-label="Cargando órdenes"><span /><span /><span /><span /></div>
              ) : orders.length === 0 ? (
                <div className="client-empty-state client-empty-rich"><span aria-hidden="true">◌</span><h3>Aún no tienes órdenes</h3><p>Crea tu primera orden y podrás seguir cada etapa desde aquí.</p><button className="client-btn-secondary" type="button" onClick={() => setShowOrderModal(true)}>Crear primera orden</button></div>
              ) : visibleOrders.length === 0 ? (
                <div className="client-empty-state client-empty-rich"><span aria-hidden="true">⌕</span><h3>No encontramos coincidencias</h3><p>Prueba con otro término o restablece el filtro para ver tu historial.</p><button className="client-link-button" type="button" onClick={() => { setQuery(""); setFilter("todas"); }}>Limpiar filtros</button></div>
              ) : (
                <div className="client-orders-table-wrap">
                  <table className="client-orders-table">
                    <thead className="client-orders-header"><tr><th>Orden y servicio</th><th>Estado</th><th>Fecha</th><th>Total estimado</th><th><span className="sr-only">Ver detalle</span></th></tr></thead>
                    <tbody className="client-orders-body">
                      {paginatedOrders.map((order) => (
                        <tr key={order.ID} className="client-order-row" tabIndex={0} onClick={() => setSelectedOrder(order)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedOrder(order); } }}>
                          <td className="client-order-service"><strong>{order.ServiceType || "Servicio sin especificar"}</strong><span>{shortOrderId(order.ID)} · {order.PiecesCount} {order.PiecesCount === 1 ? "pieza" : "piezas"}</span></td>
                          <td className="client-order-status-cell"><span className={`client-status-badge is-${statusClass(order.Status)}`}>{statusLabel(order.Status)}</span><small>{statusDescription(order.Status)}</small></td>
                          <td className="client-order-date">{formatOrderDate(order.CreatedAt)}<span>{order.ReadyAt ? `Lista: ${formatOrderDate(order.ReadyAt)}` : "Actualización en tiempo real"}</span></td>
                          <td className="client-order-price">{new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" }).format(order.price)}</td>
                          <td className="client-order-action"><button type="button" aria-label={`Ver detalle de ${shortOrderId(order.ID)}`} onClick={(event) => { event.stopPropagation(); setSelectedOrder(order); }}>Ver detalle <span aria-hidden="true">→</span></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {visibleOrders.length > PAGE_SIZE && (
                <nav className="client-pagination" aria-label="PaginaciÃ³n de Ã³rdenes">
                  <button type="button" onClick={() => setOrdersPage((page) => Math.max(1, page - 1))} disabled={currentOrdersPage === 1}>Anterior</button>
                  <span>PÃ¡gina {currentOrdersPage} de {totalOrderPages}</span>
                  <button type="button" onClick={() => setOrdersPage((page) => Math.min(totalOrderPages, page + 1))} disabled={currentOrdersPage === totalOrderPages}>Siguiente</button>
                </nav>
              )}
            </section>
          </div>

          {!loading && orders.length > 0 && <section className="client-current-order" aria-label="Seguimiento del estado de una orden"><div><p className="client-eyebrow">SEGUIMIENTO</p><h2>El estado se actualiza automáticamente</h2><p>Te notificaremos cuando una orden esté lista para retirar o sea entregada.</p></div><OrderStatusTimeline status={orders.find((order) => !["entregada"].includes(order.Status.toLowerCase()))?.Status ?? "entregada"} /></section>}
        </main>

        <footer className="client-dashboard-footer"><div className="client-footer-inner"><div className="client-footer-copy">© {new Date().getFullYear()} TimeGoBetter. Gestión de órdenes de lavandería.</div><div className="client-footer-links"><a href="mailto:soporte@timegobetter.com">Soporte</a><button type="button" onClick={() => { void loadMyOrders(); }}>Actualizar historial</button></div></div></footer>
      </div>

      {showOrderModal && (
        <div className="client-modal-overlay" onMouseDown={closeOrderForm} role="presentation">
          <section className="client-modal" role="dialog" aria-modal="true" aria-labelledby="new-order-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="client-modal-header"><div><p className="client-eyebrow">NUEVA SOLICITUD</p><h2 id="new-order-title">Crea una orden</h2><p>Completa los datos para calcular el servicio.</p></div><button type="button" className="client-modal-close" onClick={closeOrderForm} aria-label="Cerrar formulario">×</button></div>
            <form onSubmit={handleCreateOrder} className="client-modal-form" noValidate>
              {formError && <div className="client-form-error" role="alert">{formError}</div>}
              <div className="client-input-group"><label htmlFor="service-type">Tipo de servicio <span aria-hidden="true">*</span></label><div id="service-type" className="service-type"><ServiceTypeSelect value={orderForm.ServiceType} onChange={(value: string) => { setOrderForm((current) => ({ ...current, ServiceType: value })); setFormError(""); }} /></div></div>
              <div className="client-form-grid">
                <div className="client-input-group"><label htmlFor="order-weight">Peso estimado (lb) <span aria-hidden="true">*</span></label><input id="order-weight" type="number" min="0.1" max={MAX_WEIGHT} step="0.1" inputMode="decimal" value={orderForm.Weight} onChange={(event) => setOrderForm((current) => ({ ...current, Weight: Number(event.target.value) }))} required /><small>Entre 0.1 y {MAX_WEIGHT} lb.</small></div>
                <div className="client-input-group"><label htmlFor="pieces-count">Cantidad de piezas <span aria-hidden="true">*</span></label><input id="pieces-count" type="number" min="1" max={MAX_PIECES} step="1" inputMode="numeric" value={orderForm.PiecesCount} onChange={(event) => setOrderForm((current) => ({ ...current, PiecesCount: Number(event.target.value) }))} required /><small>Entre 1 y {MAX_PIECES} piezas.</small></div>
              </div>
              <div className="client-input-group"><div className="client-label-row"><label htmlFor="order-notes">Notas para el operador <span className="client-optional">Opcional</span></label><span>{orderForm.Notes.length}/{MAX_NOTES_LENGTH}</span></div><textarea id="order-notes" placeholder="Ej. Separar prendas blancas o tratar una mancha específica." value={orderForm.Notes} onChange={(event) => setOrderForm((current) => ({ ...current, Notes: event.target.value }))} rows={4} maxLength={MAX_NOTES_LENGTH} /></div>
              <div className="client-modal-actions"><button type="button" className="client-btn-secondary" onClick={closeOrderForm} disabled={submitting}>Cancelar</button><button type="submit" className="client-btn-primary" disabled={submitting}>{submitting ? "Creando orden…" : "Crear orden"}</button></div>
            </form>
          </section>
        </div>
      )}

      <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </div>
  );
}
