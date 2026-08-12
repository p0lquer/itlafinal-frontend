import { useEffect } from "react";

export type OperatorToastData = {
  message: string;
  tone: "success" | "error" | "info";
};

type OperatorToastProps = {
  toast: OperatorToastData | null;
  onDismiss: () => void;
};

export default function OperatorToast({ toast, onDismiss }: OperatorToastProps) {
  useEffect(() => {
    if (!toast) return;

    const timeoutId = window.setTimeout(onDismiss, 4500);
    return () => window.clearTimeout(timeoutId);
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <div className={`operator-toast operator-toast--${toast.tone}`} role="status" aria-live="polite">
      <span className="operator-toast__icon" aria-hidden="true">
        {toast.tone === "success" ? "✓" : toast.tone === "error" ? "!" : "i"}
      </span>
      <span>{toast.message}</span>
      <button type="button" className="operator-toast__close" onClick={onDismiss} aria-label="Cerrar mensaje">
        ×
      </button>
    </div>
  );
}
