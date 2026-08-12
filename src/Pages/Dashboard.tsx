import { useCallback, useEffect, useMemo, useState } from "react";
import "./Dashboard.css";
import ServiceTypeSelect from "../components/ServiceTypeSelect";
import ConfirmActionModal from "../components/operator/ConfirmActionModal";
import OperatorOrderDetailModal from "../components/operator/OperatorOrderDetailModal";
import OperatorToast, { type OperatorToastData } from "../components/operator/OperatorToast";
import { useAuthContext } from "../context/authContext";
import type { Customer, NewCustomerPayload, NewOrderPayload, Order } from "../types";
import {
  createCustomer,
  createOrder,
  deleteOrder,
  getCustomers,
  getOrders,
  updateOrderStatus,
} from "../api/dashboard";

const ORDER_STATUSES = ["recibida", "en_proceso", "lista", "entregada"] as const;

const STATUS_LABELS: Record<string, string> = {
  recibida: "Recibida",
  en_proceso: "En proceso",
  lista: "Lista",
  entregada: "Entregada",
};

const NEXT_STATUS: Record<string, (typeof ORDER_STATUSES)[number] | undefined> = {
  recibida: "en_proceso",
  en_proceso: "lista",
  lista: "entregada",
  entregada: undefined,
};

type OrderFilters = {
  search: string;
  status: string;
  service: string;
  date: string;
};

function formatStatus(status: string) {
  return STATUS_LABELS[status] ?? status.replace(/_/g, " ");
}

function formatDate(value?: string, withTime = false) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return withTime
    ? date.toLocaleString("es-DO", { dateStyle: "medium", timeStyle: "short" })
    : date.toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" });
}

