import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./DashboardClients.css";
import ServiceTypeSelect from "../components/ServiceTypeSelect";
import OrderDetailModal from "../components/OrderDetailModal";
import { useAuthContext } from "../context/authContext";
import { useAuth } from "../hook/useAuth";
import { getMe } from "../api/auth";
import { getMyOrders, createOrder } from "../api/dashboard";
import type { Order, NewOrderPayload } from "../types";
import  NavbarClient  from "../components/NavbarClient";
export default function DashboardClients() {
  const { user } = useAuthContext();
  const { handleLogout } = useAuth();
  const navigate = useNavigate();

  const [customerId, setCustomerId] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderForm, setOrderForm] = useState<Omit<NewOrderPayload, "customer_id">>({
    notes: "",
    pieces_count: 1,
    service_type: "",
  });

  async function loadOrders() {
    try {
      const data = await getMyOrders();
      setOrders(data);
    } catch {
      setError("No se pudo cargar tu historial de órdenes.");
    }
  }

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        setLoading(true);
        const me = (await getMe()) as { user_id: string; email: string; role: string };
        if (!active) return;
        setCustomerId(me.user_id);

        const data = await getMyOrders();
        if (!active) return;
        setOrders(data);
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

  async function handleCreateOrder(e: React.FormEvent) {
    e.preventDefault();

    if (!orderForm.service_type) {
      setError("Selecciona un tipo de servicio.");
      return;
    }
    if (!customerId) {
      setError("No se pudo identificar tu cuenta. Intenta recargar la página.");
      return;
    }

    setSubmitting(true);
    try {
      await createOrder({
        ...orderForm,
        customer_id: customerId,
        pieces_count: Number(orderForm.pieces_count),
      });
      setShowOrderModal(false);
      setOrderForm({ notes: "", pieces_count: 1, service_type: "" });
      await loadOrders();
    } catch {
      setError("Error al crear la orden.");
    } finally {
      setSubmitting(false);
    }
  }

  const recentOrders = orders.slice(0, 5);
useEffect(() => {
  console.log(orderForm);
}, [orderForm]);
  return (
    <div className="client-dashboard-page">

            <NavbarClient />
              <header className="client-dashboard-header">
      <div>
      <div className="client-dashboard-eyebrow">
        TimeGoBetter System
      </div>

      <h1>Mi Panel</h1>

      <p className="client-dashboard-subtitle">
        Bienvenido a tu panel de cliente. Aquí puedes ver tus órdenes recientes y crear nuevas órdenes.
      </p>
    </div>

    <div className="client-header-actions">

      <button
        className="client-btn-primary"
        onClick={() => setShowOrderModal(true)}
        disabled={!customerId}
      >
        + Nueva Orden
      </button>

    </div>

  </header>

      {error && <div className="client-dashboard-error">{error}</div>}

      <div className="client-dashboard-grid">
        {/* Perfil */}
        <section className="client-dashboard-card">
          <h2>Mi Perfil</h2>
          <div className="profile-row">
            <span className="profile-label">Nombre</span>
            <span className="profile-value">{user?.name ?? "—"}</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">Email</span>
            <span className="profile-value">{user?.email ?? "—"}</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">Cuenta</span>
            <span className="profile-value">Cliente</span>
          </div>


        </section>

        {/* Órdenes recientes */}
        <section className="client-dashboard-card">
          <h2>Mis Órdenes ({orders.length})</h2>
          {loading ? (
            <p className="client-empty-state">Cargando órdenes...</p>
          ) : recentOrders.length === 0 ? (
            <p className="client-empty-state">Aún no tienes órdenes. ¡Crea la primera!</p>
          ) : (
            <>
              <table>
                <thead>
                  <tr>
                    <th>Servicio</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o) => (
                    <tr
                      key={o.ID}
                      onClick={() => setSelectedOrder(o)}
                      style={{ cursor: "pointer" }}
                    >
                      <td>{o.ServiceType || "—"}</td>
                      <td>
                        <span className={`client-status-badge status-${o.Status}`}>
                          {o.Status}
                        </span>
                      </td>
                      <td>{new Date(o.CreatedAt).toLocaleDateString("es-DO")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {orders.length > 5 && (
                <button className="client-link-btn" onClick={() => navigate("/historial")}>
                  Ver historial completo →
                </button>
              )}
            </>
          )}
        </section>
      </div>

      {/* Modal Nueva Orden */}
      {showOrderModal && (
        <div className="client-modal-overlay" onClick={() => setShowOrderModal(false)}>
          <div className="client-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Nueva Orden</h2>
            <form onSubmit={handleCreateOrder} className="client-modal-form">
              <div className="client-input-group">
                <label>Tipo de servicio</label>
                <ServiceTypeSelect
                  value={orderForm.service_type}
                  onChange={(value: string) => setOrderForm({ ...orderForm, service_type: value })}
                />
              </div>
              <div className="client-input-group">
                <label>Cantidad de piezas</label>
                <input
                  type="number"
                  min={1}
                  value={orderForm.pieces_count}
                  onChange={(e) => setOrderForm({ ...orderForm, pieces_count: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="client-input-group">
                <label>Notas</label>
                <textarea
                  placeholder="Instrucciones especiales..."
                  value={orderForm.notes}
                  onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="client-modal-actions">
                <button
                  type="button"
                  className="client-btn-secondary"
                  onClick={() => setShowOrderModal(false)}
                >
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