import { useEffect, useState } from "react";
import "./OrderHistory.css";
import { getMyOrders } from "../api/dashboard";
import { getMe } from "../api/auth";
import type { Order } from "../types";


export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(() => {
      const token = localStorage.getItem("token");
      return token ? true : false;
  })
  const [error, setError] = useState("");
  
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

  const calcCosto = (pieces: number) => `$${(pieces * 50).toFixed(2)}`;

  const calcTiempo = (order: Order) =>
    order.estimated_time ? `${order.estimated_time} min` : "—";

  return (
    <div className="history-container">
      <div className="history-card">
        <div className="history-header">
          <h1>Historial de Órdenes</h1>
          <p>Tus últimos pedidos registrados en el sistema</p>
        </div>

        {loading && <p className="history-loading">Cargando historial...</p>}
        {error && <p className="history-error">{error}</p>}

        {!loading && !error && orders.length === 0 && (
          <p className="history-empty">No tienes órdenes registradas aún.</p>
        )}

        {!loading && orders.length > 0 && (
          <div className="history-table-wrapper">
            <table className="history-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Tipo de Lavado</th>
                  <th>Cantidad de Ropa</th>
                  <th>Tiempo Estimado</th>
                  <th>Costo</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, index) => (
                  <tr key={order.id}>
                    <td>{index + 1}</td>
                    <td>{order.service_type}</td>
                    <td>{order.pieces_count} piezas</td>
                    <td>{calcTiempo(order)}</td>
                    <td>{calcCosto(order.pieces_count)}</td>
                    <td>
                      <span className={`badge badge-${order.status}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>
                      {new Date(order.created_at).toLocaleDateString("")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


function setCustomerId(arg0: string) {
  throw new Error("Function not implemented.");
}

