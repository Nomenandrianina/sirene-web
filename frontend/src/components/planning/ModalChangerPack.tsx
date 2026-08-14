import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import type { PackType } from '@/types/diffusion';

interface ModalChangerPackProps {
  packs: PackType[];
  currentPackId: number;
  pendingPackId: number | null;
  onClose: () => void;
  onConfirm: (packTypeId: number) => void;
  submitting: boolean;
}

export function ModalChangerPack({
  packs, currentPackId, pendingPackId, onClose, onConfirm, submitting,
}: ModalChangerPackProps) {
  const [selected, setSelected] = useState<number | null>(pendingPackId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="bg-slate-900 px-5 py-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Changer de pack</h3>
          <button onClick={onClose}><X size={16} className="text-slate-400" /></button>
        </div>
        <div className="px-5 py-4 flex flex-col gap-3">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-700 flex gap-2">
            <AlertTriangle size={13} className="mt-0.5 shrink-0" />
            Le changement ne prendra effet qu'au <strong>prochain cycle</strong> — votre pack actuel reste actif jusqu'à son échéance.
          </div>
          {packs.map(p => (
            <button key={p.id} onClick={() => setSelected(p.id)}
              disabled={p.id === currentPackId}
              className={`rounded-xl border-2 p-3 text-left transition-all
                ${selected === p.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}
                ${p.id === currentPackId ? 'opacity-40 cursor-not-allowed' : 'hover:border-blue-300'}`}>
              <div className="text-sm font-semibold capitalize">{p.name} {p.id === currentPackId && '(actuel)'}</div>
              <div className="text-xs text-slate-500">{p.nombreCredits ?? '∞'} crédits · {Number(p.prix).toLocaleString('fr-FR')} Ar</div>
            </button>
          ))}
        </div>
        <div className="px-5 py-4 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border py-2.5 text-sm">Annuler</button>
          <button onClick={() => selected && onConfirm(selected)} disabled={!selected || submitting}
            className="flex-1 rounded-xl bg-blue-600 text-white py-2.5 text-sm font-semibold disabled:opacity-40">
            {submitting ? 'Envoi…' : 'Programmer le changement'}
          </button>
        </div>
      </div>
    </div>
  );
}