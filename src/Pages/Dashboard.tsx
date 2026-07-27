import { useEffect, useState } from "react";
import "./Dashboard.css";
import OrderDetailModal from "../components/OrderDetailModal";

interface Customer {
  ID: string;
  Name: string;
  Phone: string;
  Email: string;
}

interface Order {
  ID: string;
  CustomerID: string;
  Status: string;
  ServiceType?: string;
  PiecesCount?: number;
  Notes?: string;
  EstimatedTime?: number;
  CreatedAt?: string;
  ReadyAt?: string | null;
}

interface NewOrderForm {
  customer_id: string;
  notes: string;
  pieces_count: number;
  service_type: string;
}

interface NewCustomerForm {
  id: string;
  name: string;
  phone: string;
  email: string;
}

const ORDER_STATUSES = ["recibida", "en_proceso", "lista", "entregada"];

function Dashboard() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderForm, setOrderForm] = useState<NewOrderForm>({
    customer_id: "",
    notes: "",
    pieces_count: 1,
    service_type: "",
  });
  const [customerForm, setCustomerForm] = useState<NewCustomerForm>({
    id: "",
    name: "",
    phone: "",
    email: "",
  });

  async function loadData() {
    try {
      const [customersRes, ordersRes] = await Promise.all([
        fetch("http://localhost:8080/api/customers"),
        fetch("http://localhost:8080/api/orders"),
      ]);
      if (!customersRes.ok || !ordersRes.ok) throw new Error();
      const customersData = await customersRes.json();
      const ordersData = await ordersRes.json();
      setCustomers(customersData || []);
      setOrders(ordersData || []);
    } catch {
      setError("No se pudo conectar con el backend.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreateOrder(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("http://localhost:8080/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...orderForm,
          pieces_count: Number(orderForm.pieces_count),
        }),
      });
      if (!res.ok) throw new Error();
      setShowOrderModal(false);
      setOrderForm({ customer_id: "", notes: "", pieces_count: 1, service_type: "" });
      await loadData();
    } catch {
      setError("Error al crear la orden.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateCustomer(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("http://localhost:8080/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerForm),
      });
      if (!res.ok) throw new Error();
      setShowCustomerModal(false);
      setCustomerForm({ id: "", name: "", phone: "", email: "" });
      await loadData();
    } catch {
      setError("Error al crear el cliente.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(orderId: string, newStatus: string) {
    try {
      const res = await fetch(`http://localhost:8080/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      await loadData();
    } catch {
      setError("Error al actualizar el estado de la orden.");
    }
  }

  async function handleDeleteOrder(orderId: string) {
    if (!confirm("¿Segura que quieres eliminar esta orden?")) return;
    try {
      const res = await fetch(`http://localhost:8080/api/orders/${orderId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      await loadData();
    } catch {
      setError("Error al eliminar la orden.");
    }
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <div className="dashboard-eyebrow">SISTEMA DE GESTIÓN DE ÓRDENES</div>
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
          <section className="dashboard-card">
            <h2>Clientes ({customers.length})</h2>
            {customers.length === 0 ? (
              <p className="empty-state">No hay clientes registrados aún.</p>
            ) : (
              <table>
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
              </table>
            )}
          </section>

          <section className="dashboard-card">
            <h2>Órdenes ({orders.length})</h2>
            {orders.length === 0 ? (
              <p className="empty-state">No hay órdenes registradas aún.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Servicio</th>
                    <th>Estado</th>
                    <th>Cambiar</th>
                    <th></th>
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
                      <td>{o.Status}</td>
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
                            e.stopPropagation();
                            handleDeleteOrder(o.ID);
                          }}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                  value={orderForm.customer_id}
                  onChange={(e) => setOrderForm({ ...orderForm, customer_id: e.target.value })}
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
                <input
                  type="text"
                  placeholder="Ej: Lavado, Planchado, Seco"
                  value={orderForm.service_type}
                  onChange={(e) => setOrderForm({ ...orderForm, service_type: e.target.value })}
                  required
                />
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
              <div className="input-group">
                <label>ID del cliente</label>
                <input
                  type="text"
                  placeholder="Ej: c3, c4..."
                  value={customerForm.id}
                  onChange={(e) => setCustomerForm({ ...customerForm, id: e.target.value })}
                  required
                />
              </div>
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