function toDateInputValue(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function getEstimatedCost(order: Order) {
  const data = order as unknown as { EstimatedCost?: number; estimated_cost?: number; price?: number };
  return data.EstimatedCost ?? data.estimated_cost ?? data.price;
}

function getApiErrorMessage(error: unknown, fallback: string) {
  const response = error as { response?: { data?: { error?: string; message?: string } } };
  return response.response?.data?.message ?? response.response?.data?.error ?? fallback;
}

async function fetchDashboardData() {
  const [customersData, ordersData] = await Promise.all([getCustomers(), getOrders()]);
  const orderPayload = ordersData as unknown as { data?: Order[]; orders?: Order[]; items?: Order[] };
  const rawOrders = Array.isArray(ordersData)
    ? ordersData
    : orderPayload.data ?? orderPayload.orders ?? orderPayload.items ?? [];
  const rawCustomers = Array.isArray(customersData) ? customersData : [];

  return {
    customers: rawCustomers.map(normalizeCustomer),
    orders: rawOrders.map(normalizeOrder),
  };
}

function normalizeCustomer(value: Customer): Customer {
  const customer = value as unknown as Record<string, unknown>;
  return {
    ID: String(customer.ID ?? customer.id ?? ""),
    Name: String(customer.Name ?? customer.name ?? "Cliente sin nombre"),
    Phone: String(customer.Phone ?? customer.phone ?? ""),
    Email: String(customer.Email ?? customer.email ?? ""),
  };
}

function normalizeOrder(value: Order): Order {
  const order = value as unknown as Record<string, unknown>;
  const numberValue = (primary: unknown, secondary: unknown) => Number(primary ?? secondary ?? 0);

  return {
    ID: String(order.ID ?? order.id ?? ""),
    CustomerID: String(order.CustomerID ?? order.customer_id ?? ""),
    Status: String(order.Status ?? order.status ?? "recibida"),
    ServiceType: String(order.ServiceType ?? order.service_type ?? ""),
    service_type_id: typeof order.service_type_id === "string" ? order.service_type_id : undefined,
    PiecesCount: numberValue(order.PiecesCount, order.pieces_count),
    Weight: numberValue(order.Weight, order.weight),
    price: numberValue(order.price ?? order.EstimatedCost, order.estimated_cost),
    EstimatedTime: numberValue(order.EstimatedTime ?? order.estimated_time, order.estimated_time_minutes),
    CreatedAt: String(order.CreatedAt ?? order.created_at ?? ""),
    updated_at: String(order.updated_at ?? order.UpdatedAt ?? ""),
    ReadyAt: typeof (order.ReadyAt ?? order.ready_at) === "string" ? String(order.ReadyAt ?? order.ready_at) : undefined,
    Notes: typeof (order.Notes ?? order.notes) === "string" ? String(order.Notes ?? order.notes) : undefined,
  };
}

function Dashboard() {
  const { logout } = useAuthContext();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<OperatorToastData | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionOrderId, setActionOrderId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [filters, setFilters] = useState<OrderFilters>({
    search: "",
    status: "",
    service: "",
    date: "",
  });
  const [orderForm, setOrderForm] = useState<NewOrderPayload>({
    CustomerID: "",
    Notes: "",
    PiecesCount: 1,
    ServiceType: "",
    Weight: 0,
  });
  const [customerForm, setCustomerForm] = useState<Omit<NewCustomerPayload, "id">>({
    name: "",
    phone: "",
    email: "",
  });

  const dismissToast = useCallback(() => setToast(null), []);
  const showToast = useCallback((message: string, tone: OperatorToastData["tone"]) => {
    setToast({ message, tone });
  }, []);

  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      setError("");
      const data = await fetchDashboardData();
      setCustomers(data.customers);
      setOrders(data.orders);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "No se pudieron cargar los datos de operación."));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadInitialData() {
      try {
        const data = await fetchDashboardData();
        if (!isActive) return;
        setCustomers(data.customers);
        setOrders(data.orders);
      } catch (requestError) {
        if (isActive) {
          setError(getApiErrorMessage(requestError, "No se pudieron cargar los datos de operación."));
        }
      } finally {
        if (isActive) setLoading(false);
      }
    }

    void loadInitialData();
    return () => { isActive = false; };
  }, []);

  const customersById = useMemo(
    () => new Map(customers.map((customer) => [customer.ID, customer])),
    [customers],
  );

  const services = useMemo(
    () => [...new Set(orders.map((order) => order.ServiceType).filter(Boolean))].sort(),
    [orders],
  );

  const visibleOrders = useMemo(() => {
    const search = filters.search.trim().toLocaleLowerCase();

    return [...orders]
      .filter((order) => {
        const customer = customersById.get(order.CustomerID);
        const matchesSearch = !search || [
          customer?.Name,
          customer?.Email,
          order.ID,
          order.ServiceType,
        ].some((value) => value?.toLocaleLowerCase().includes(search));

        const matchesStatus = !filters.status || order.Status === filters.status;
        const matchesService = !filters.service || order.ServiceType === filters.service;
        const matchesDate = !filters.date || toDateInputValue(order.CreatedAt) === filters.date;

        return matchesSearch && matchesStatus && matchesService && matchesDate;
      })
      .sort((first, second) => {
        const firstDate = new Date(first.CreatedAt).getTime() || 0;
        const secondDate = new Date(second.CreatedAt).getTime() || 0;
        return secondDate - firstDate;
      });
  }, [customersById, filters, orders]);

  const metrics = useMemo(() => {
    const today = toDateInputValue(new Date().toISOString());
    const activeCustomers = new Set(
      orders.filter((order) => order.Status !== "entregada").map((order) => order.CustomerID),
    ).size;

    return {
      todayOrders: orders.filter((order) => toDateInputValue(order.CreatedAt) === today).length,
      inProcess: orders.filter((order) => order.Status === "en_proceso").length,
      ready: orders.filter((order) => order.Status === "lista").length,
      activeCustomers,
    };
  }, [orders]);

  function resetOrderForm() {
    setOrderForm({ CustomerID: "", Notes: "", PiecesCount: 1, ServiceType: "", Weight: 0 });
    setFormError("");
  }

  function resetCustomerForm() {
    setCustomerForm({ name: "", phone: "", email: "" });
    setFormError("");
  }

  function openOrderModal() {
    resetOrderForm();
    setShowOrderModal(true);
  }

  function openCustomerModal() {
    resetCustomerForm();
    setShowCustomerModal(true);
  }

  function closeOrderModal() {
    if (submitting) return;
    setShowOrderModal(false);
    resetOrderForm();
  }

  function closeCustomerModal() {
    if (submitting) return;
    setShowCustomerModal(false);
    resetCustomerForm();
  }

  async function handleCreateOrder(event: React.FormEvent) {
    event.preventDefault();
    const piecesCount = Number(orderForm.PiecesCount);
    const weight = Number(orderForm.Weight);

    if (!orderForm.CustomerID) {
      setFormError("Selecciona el cliente que recibirá esta orden.");
      return;
    }
    if (!orderForm.ServiceType) {
      setFormError("Selecciona un tipo de servicio.");
      return;
    }
    if (!Number.isInteger(piecesCount) || piecesCount < 1 || piecesCount > 300) {
      setFormError("La orden debe tener entre 1 y 300 piezas.");
      return;
    }
    if (!Number.isFinite(weight) || weight <= 0 || weight > 100) {
      setFormError("El peso debe estar entre 0.1 y 100 libras.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    try {
      await createOrder({ ...orderForm, PiecesCount: piecesCount, Weight: weight });
      setShowOrderModal(false);
      resetOrderForm();
      showToast("Orden creada y registrada como recibida.", "success");
      await loadData();
    } catch (requestError) {
      setFormError(getApiErrorMessage(requestError, "No se pudo crear la orden."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateCustomer(event: React.FormEvent) {
    event.preventDefault();
    const name = customerForm.name.trim();
    const email = customerForm.email.trim().toLocaleLowerCase();
    const phone = customerForm.phone.trim();

    if (name.length < 2) {
      setFormError("Escribe el nombre completo del cliente.");
      return;
    }
    if (phone.replace(/\D/g, "").length < 7) {
      setFormError("Escribe un número telefónico válido.");
      return;
    }
    if (customers.some((customer) => customer.Email.trim().toLocaleLowerCase() === email)) {
      setFormError("Ya existe un cliente registrado con este correo.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    try {
      await createCustomer({ id: "", name, email, phone });
      setShowCustomerModal(false);
      resetCustomerForm();
      showToast("Cliente creado correctamente.", "success");
      await loadData();
    } catch (requestError) {
      setFormError(getApiErrorMessage(requestError, "No se pudo crear el cliente."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(order: Order) {
    const nextStatus = NEXT_STATUS[order.Status];
    if (!nextStatus) return;

    setActionOrderId(order.ID);
    try {
      await updateOrderStatus(order.ID, nextStatus);
      showToast(`Orden #${order.ID.slice(0, 8)} actualizada a “${formatStatus(nextStatus)}”.`, "success");
      await loadData();
    } catch (requestError) {
      showToast(getApiErrorMessage(requestError, "No se pudo actualizar el estado de la orden."), "error");
    } finally {
      setActionOrderId(null);
    }
  }

  async function handleDeleteOrder() {
    if (!orderToDelete) return;

    setActionOrderId(orderToDelete.ID);
    try {
      await deleteOrder(orderToDelete.ID);
      setOrderToDelete(null);
      showToast("La orden fue eliminada.", "success");
      await loadData();
    } catch (requestError) {
      showToast(getApiErrorMessage(requestError, "No se pudo eliminar la orden."), "error");
    } finally {
      setActionOrderId(null);
    }
  }

  function resetFilters() {
    setFilters({ search: "", status: "", service: "", date: "" });
  }

  function exportVisibleOrders() {
    const quote = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
    const rows = [
      ["Orden", "Cliente", "Correo", "Servicio", "Piezas", "Peso (lb)", "Costo estimado", "Estado", "Creada"],
      ...visibleOrders.map((order) => {
        const customer = customersById.get(order.CustomerID);
        const estimatedCost = getEstimatedCost(order);
        return [
          order.ID,
          customer?.Name ?? "Cliente sin identificar",
          customer?.Email ?? "",
          order.ServiceType ?? "",
          order.PiecesCount,
          order.Weight,
          estimatedCost ?? "",
          formatStatus(order.Status),
          formatDate(order.CreatedAt, true),
        ];
      }),
    ];
    const csv = `\ufeff${rows.map((row) => row.map(quote).join(",")).join("\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `timegobetter-ordenes-${toDateInputValue(new Date().toISOString()) || "reporte"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Reporte CSV generado con ${visibleOrders.length} ordenes.`, "success");
  }

  const hasFilters = Boolean(filters.search || filters.status || filters.service || filters.date);

  return (
    <div className="dashboard-page">
      <nav className="operator-nav" aria-label="Navegación de operador">
        <div className="operator-nav-info">
          <span className="operator-brand">TimeGoBetter</span>
          <span className="operator-nav-label">Centro de operaciones</span>
        </div>
        <button type="button" className="btn-logout" onClick={logout}>
          Cerrar sesión
        </button>
      </nav>

      <main>
        <header className="dashboard-header">
          <div>
            <div className="dashboard-eyebrow">OPERACIÓN EN TIEMPO REAL</div>
            <h1>Control de lavandería</h1>
            <p>Consulta, organiza y avanza cada orden desde un solo lugar.</p>
          </div>
          <div className="header-actions">
            <button type="button" className="btn-secondary" onClick={openCustomerModal}>
              + Nuevo cliente
            </button>
            <button type="button" className="btn-primary" onClick={openOrderModal} disabled={customers.length === 0}>
              + Nueva orden
            </button>
          </div>
        </header>

        {error && (
          <div className="dashboard-error" role="alert">
            <div>
              <strong>No pudimos actualizar el panel.</strong>
              <span>{error}</span>
            </div>
            <button type="button" className="btn-secondary" onClick={() => void loadData()}>
              Reintentar
            </button>
          </div>
        )}

        {loading ? (
          <DashboardSkeleton />
        ) : (
          <>
            <section className="operator-metrics" aria-label="Resumen de operación">
              <MetricCard label="Órdenes de hoy" value={metrics.todayOrders} detail="Ingresadas durante la jornada" tone="primary" />
              <MetricCard label="En proceso" value={metrics.inProcess} detail="Actualmente en producción" tone="warning" />
              <MetricCard label="Listas para entrega" value={metrics.ready} detail="Esperan ser retiradas" tone="info" />
              <MetricCard label="Clientes activos" value={metrics.activeCustomers} detail="Con órdenes aún abiertas" tone="neutral" />
            </section>

            <section className="operator-workspace">
              <div className="operator-orders-panel">
                <div className="operator-panel-heading">
                  <div>
                    <span className="operator-section-kicker">BANDEJA DE PRODUCCIÓN</span>
                    <h2>Órdenes</h2>
                    <p>{visibleOrders.length} de {orders.length} órdenes visibles</p>
                  </div>
                  <div className="operator-panel-actions">
                    <button
                      type="button"
                      className="operator-refresh-button"
                      onClick={exportVisibleOrders}
                      disabled={visibleOrders.length === 0}
                    >
                      Exportar CSV
                    </button>
                  <button
                    type="button"
                    className="operator-refresh-button"
                    onClick={() => void loadData()}
                    disabled={refreshing}
                  >
                    {refreshing ? "Actualizando…" : "↻ Actualizar"}
                  </button>
                  </div>
                </div>

                <div className="operator-filter-bar" aria-label="Filtros de órdenes">
                  <label className="operator-search-field">
                    <span className="sr-only">Buscar una orden</span>
                    <span aria-hidden="true">⌕</span>
                    <input
                      type="search"
                      placeholder="Buscar por cliente, correo u orden"
                      value={filters.search}
                      onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                    />
                  </label>
                  <select
                    aria-label="Filtrar por estado"
                    value={filters.status}
                    onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
                  >
                    <option value="">Todos los estados</option>
                    {ORDER_STATUSES.map((status) => <option key={status} value={status}>{formatStatus(status)}</option>)}
                  </select>
                  <select
                    aria-label="Filtrar por servicio"
                    value={filters.service}
                    onChange={(event) => setFilters((current) => ({ ...current, service: event.target.value }))}
                  >
                    <option value="">Todos los servicios</option>
                    {services.map((service) => <option key={service} value={service}>{service}</option>)}
                  </select>
                  <input
                    aria-label="Filtrar por fecha"
                    type="date"
                    value={filters.date}
                    onChange={(event) => setFilters((current) => ({ ...current, date: event.target.value }))}
                  />
                  {hasFilters && <button type="button" className="operator-clear-filters" onClick={resetFilters}>Limpiar</button>}
                </div>

                {visibleOrders.length === 0 ? (
                  <div className="operator-empty-state">
                    <span className="operator-empty-state__icon" aria-hidden="true">⌕</span>
                    <h3>{orders.length === 0 ? "Aún no hay órdenes" : "No encontramos coincidencias"}</h3>
                    <p>
                      {orders.length === 0
                        ? "Crea la primera orden para empezar a organizar la producción."
                        : "Prueba otro nombre, estado, servicio o fecha."}
                    </p>
                    {orders.length === 0 ? (
                      <button type="button" className="btn-primary" onClick={openOrderModal} disabled={customers.length === 0}>
                        Crear orden
                      </button>
                    ) : (
                      <button type="button" className="btn-secondary" onClick={resetFilters}>Restablecer filtros</button>
                    )}
                  </div>
                ) : (
                  <div className="operator-table-wrap">
                    <table className="operator-orders-table">
                      <thead>
                        <tr>
                          <th>Orden / cliente</th>
                          <th>Servicio</th>
                          <th>Detalle</th>
                          <th>Estado</th>
                          <th>Creada</th>
                          <th aria-label="Acciones" />
                        </tr>
                      </thead>
                      <tbody>
                        {visibleOrders.map((order) => {
                          const customer = customersById.get(order.CustomerID);
                          const nextStatus = NEXT_STATUS[order.Status];
                          const estimatedCost = getEstimatedCost(order);
                          const isWorking = actionOrderId === order.ID;

                          return (
                            <tr key={order.ID}>
                              <td>
                                <button
                                  type="button"
                                  className="operator-order-reference"
                                  onClick={() => setSelectedOrder(order)}
                                >
                                  <strong>{customer?.Name || "Cliente sin identificar"}</strong>
                                  <span>#{order.ID.slice(0, 8)} · {customer?.Email || order.CustomerID}</span>
                                </button>
                              </td>
                              <td>
                                <strong>{order.ServiceType || "Sin especificar"}</strong>
                                <span className="operator-cell-subtitle">
                                  {estimatedCost === undefined ? "Costo pendiente" : `$${estimatedCost.toFixed(2)} estimado`}
                                </span>
                              </td>
                              <td>
                                <span>{order.PiecesCount} piezas · {order.Weight} lb</span>
                                <span className="operator-cell-subtitle">
                                  {order.EstimatedTime ? `${Math.round(order.EstimatedTime)} min estimados` : "Tiempo pendiente"}
                                </span>
                              </td>
                              <td>
                                <span className={`status-badge status-${order.Status}`}>{formatStatus(order.Status)}</span>
                                <span className="operator-cell-subtitle">
                                  {nextStatus ? `Sigue: ${formatStatus(nextStatus)}` : "Ciclo completado"}
                                </span>
                              </td>
                              <td>{formatDate(order.CreatedAt, true)}</td>
                              <td>
                                <div className="operator-row-actions">
                                  {nextStatus ? (
                                    <button
                                      type="button"
                                      className="operator-advance-button"
                                      onClick={() => void handleStatusChange(order)}
                                      disabled={isWorking}
                                    >
                                      {isWorking ? "Guardando…" : `Pasar a ${formatStatus(nextStatus)}`}
                                    </button>
                                  ) : (
                                    <span className="operator-complete-label">Completada</span>
                                  )}
                                  <button
                                    type="button"
                                    className="operator-more-button"
                                    onClick={() => setSelectedOrder(order)}
                                  >
                                    Ver detalle
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-delete"
                                    onClick={() => setOrderToDelete(order)}
                                    disabled={isWorking}
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <aside className="operator-customers-panel">
                <div className="operator-panel-heading">
                  <div>
                    <span className="operator-section-kicker">DIRECTORIO</span>
                    <h2>Clientes</h2>
                    <p>{customers.length} registrados</p>
                  </div>
                  <button type="button" className="operator-text-action" onClick={openCustomerModal}>Agregar</button>
                </div>
                {customers.length === 0 ? (
                  <div className="operator-compact-empty">
                    <p>Registra un cliente antes de crear órdenes.</p>
                    <button type="button" className="btn-secondary" onClick={openCustomerModal}>Nuevo cliente</button>
                  </div>
                ) : (
                  <ul className="operator-customer-list">
                    {customers.slice(0, 6).map((customer) => (
                      <li key={customer.ID}>
                        <span className="operator-customer-avatar">{customer.Name.slice(0, 1).toUpperCase()}</span>
                        <div>
                          <strong>{customer.Name}</strong>
                          <span>{customer.Email}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </aside>
            </section>
          </>
        )}
      </main>

      {showOrderModal && (
        <div className="operator-dialog-backdrop" role="presentation" onMouseDown={closeOrderModal}>
          <section className="operator-form-modal" role="dialog" aria-modal="true" aria-labelledby="new-order-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="operator-form-modal__header">
              <div>
                <span className="operator-dialog__eyebrow">NUEVA ORDEN</span>
                <h2 id="new-order-title">Registrar ingreso</h2>
              </div>
              <button type="button" className="operator-icon-button" onClick={closeOrderModal} aria-label="Cerrar formulario">×</button>
            </div>
            <p className="operator-form-intro">La orden iniciará en estado <strong>Recibida</strong>.</p>
            <form onSubmit={handleCreateOrder} className="operator-form">
              <label>
                Cliente
                <select value={orderForm.CustomerID} onChange={(event) => setOrderForm({ ...orderForm, CustomerID: event.target.value })} required>
                  <option value="">Selecciona un cliente</option>
                  {customers.map((customer) => <option key={customer.ID} value={customer.ID}>{customer.Name}</option>)}
                </select>
              </label>
              <label>
                Tipo de servicio
                <ServiceTypeSelect value={orderForm.ServiceType} onChange={(value) => setOrderForm({ ...orderForm, ServiceType: value })} />
              </label>
              <div className="operator-form__two-columns">
                <label>
                  Peso estimado (lb)
                  <input type="number" min="0.1" max="100" step="0.1" value={orderForm.Weight || ""} onChange={(event) => setOrderForm({ ...orderForm, Weight: Number(event.target.value) })} required />
                </label>
                <label>
                  Cantidad de piezas
                  <input type="number" min="1" max="300" step="1" value={orderForm.PiecesCount} onChange={(event) => setOrderForm({ ...orderForm, PiecesCount: Number(event.target.value) })} required />
                </label>
              </div>
              <label>
                Notas
                <textarea rows={3} maxLength={500} placeholder="Instrucciones especiales para el equipo…" value={orderForm.Notes} onChange={(event) => setOrderForm({ ...orderForm, Notes: event.target.value })} />
              </label>
              {formError && <p className="operator-form-error" role="alert">{formError}</p>}
              <div className="operator-form__actions">
                <button type="button" className="btn-secondary" onClick={closeOrderModal} disabled={submitting}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? "Creando…" : "Crear orden"}</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {showCustomerModal && (
        <div className="operator-dialog-backdrop" role="presentation" onMouseDown={closeCustomerModal}>
          <section className="operator-form-modal operator-form-modal--small" role="dialog" aria-modal="true" aria-labelledby="new-customer-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="operator-form-modal__header">
              <div>
                <span className="operator-dialog__eyebrow">NUEVO CLIENTE</span>
                <h2 id="new-customer-title">Crear perfil</h2>
              </div>
              <button type="button" className="operator-icon-button" onClick={closeCustomerModal} aria-label="Cerrar formulario">×</button>
            </div>
            <form onSubmit={handleCreateCustomer} className="operator-form">
              <label>
                Nombre completo
                <input type="text" autoComplete="name" placeholder="Ej. Ana Martínez" value={customerForm.name} onChange={(event) => setCustomerForm({ ...customerForm, name: event.target.value })} required />
              </label>
              <label>
                Teléfono
                <input type="tel" autoComplete="tel" placeholder="809-555-0000" value={customerForm.phone} onChange={(event) => setCustomerForm({ ...customerForm, phone: event.target.value })} required />
              </label>
              <label>
                Correo electrónico
                <input type="email" autoComplete="email" placeholder="cliente@ejemplo.com" value={customerForm.email} onChange={(event) => setCustomerForm({ ...customerForm, email: event.target.value })} required />
              </label>
              {formError && <p className="operator-form-error" role="alert">{formError}</p>}
              <div className="operator-form__actions">
                <button type="button" className="btn-secondary" onClick={closeCustomerModal} disabled={submitting}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? "Guardando…" : "Guardar cliente"}</button>
              </div>
            </form>
          </section>
        </div>
      )}

      <ConfirmActionModal
        open={Boolean(orderToDelete)}
        title="¿Eliminar esta orden?"
        description={`La orden #${orderToDelete?.ID.slice(0, 8) ?? ""} dejará de estar disponible en el historial. Esta acción no se puede deshacer.`}
        confirmLabel="Sí, eliminar orden"
        isPending={Boolean(orderToDelete && actionOrderId === orderToDelete.ID)}
        onCancel={() => setOrderToDelete(null)}
        onConfirm={() => void handleDeleteOrder()}
      />
      <OperatorOrderDetailModal
        order={selectedOrder}
        customerName={selectedOrder ? customersById.get(selectedOrder.CustomerID)?.Name || selectedOrder.CustomerID : ""}
        onClose={() => setSelectedOrder(null)}
      />
      <OperatorToast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: number;
  detail: string;
  tone: "primary" | "warning" | "info" | "neutral";
}) {
  return (
    <article className={`operator-metric-card operator-metric-card--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function DashboardSkeleton() {
  return (
    <div className="operator-skeleton" aria-label="Cargando panel de operación" aria-busy="true">
      <div className="operator-skeleton__metrics">
        {[0, 1, 2, 3].map((item) => <span key={item} />)}
      </div>
      <div className="operator-skeleton__content">
        <span />
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

export default Dashboard;
