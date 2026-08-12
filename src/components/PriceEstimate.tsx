import { useMemo } from "react";
import { useServiceTypes } from "../hook/useServiceTypes";
import { calculatePriceQuote, formatDop } from "../lib/pricing";
import "./PriceEstimate.css";

interface PriceEstimateProps {
  serviceName: string;
  weight: number;
  pieces: number;
  className?: string;
}

/** Cotizador reutilizable para los formularios de orden de cliente y operador. */
export default function PriceEstimate({ serviceName, weight, pieces, className = "" }: PriceEstimateProps) {
  const { data: services, isLoading } = useServiceTypes();
  const selectedService = useMemo(
    () => services?.find((service) => service.name.localeCompare(serviceName, "es", { sensitivity: "accent" }) === 0),
    [services, serviceName],
  );
  const quote = calculatePriceQuote(serviceName, Number(weight), Number(pieces), selectedService);

  if (!serviceName) {
    return <aside className={`price-estimate is-empty ${className}`} aria-live="polite">Selecciona un servicio para ver el precio estimado.</aside>;
  }

  if (isLoading) {
    return <aside className={`price-estimate is-loading ${className}`} aria-live="polite">Calculando cotización...</aside>;
  }

  if (!quote) {
    return <aside className={`price-estimate is-empty ${className}`} aria-live="polite">Ingresa peso y cantidad de piezas para calcular el total.</aside>;
  }

  return (
    <aside className={`price-estimate ${className}`} aria-live="polite" aria-label={`Precio estimado: ${formatDop(quote.total)}`}>
      <div className="price-estimate__copy">
        <span>Precio estimado</span>
        <strong>{formatDop(quote.total)}</strong>
      </div>
      <div className="price-estimate__detail">
        {quote.isStandardRate
          ? <span>{formatDop(quote.unitPrice)} × {quote.units} {quote.units === 1 ? "unidad" : "unidades"}</span>
          : <span>Calculado según el catálogo del servicio</span>}
        <small>El total final se confirma al registrar la orden.</small>
      </div>
    </aside>
  );
}
