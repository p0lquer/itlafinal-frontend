import { useEffect, useState } from "react";
import "./Dashboard.css";
import OrderDetailModal from "../components/OrderDetailModal";
import  ServiceTypeSelect  from  "../components/ServiceTypeSelect";
import { useAuthContext } from "../context/authContext";
import {
  
  type Customer, 
  type NewCustomerPayload, 
  type NewOrderPayload, 
  type Order 
} from "../types";
import {
  createCustomer, createOrder, deleteOrder, getCustomers, getOrders, updateOrderStatus} from "../api/dashboard";
const ORDER_STATUSES = ["recibida", "en_proceso", "lista", "entregada"];



function Dashboard() {
  const { logout } = useAuthContext();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderForm, setOrderForm] = useState<NewOrderPayload>({
    CustomerID: "",
    Notes: "",
    PiecesCount: 1,
    ServiceType: "",
    Weight: 0
  });
  const [customerForm, setCustomerForm] = useState<Omit<NewCustomerPayload, "id">>({
    name: "",
    phone: "",
    email: "",
  });

  async function loadData() {
    try {
      const [customersData, ordersData] = await Promise.all([
        getCustomers(),
        getOrders(),
      ]);
      setCustomers(customersData);
      setOrders(ordersData);
    } catch {
      setError("No se pudo conectar con el backend.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
  let active = true

  ;(async () => {
    try {
      setLoading(true)

      const [customersData, ordersData] = await Promise.all([
        getCustomers(),
        getOrders(),
      ])

      if (!active) return

      setCustomers(customersData)
      setOrders(ordersData)
    } catch {
      if (active) setError("No se pudo conectar con el backend.")
    } finally {
      if (active) setLoading(false)
    }
  })()

  return () => {
    active = false
  }
}, [])

  async function handleCreateOrder(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    console.log("========== CREATE ORDER ==========");
  console.log("CustomerID:", customers.find(c => c.ID === orderForm.CustomerID)?.ID);
  console.log("ServiceType:", orderForm.ServiceType);
  console.log("PiecesCount:", orderForm.PiecesCount);
  console.log("Weight:", orderForm.Weight);
  console.log("==================================");

  if (!customers.find(c => c.ID === orderForm.CustomerID)) {
    setError("No se pudo identificar al cliente autenticado.");
    setSubmitting(false);
    return;
  }

  if (!orderForm.ServiceType) {
    setError("Debes seleccionar un tipo de servicio.");
    setSubmitting(false);
    return;
  }

  if (orderForm.PiecesCount < 1) {
    setError("La cantidad de piezas debe ser al menos 1.");
    setSubmitting(false);
    return;
  }

  setSubmitting(true);
  setError("");
    try {
      const payload: NewOrderPayload = {
      CustomerID: customers.find(c => c.ID === orderForm.CustomerID)?.ID || "",
      Notes: orderForm.Notes,
      PiecesCount: Number(orderForm.PiecesCount),
      ServiceType: orderForm.ServiceType,
      Weight: Number(orderForm.Weight),
    };
   console.log("🚨 PAYLOAD BEING SENT:", payload);
      await createOrder(payload);
      
      setShowOrderModal(false);
      
      setOrderForm({ CustomerID: "", Notes: "", PiecesCount: 1, ServiceType: "", Weight: 0 });
      await loadData();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
  console.error("❌ CREATE ORDER ERROR:", error);

  console.log("STATUS:", error.response?.status);
  console.log("BACKEND RESPONSE:", error.response?.data);
  console.log("SENT DATA:", error.config?.data);

  setError(
    error.response?.data?.message ||
    "Error al crear la orden."
  );
}
   finally {
    setSubmitting(false);
  }
}

  async function handleCreateCustomer(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createCustomer({
        ...customerForm,
        id: ""
      });
      setShowCustomerModal(false);
      setCustomerForm({ name: "", phone: "", email: "", });
      await loadData();
    } catch {
      setError("Error al crear el cliente.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(orderId: string, status: string) {
    try {
      await updateOrderStatus(orderId, status);
      await loadData();
    } catch {
      setError("Error al actualizar el estado de la orden.");
    }
  }

  async function handleDeleteOrder(orderId: string) {
   
    try {
      await deleteOrder(orderId);
      await loadData();

    } catch {
      setError("Error al eliminar la orden.");
    }
  }

  return (
    <div className="dashboard-page">
      <nav className="operator-nav" aria-label="Navegación de operador">
        <div className="operator-nav-info">
          <span className="operator-brand">TimeGoBetter</span>
          <span className="operator-nav-label">Operación</span>
        </div>
        <button type="button" className="btn-logout" onClick={logout}>
          Cerrar sesión
        </button>
      </nav>
      <header className="dashboard-header">
        <div>
          <div className="dashboard-eyebrow">TIMEGOBETTER</div>
          <h1>Panel de Operación</h1>
        </div>
        <div className="header-actions"> 
          <button className="btn-secondary" onClick={() => setShowCustomerModal(true)}>
            + Nuevo Cliente
          </button>
          <button className="btn-primary" onClick={() => setShowOrderModal(true)}>
            + Nueva Orden
          </button>
        </div>
      </header>

      {error && <div className="dashboard-error">{error}</div>}

      {loading ? (
        <p className="dashboard-loading">Cargando datos...</p>
      ) : (
        <div className="dashboard-grid">
          <section className="dashboard-card customers-card">
            <h2>Clientes ({customers.length})</h2>
            {customers.length === 0 ? (
              <p className="empty-state">No hay clientes registrados aún.</p>
            ) : (
              <div className="table-scroll"><table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Teléfono</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.ID}>
                      <td>{c.Name}</td>
                      <td>{c.Phone}</td>
                      <td>{c.Email}</td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            )}
          </section>

          <section className="dashboard-card orders-card">
            <h2>Ordenes ({orders.length})</h2>
            {orders.length === 0 ? (
              <p className="empty-state">No hay ordenes registradas aún.</p>
            ) : (
              <div className="table-scroll"><table>
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Servicio</th>
                    <th>Estado</th>
                    <th>Cambiar</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr
                      key={o.ID}
                      onClick={() => setSelectedOrder(o)}
                      style={{ cursor: "pointer" }}
                    >
                      <td>{customers.find(c => c.ID === o.CustomerID)?.Name || o.CustomerID}</td>
                      <td>{o.ServiceType}</td>
                      <td>
                        <span className={`status-badge status-${o.Status}`}>
                          {o.Status}
                        </span>
                      </td>
                      <td>
                        <select
                          className="status-select"
                          value={o.Status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleStatusChange(o.ID, e.target.value);
                          }}
                        >
                          {ORDER_STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <button
                          className="btn-delete"
                          onClick={(e) => {
  e.preventDefault();
  e.stopPropagation();

  console.log("DELETE:", o.ID);

  handleDeleteOrder(o.ID);
}}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            )}
          </section>
        </div>
      )}

      {/* Modal Nueva Orden */}
      {showOrderModal && (
        <div className="modal-overlay" onClick={() => setShowOrderModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Nueva Orden</h2>
            <form onSubmit={handleCreateOrder} className="modal-form">
              <div className="input-group">
                <label>Cliente</label>
                <select
                  value={orderForm.CustomerID}
                  onChange={(e) => setOrderForm({ ...orderForm, CustomerID: e.target.value })}
                  required
                >
                  <option value="">Selecciona un cliente</option>
                  {customers.map((c) => (
                    <option key={c.ID} value={c.ID}>{c.Name}</option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label>Tipo de servicio</label>
                
                <div className="service-type">
                <ServiceTypeSelect
                  value={orderForm.ServiceType}
                  onChange={(value: string) => setOrderForm({ ...orderForm, ServiceType: value })}
                />
                </div>
                <div className="input-group">
                <label>Peso Estimado(lbs)</label>
                 <input
                  type="number"
                  value={orderForm.Weight}
                  onChange={(e) => setOrderForm({ ...orderForm, Weight: Number(e.target.value) })}
                  required
                /> 
                </div>
              </div>
              <div className="input-group">
                <label>Cantidad de piezas</label>
                <input
                  type="number"
                  min={1}
                  value={orderForm.PiecesCount}
                  onChange={(e) => setOrderForm({ ...orderForm, PiecesCount: Number(e.target.value) })}
                  required
                />
              </div>
              
              <div className="input-group">
                <label>Notas</label>
                <textarea
                  placeholder="Instrucciones especiales..."
                  value={orderForm.Notes}
                  onChange={(e) => setOrderForm({ ...orderForm, Notes: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowOrderModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? "Creando..." : "Crear Orden"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nuevo Cliente */}
      {showCustomerModal && (
        <div className="modal-overlay" onClick={() => setShowCustomerModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Nuevo Cliente</h2>
            <form onSubmit={handleCreateCustomer} className="modal-form">
              <p className="empty-state">El ID del cliente se generará automáticamente al guardar.</p>
              <div className="input-group">
                <label>Nombre</label>
                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="input-group">
                <label>Teléfono</label>
                <input
                  type="text"
                  placeholder="809-555-0000"
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                  required
                />
              </div>
              <div className="input-group">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={customerForm.email}
                  onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCustomerModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? "Guardando..." : "Guardar Cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalles de Orden */}
      <OrderDetailModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </div>
  );
}

export default Dashboard;
