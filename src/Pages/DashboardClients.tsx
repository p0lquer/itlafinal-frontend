import { useEffect, useState } from "react";
import "./DashboardClients.css";
import ServiceTypeSelect from "../components/ServiceTypeSelect";
import OrderDetailModal from "../components/OrderDetailModal";
import { useAuthContext } from "../context/authContext";
import { getMe } from "../api/auth";
import { getMyOrders, createOrder } from "../api/dashboard";
import type { Order, NewOrderPayload } from "../types";

const ORDER_STEPS = ["recibida", "en_proceso", "lista", "entregada"] as const;

function formatStatusLabel(status: string) {
  return status.replace("_", " ");
}

function getStatusStepIndex(status: string) {
  const normalizedStatus = status.toLowerCase();
  const foundIndex = ORDER_STEPS.findIndex((step) => step === normalizedStatus);
  return foundIndex >= 0 ? foundIndex : 0;
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

function formatOrderDate(date?: string) {
  if (!date) return "--";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "--";

  return parsed.toLocaleDateString("es-DO");
}

function OrderStatusTimeline({ status }: { status: string }) {
  const activeIndex = getStatusStepIndex(status);

  return (
    <div className="client-order-progress" aria-label={`Estado actual: ${formatStatusLabel(status)}`}>
      {ORDER_STEPS.map((step, index) => {
        const isCompleted = index <= activeIndex;
        const isCurrent = index === activeIndex;

        return (
          <div key={step} className="client-progress-segment">
            <div className={`client-progress-step ${isCompleted ? "is-completed" : ""} ${isCurrent ? "is-current" : ""}`}>
              <div className="client-progress-dot">{isCompleted ? "✓" : ""}</div>
              <span>{formatStatusLabel(step)}</span>
            </div>
            {index < ORDER_STEPS.length - 1 && (
              <div className={`client-progress-line ${index < activeIndex ? "is-completed" : ""}`} />
            )}
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
  const [orderForm, setOrderForm] = useState<NewOrderPayload>({
    CustomerID: "",
    Notes: "",
    PiecesCount: 1,
    ServiceType: "",
    Weight: 0,
  });

  const visibleOrders = Array.isArray(orders) ? orders : [];

  async function loadMyOrders() {
    try {
      const data = await getMyOrders();
      const payload = data as unknown;
      const normalized = Array.isArray(payload)
        ? (payload as Order[])
        : (payload as { orders?: Order[]; data?: Order[]; items?: Order[] } | null)?.orders
          ?? (payload as { orders?: Order[]; data?: Order[]; items?: Order[] } | null)?.data
          ?? (payload as { orders?: Order[]; data?: Order[]; items?: Order[] } | null)?.items
          ?? [];

      setOrders(normalized);

      if (!Array.isArray(payload) && !("orders" in (payload as object) || "data" in (payload as object) || "items" in (payload as object))) {
        setError("El backend devolvio una respuesta inesperada para tus ordenes.");
      }
    } catch {
      setError("No se pudo cargar tu historial de ordenes.");
    }
  }

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const me = await getMe();
        if (!active) return;

        const resolvedCustomerId = me.user_id || "";
        setCustomerId(resolvedCustomerId);
        setOrderForm((prev) => ({ ...prev, CustomerID: resolvedCustomerId }));

        await loadMyOrders();
      } catch {
        if (active) setError("No se pudo conectar con el backend.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!token) return;

    const baseUrl = import.meta.env.VITE_WS_URL ?? "ws://localhost:8080/ws";
    const separator = baseUrl.includes("?") ? "&" : "?";
    const socket = new WebSocket(`${baseUrl}${separator}access_token=${encodeURIComponent(token)}`);

    socket.onmessage = () => {
      void loadMyOrders();
    };

    socket.onerror = () => {
      // El dashboard sigue funcionando por HTTP si WS no esta disponible.
    };

    return () => socket.close();
  }, [token]);

  async function handleCreateOrder(e: React.FormEvent) {
    e.preventDefault();

    if (!customerId) {
      setError("No se pudo identificar al cliente autenticado.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await createOrder({
        ...orderForm,
        CustomerID: customerId,
        PiecesCount: Number(orderForm.PiecesCount),
        Weight: Number(orderForm.Weight),
      });

      setShowOrderModal(false);
      setOrderForm({
        CustomerID: customerId,
        Notes: "",
        PiecesCount: 1,
        ServiceType: "",
        Weight: 0,
      });
      await loadMyOrders();
    } catch {
      setError("Error al crear la orden.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="client-dashboard-page">
      <header className="client-topbar">
        <div className="client-topbar-inner">
          <div className="client-brand">
            <div className="client-brand-icon">T</div>
            <div className="client-brand-copy">
              <span className="client-brand-name">TimeGoBetter</span>
            </div>
          </div>

          <div className="client-topbar-user">
            <div className="client-user-profile">
              <div className="client-user-avatar">{getInitials(user?.name)}</div>
              <div className="client-user-copy">
                <span className="client-user-welcome">Bienvenido</span>
                <strong>{user?.name ?? "Usuario"}</strong>
              </div>
            </div>

            <button type="button" className="client-logout-button" onClick={logout}>
              Cerrar sesion
            </button>
          </div>
        </div>
      </header>

      <div className="client-dashboard-shell">
        <main className="client-dashboard-main">
          <div className="client-action-row">
            <button
              className="client-btn-primary"
              onClick={() => setShowOrderModal(true)}
              disabled={!customerId}
            >
              + Nueva Orden
            </button>
          </div>

          {error && <div className="client-dashboard-error">{error}</div>}

          <div className="client-dashboard-grid">
            <section className="client-dashboard-card client-profile-card">
              <h2>Mi Perfil</h2>
              <div className="client-profile-list">
                <div className="client-profile-row">
                  <span className="profile-label">Nombre</span>
                  <span className="profile-value">{user?.name ?? "--"}</span>
                </div>
                <div className="client-profile-row">
                  <span className="profile-label">Email</span>
                  <span className="profile-value">{user?.email ?? "--"}</span>
                </div>
                <div className="client-profile-row">
                  <span className="profile-label">ID de Cliente</span>
                  <span className="profile-value client-profile-id">{customerId || "--"}</span>
                </div>
              </div>
            </section>

            <section className="client-dashboard-card client-orders-card">
              <h2>Mis Ordenes ({visibleOrders.length})</h2>

              {loading ? (
                <p className="client-empty-state">Cargando ordenes...</p>
              ) : visibleOrders.length === 0 ? (
                <p className="client-empty-state">Aun no tienes ordenes. Crea la primera para comenzar.</p>
              ) : (
                <div className="client-orders-table-wrap">
                  <table className="client-orders-table">
                    <colgroup>
                      <col className="client-col-service" />
                      <col className="client-col-status" />
                      <col className="client-col-date" />
                    </colgroup>
                    <thead className="client-orders-header">
                      <tr>
                        <th>Servicio</th>
                        <th>Estado</th>
                        <th>Fecha</th>
                      </tr>
                    </thead>
                    <tbody className="client-orders-body">
                      {visibleOrders.map((order) => (
                        <tr
                          key={order.ID}
                          className="client-order-row"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <td className="client-order-service">{order.ServiceType || "--"}</td>
                          <td className="client-order-status-cell">
                            <OrderStatusTimeline status={order.Status} />
                          </td>
                          <td className="client-order-date">{formatOrderDate(order.CreatedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </main>

        <footer className="client-dashboard-footer">
          <div className="client-footer-inner">
            <div className="client-footer-copy">
              © 2024 TimeGoBetter Order Management System. All rights reserved.
            </div>
            <div className="client-footer-links">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">API Status</a>
            </div>
          </div>
        </footer>
      </div>

      {showOrderModal && (
        <div className="client-modal-overlay" onClick={() => setShowOrderModal(false)}>
          <div className="client-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Nueva Orden</h2>
            <form onSubmit={handleCreateOrder} className="client-modal-form">
              <div className="client-input-group">
                <label>Tipo de servicio</label>
                <div className="service-type">
                  <ServiceTypeSelect
                    value={orderForm.ServiceType}
                    onChange={(value: string) => setOrderForm({ ...orderForm, ServiceType: value })}
                  />
                </div>
              </div>

              <div className="client-input-group">
                <label>Peso Estimado (lbs)</label>
                <input
                  type="number"
                  value={orderForm.Weight}
                  onChange={(e) => setOrderForm({ ...orderForm, Weight: Number(e.target.value) })}
                  required
                />
              </div>

              <div className="client-input-group">
                <label>Cantidad de piezas</label>
                <input
                  type="number"
                  min={1}
                  value={orderForm.PiecesCount}
                  onChange={(e) => setOrderForm({ ...orderForm, PiecesCount: Number(e.target.value) })}
                  required
                />
              </div>

              <div className="client-input-group">
                <label>Notas</label>
                <textarea
                  placeholder="Instrucciones especiales..."
                  value={orderForm.Notes}
                  onChange={(e) => setOrderForm({ ...orderForm, Notes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="client-modal-actions">
                <button type="button" className="client-btn-secondary" onClick={() => setShowOrderModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="client-btn-primary" disabled={submitting}>
                  {submitting ? "Creando..." : "Crear Orden"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </div>
  );
}
