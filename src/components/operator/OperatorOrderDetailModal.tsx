import { useEffect } from "react";
import type { Order } from "../../types";

type OperatorOrderDetailModalProps = {
  order: Order | null;
  customerName: string;
  onClose: () => void;
};

const STATUS_LABELS: Record<string, string> = {
  recibida: "Recibida",
  en_proceso: "En proceso",
  lista: "Lista",
  entregada: "Entregada",
};

function formatDate(value?: string) {
  if (!value) return "Sin registro";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Sin registro" : date.toLocaleString("es-DO");
}

function getEstimatedCost(order: Order) {
  const data = order as unknown as { EstimatedCost?: number; estimated_cost?: number; price?: number };
  return data.EstimatedCost ?? data.estimated_cost ?? data.price;
}

export default function OperatorOrderDetailModal({
  order,
  customerName,
  onClose,
}: OperatorOrderDetailModalProps) {
  useEffect(() => {
    if (!order) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, order]);

  if (!order) return null;

  const estimatedCost = getEstimatedCost(order);

  return (
    <div className="operator-dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="operator-order-detail"
        role="dialog"
        aria-modal="true"
        aria-labelledby="operator-order-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="operator-order-detail__header">
          <div>
            <span className="operator-dialog__eyebrow">Detalle de orden</span>
            <h2 id="operator-order-title">Orden #{order.ID.slice(0, 8)}</h2>
          </div>
          <button type="button" className="operator-icon-button" onClick={onClose} aria-label="Cerrar detalle">
            ×
          </button>
        </div>

        <div className="operator-detail-status">
          <span>Estado actual</span>
          <strong className={`status-badge status-${order.Status}`}>
            {STATUS_LABELS[order.Status] ?? order.Status}
          </strong>
        </div>

        <dl className="operator-detail-grid">
          <DetailItem label="Cliente" value={customerName} />
          <DetailItem label="Servicio" value={order.ServiceType || "Sin especificar"} />
          <DetailItem label="Peso" value={`${order.Weight ?? 0} lb`} />
          <DetailItem label="Piezas" value={String(order.PiecesCount ?? 0)} />
          <DetailItem label="Costo estimado" value={estimatedCost === undefined ? "Pendiente" : `$${estimatedCost.toFixed(2)}`} />
          <DetailItem
            label="Tiempo estimado"
            value={order.EstimatedTime ? `${Math.round(order.EstimatedTime)} min` : "Pendiente"}
          />
          <DetailItem label="Creada" value={formatDate(order.CreatedAt)} />
          <DetailItem label="Lista para entrega" value={formatDate(order.ReadyAt)} />
        </dl>

        <div className="operator-detail-notes">
          <span>Notas</span>
          <p>{order.Notes?.trim() || "No se registraron instrucciones especiales."}</p>
        </div>

        <button type="button" className="btn-primary operator-detail-close" onClick={onClose}>
          Entendido
        </button>
      </section>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
