import { useEffect, useState } from "react";
import "./OrderHistory.css";

interface Order {
  id: string;
  service_type: string;
  pieces_count: number;
  notes: string;
  status: string;
  created_at: string;
  estimated_time?: number;
}

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch("http://localhost:8080/api/orders", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error al cargar órdenes");
        return res.json();
      })
      .then((data) => {
  const list = Array.isArray(data) ? data : (data.orders || data.data || []);
  setOrders(list);
  setLoading(false);
})
      .catch(() => {
        setError("No se pudo cargar el historial.");
        setLoading(false);
      });
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
                      {new Date(order.created_at).toLocaleDateString("es-DO")}
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