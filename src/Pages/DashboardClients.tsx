import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./DashboardClients.css";
import ServiceTypeSelect from "../components/ServiceTypeSelect";
import OrderDetailModal from "../components/OrderDetailModal";
import { useAuthContext } from "../context/authContext";
import { getMe } from "../api/auth";
import { getMyOrders, createOrder } from "../api/dashboard";
import type { Order, NewOrderPayload } from "../types";
import NavbarClient from "../components/NavbarClient";


export default function DashboardClients() {
  const { user } = useAuthContext();
  const navigate = useNavigate();

  const [customerId, setCustomerId] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderForm, setOrderForm] = useState<NewOrderPayload>({
      customer_id: "",
      notes: "",
      pieces_count: 1,
      service_type: "",
      weight: 0
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

      if (!Array.isArray(payload) && !('orders' in (payload as object) || 'data' in (payload as object) || 'items' in (payload as object))) {
        setError("El backend devolvió una respuesta inesperada para tus órdenes.");
      }
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
        setCustomerId(me.user_id || "");

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

async function handleCreateOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId) {
      setError("No se pudo identificar al cliente autenticado.");
      return;
    }

    setSubmitting(true);
    try {
      await createOrder({
        ...orderForm,
        customer_id: customerId,
        pieces_count: Number(orderForm.pieces_count),
        weight: Number(orderForm.weight),
      });

      setShowOrderModal(false);
      setOrderForm({ customer_id: customerId, notes: "", pieces_count: 1, service_type: "", weight: 0 });
      await loadMyOrders();
    } catch {
      setError("Error al crear la orden.");
    } finally {
      setSubmitting(false);
    }
  }




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
        


        </section>

        {/* Órdenes recientes */}
        <section className="client-dashboard-card">
          <h2>Mis Órdenes ({visibleOrders.length})</h2>
          {loading ? (
            <p className="client-empty-state">Cargando órdenes...</p>
          ) : visibleOrders.length === 0 ? (
            <p className="client-empty-state">Aún no tienes órdenes. ¡Crea la primera!</p>
          ) : (
            <>
              <table className="client-orders-table">
                <thead className="client-orders-header">
                  <tr >
                    <th>Servicio</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleOrders.map((o) => (
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
              {visibleOrders.length > 5 && (
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
             <div className="modal-overlay" onClick={() => setShowOrderModal(false)}>
               <div className="modal" onClick={(e) => e.stopPropagation()}>
                 <h2>Nueva Orden</h2>
                 <form onSubmit={handleCreateOrder} className="modal-form">
                   <div className="input-group">
                     <label>Tipo de servicio</label>
                     
                     <div className="service-type">
                       <option> Selecciona un tipo de servicio </option>
                     <ServiceTypeSelect
                       value={orderForm.service_type}
                       onChange={(value: string) => setOrderForm({ ...orderForm, service_type: value })}
                     />
                     </div>
                     <div className="input-group">
                     <label>Peso Estimado(lbs)</label>
                      <input
                       type="number"
                       value={orderForm.weight}
                       onChange={(e) => setOrderForm({ ...orderForm, weight: Number(e.target.value) })}
                       required
                     /> 
                     </div>
                   </div>
                   <div className="input-group">
                     <label>Cantidad de piezas</label>
                     <input
                       type="number"
                       min={1}
                       value={orderForm.pieces_count}
                       onChange={(e) => setOrderForm({ ...orderForm, pieces_count: Number(e.target.value) })}
                       required
                     />
                   </div>
                   <div className="input-group">
                     <label>Notas</label>
                     <textarea
                       placeholder="Instrucciones especiales..."
                       value={orderForm.notes}
                       onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                       rows={3}
                     />
                   </div>
                   <div className="modal-actions">
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

