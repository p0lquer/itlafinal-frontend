type ConfirmActionModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  isPending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmActionModal({
  open,
  title,
  description,
  confirmLabel,
  isPending = false,
  onCancel,
  onConfirm,
}: ConfirmActionModalProps) {
  if (!open) return null;

  return (
    <div className="operator-dialog-backdrop" role="presentation" onMouseDown={onCancel}>
      <section
        className="operator-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="operator-dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <span className="operator-dialog__eyebrow">Confirmar acción</span>
        <h2 id="operator-dialog-title">{title}</h2>
        <p>{description}</p>
        <div className="operator-dialog__actions">
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={isPending}>
            Cancelar
          </button>
          <button type="button" className="btn-danger" onClick={onConfirm} disabled={isPending}>
            {isPending ? "Eliminando…" : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
