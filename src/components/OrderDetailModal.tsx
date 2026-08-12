import { useEffect } from "react";
import type { ReactNode } from "react";
import type { Order } from "../types";
import "./OrderDetailModal.css";

interface Props {
  order: Order | null;
  onClose: () => void;
}

const STATUS_STEPS = ["recibida", "en_proceso", "lista", "entregada"] as const;

function statusLabel(status?: string) {
  const labels: Record<string, string> = {
    recibida: "Recibida",
    en_proceso: "En proceso",
    lista: "Lista para retirar",
    entregada: "Entregada",
  };
  const normalized = status?.toLowerCase() ?? "";
  return labels[normalized] ?? (status ? status.replaceAll("_", " ") : "En actualización");
}

function statusDescription(status?: string) {
  const descriptions: Record<string, string> = {
    recibida: "Tu solicitud fue registrada y será asignada al equipo.",
    en_proceso: "El equipo está trabajando en tus prendas.",
    lista: "Puedes retirar tu orden en el horario de atención.",
    entregada: "La orden se marcó como entregada.",
  };
  return descriptions[status?.toLowerCase() ?? ""] ?? "Estamos actualizando el estado de esta orden.";
}

function statusClass(status?: string) {
  const normalized = status?.toLowerCase();
  return STATUS_STEPS.includes(normalized as (typeof STATUS_STEPS)[number]) ? normalized : "desconocido";
}

function formatDate(date?: string) {
  if (!date) return "Pendiente de actualización";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Pendiente de actualización";
  return parsed.toLocaleDateString("es-DO", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatMinutes(minutes?: number) {
  if (!minutes || minutes <= 0) return "Por confirmar";
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  return remainingMinutes ? `${hours} h ${remainingMinutes} min` : `${hours} h`;
}

function formatPrice(price?: number) {
  return new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" }).format(Number(price) || 0);
}

export default function OrderDetailModal({ order, onClose }: Props) {
  useEffect(() => {
    if (!order) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, order]);

  if (!order) return null;

  const activeStep = Math.max(STATUS_STEPS.indexOf(order.Status.toLowerCase() as (typeof STATUS_STEPS)[number]), 0);

  return (
    <div className="order-detail-overlay" role="presentation" onMouseDown={onClose}>
      <section className="order-detail-modal" role="dialog" aria-modal="true" aria-labelledby="order-detail-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="order-detail-header">
          <div>
            <p className="order-detail-eyebrow">DETALLE DE LA ORDEN</p>
            <h2 id="order-detail-title">{order.ServiceType || "Servicio de lavandería"}</h2>
            <span>{`#${order.ID.slice(0, 8).toUpperCase()}`}</span>
          </div>
          <button type="button" className="order-detail-close" onClick={onClose} aria-label="Cerrar detalle de la orden">×</button>
        </header>

        <section className={`order-detail-status is-${statusClass(order.Status)}`} aria-label={`Estado: ${statusLabel(order.Status)}`}>
          <div>
            <span className="order-detail-status-label">Estado actual</span>
            <strong>{statusLabel(order.Status)}</strong>
          </div>
          <p>{statusDescription(order.Status)}</p>
        </section>

        <div className="order-detail-timeline" aria-label="Progreso de la orden">
          {STATUS_STEPS.map((step, index) => (
            <div key={step} className={`order-detail-step ${index <= activeStep ? "is-complete" : ""} ${index === activeStep ? "is-current" : ""}`}>
              <span aria-hidden="true">{index < activeStep ? "✓" : index + 1}</span>
              <small>{statusLabel(step)}</small>
            </div>
          ))}
        </div>

        <section className="order-detail-summary" aria-label="Resumen de servicio">
          <DetailItem label="Peso estimado" value={`${order.Weight || 0} lb`} />
          <DetailItem label="Piezas" value={`${order.PiecesCount || 0} ${order.PiecesCount === 1 ? "pieza" : "piezas"}`} />
          <DetailItem label="Tiempo estimado" value={formatMinutes(order.EstimatedTime)} />
          <DetailItem label="Costo estimado" value={formatPrice(order.price)} emphasized />
        </section>

        <section className="order-detail-info" aria-label="Información de la orden">
          <DetailItem label="Creada el" value={formatDate(order.CreatedAt)} />
          <DetailItem label="Última actualización" value={formatDate(order.updated_at)} />
          <DetailItem label="Lista desde" value={order.ReadyAt ? formatDate(order.ReadyAt) : "Aún no está lista"} />
        </section>

        <section className="order-detail-notes" aria-labelledby="order-notes-title">
          <h3 id="order-notes-title">Notas para el operador</h3>
          <p>{order.Notes?.trim() || "No agregaste instrucciones especiales para esta orden."}</p>
        </section>

        <footer className="order-detail-footer">
          <span>Recibirás una notificación cuando haya un cambio.</span>
          <button type="button" onClick={onClose}>Entendido</button>
        </footer>
      </section>
    </div>
  );
}

function DetailItem({ label, value, emphasized = false }: { label: string; value: ReactNode; emphasized?: boolean }) {
  return (
    <div className={`order-detail-item ${emphasized ? "is-emphasized" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
