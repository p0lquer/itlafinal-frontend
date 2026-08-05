import { useEffect } from "react";
import type { Order } from "../types";

interface Props {
  order: Order | null;
  onClose: () => void;
}

export default function OrderDetailModal({ order, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!order) return null;

  const statusColor: Record<string, string> = {
    recibida:   "#d97b3a",
    en_proceso: "#f0c040",
    lista:      "#2bb673",
    entregada:  "#666",
  };

  const color = statusColor[order.status] || "#888";

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.65)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#0c1a13",
          border: "1px solid rgba(74,222,158,0.18)",
          borderRadius: 16,
          padding: "32px 36px",
          width: 440,
          boxShadow: "0 30px 60px -20px rgba(0,0,0,0.7), 0 0 40px -5px rgba(74,222,158,0.2)",
          fontFamily: "Manrope, sans-serif",
          animation: "cardRise 0.25s ease-out",
        }}
      >
        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 24 }}>
          <div>
            <p style={{ color:"#d97b3a", fontSize:11, letterSpacing:"0.14em", fontWeight:700, margin:0 }}>
              DETALLES DE LA ORDEN
            </p>
            <p style={{ color:"#8aa395", fontSize:12, margin:"4px 0 0", fontFamily:"monospace" }}>
              {order.id}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background:"none", border:"none", color:"#8aa395",
              fontSize:20, cursor:"pointer", lineHeight:1,
            }}
          >✕</button>
        </div>

        {/* Rows */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <Row label="Cliente"          value={order.customer_id} />
          <Row label="Tipo de servicio" value={order.service_type || "—"} />
          <Row label="Piezas"           value={String(order.pieces_count ?? "—")} />
          <Row label="Notas"            value={order.notes || "—"} />
          <Row
            label="Tiempo estimado"
            value={order.estimated_time_minutes
              ? `${Math.round(order.estimated_time_minutes / 60)} minutos`
              : "—"}
          />
          <Row
            label="Estado"
            value={
              <span style={{
                background: color, color:"#fff",
                padding:"2px 14px", borderRadius:20,
                fontSize:12, fontWeight:700,
              }}>
                {order.status}
              </span>
            }
          />
          <Row
            label="Creado"
            value={order.created_at ? new Date(order.created_at).toLocaleString() : "—"}
          />
          <Row
            label="Lista en"
            value={order.ready_at ? new Date(order.ready_at).toLocaleString() : "Calculando..."}
          />
        </div>

        {/* Footer */}
        <button
          onClick={onClose}
          style={{
            marginTop:28, width:"100%", padding:"11px 0",
            borderRadius:9, border:"none",
            background:"linear-gradient(135deg,#4ade9e,#2bb673)",
            color:"#07150f", fontWeight:700, fontSize:14,
            cursor:"pointer", fontFamily:"Manrope, sans-serif",
          }}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{
      display:"flex", justifyContent:"space-between", alignItems:"center",
      borderBottom:"1px solid rgba(255,255,255,0.06)", paddingBottom:10,
    }}>
      <span style={{ color:"#8aa395", fontSize:13 }}>{label}</span>
      <span style={{ color:"#f3f7f4", fontSize:13, maxWidth:240, textAlign:"right" }}>
        {value}
      </span>
    </div>
  );
}