import { Loader2, AlertTriangle } from "lucide-react";
 
interface DeleteDialogProps {
  open:      boolean;
  itemName:  string;
  loading:   boolean;
  error:     string;
  onConfirm: () => void;
  onCancel:  () => void;
}
 
export function AlerteBngrcDeleteDialog({
  open, itemName, loading, error, onConfirm, onCancel,
}: DeleteDialogProps) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-icon modal-icon--danger"><AlertTriangle size={22} /></div>
        <h3 className="modal-title">Supprimer l'alerte BNGRC</h3>
        <p className="modal-body">
          Voulez-vous supprimer <strong>« {itemName} »</strong> ?
          <br />
          <span className="modal-warn">Tous les types et catégories associés seront également supprimés.</span>
        </p>
        {error && <div className="form-error">{error}</div>}
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onCancel} disabled={loading}>Annuler</button>
          <button className="btn-danger" onClick={onConfirm} disabled={loading}>
            {loading && <Loader2 size={14} className="spin" />} Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}
