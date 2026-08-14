import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { fmtHeure, type ClientPlanningSlot } from '@/types/useplanningclient';

interface ModalConfirmCancelProps {
  item: ClientPlanningSlot['items'][0];
  onClose: () => void;
  onConfirm: () => void;
  cancelling: boolean;
}

export function ModalConfirmCancel({ item, onClose, onConfirm, cancelling }: ModalConfirmCancelProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-red-600 px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Annuler la diffusion ?</h3>
            <p className="text-xs text-red-100 mt-0.5">
              Diffusion du {fmtHeure(item.scheduledHeure, item.scheduledMinute)}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10">
            <X size={16} className="text-red-100" />
          </button>
        </div>
        <div className="px-5 py-4 flex flex-col gap-3">
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
            <AlertTriangle size={13} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">
              Cette action est irréversible. Le crédit utilisé vous sera restitué.
            </p>
          </div>
          {item.audioName && (
            <p className="text-xs text-slate-500">
              Son prévu : <span className="font-medium text-slate-700">{item.audioName}</span>
            </p>
          )}
        </div>
        <div className="px-5 py-4 border-t border-slate-100 flex gap-3">
          <button onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm text-slate-600 hover:bg-slate-50">
            Retour
          </button>
          <button
            onClick={onConfirm}
            disabled={cancelling}
            className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
          >
            {cancelling
              ? <><Loader2 size={14} className="animate-spin" /> Annulation…</>
              : <><X size={14} /> Confirmer l'annulation</>}
          </button>
        </div>
      </div>
    </div>
  );
}