import { AlertTriangle, Loader2 } from "lucide-react";

interface DeleteDialogProps {
    open: boolean; itemName: string; loading: boolean; error: string;
    onConfirm: () => void; onCancel: () => void;
  }
  
  function TypeAlerteBngrcDeleteDialog({ open, itemName, loading, error, onConfirm, onCancel }: DeleteDialogProps) {
    if (!open) return null;
    return (
      <div className="modal-overlay" onClick={onCancel}>
        <div className="modal-card" onClick={e => e.stopPropagation()}>
          <div className="modal-icon modal-icon--danger"><AlertTriangle size={22} /></div>
          <h3 className="modal-title">Supprimer l'aléa</h3>
          <p className="modal-body">
            Voulez-vous supprimer <strong>« {itemName} »</strong> ?
            <br />
            <span className="modal-warn">Toutes les catégories associées seront également supprimées.</span>
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
   