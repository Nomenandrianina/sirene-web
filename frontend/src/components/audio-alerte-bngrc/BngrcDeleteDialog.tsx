import { Loader2, AlertTriangle } from "lucide-react";

interface Props {
  open:      boolean;
  itemName:  string;
  label:     string;       // ex: "l'alerte BNGRC"
  loading:   boolean;
  error?:    string;
  onConfirm: () => void;
  onCancel:  () => void;
}

export function BngrcDeleteDialog({ open, itemName, label, loading, error, onConfirm, onCancel }: Props) {
  if (!open) return null;
  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="dialog-box" onClick={e => e.stopPropagation()}>
        <div className="dialog-icon"><AlertTriangle size={24} /></div>
        <h3 className="dialog-title">Supprimer {label}</h3>
        <p className="dialog-desc">
          Voulez-vous vraiment supprimer <strong>«&nbsp;{itemName}&nbsp;»</strong> ?
          Cette action est irréversible.
        </p>
        {error && <div className="form-error">{error}</div>}
        <div className="dialog-actions">
          <button className="btn-cancel" onClick={onCancel} disabled={loading}>Annuler</button>
          <button className="btn-danger" onClick={onConfirm} disabled={loading}>
            {loading && <Loader2 size={14} className="spin" />} Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}
