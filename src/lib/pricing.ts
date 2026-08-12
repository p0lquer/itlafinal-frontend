import type { ServiceType } from "../types";

/**
 * Tarifas públicas del catálogo. El servidor conserva la fuente de verdad al
 * guardar la orden; este cálculo sólo da una cotización inmediata al usuario.
 */
export const STANDARD_SERVICE_RATES: Record<string, number> = {
  "lavado en seco": 120,
  "lavado y secado": 150,
  planchado: 115,
  "lavado, secado y planchado": 215,
  "lavado secado y planchado": 215,
};

const normalized = (value?: string) =>
  (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("es-DO");

export function formatDop(value: number) {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

export interface PriceQuote {
  total: number;
  units: number;
  unitPrice: number;
  isStandardRate: boolean;
}

/**
 * Las tarifas estándar se cobran por el mayor entre libras redondeadas hacia
 * arriba y piezas. Así, 1 lb / 1 pieza siempre equivale a la tarifa publicada.
 * Para servicios creados por el operador se conserva el esquema del catálogo.
 */
export function calculatePriceQuote(
  serviceName: string,
  weight: number,
  pieces: number,
  service?: Pick<ServiceType, "base_price" | "price_per_weight" | "price_per_piece">,
): PriceQuote | null {
  if (!serviceName.trim() || !Number.isFinite(weight) || !Number.isFinite(pieces) || weight <= 0 || pieces <= 0) return null;

  const standardRate = STANDARD_SERVICE_RATES[normalized(serviceName)];
  if (standardRate) {
    const units = Math.max(Math.ceil(weight), Math.ceil(pieces));
    return { total: standardRate * units, units, unitPrice: standardRate, isStandardRate: true };
  }

  if (!service) return null;
  const total = service.base_price + service.price_per_weight * weight + service.price_per_piece * pieces;
  return { total, units: 1, unitPrice: total, isStandardRate: false };
}
