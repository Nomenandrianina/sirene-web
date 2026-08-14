import { useState } from 'react';
import { X, Pencil, CheckCircle, Loader2 } from 'lucide-react';
import { fmtHeure, type ClientPlanningSlot, type AudioDisponible } from '@/types/useplanningclient';

interface ModalModifierProps {
  item: ClientPlanningSlot['items'][0];
  audios: AudioDisponible[];
  onClose: () => void;
  onConfirm: (audioId: number) => Promise<void>;
  modifying: boolean;
  modifyError: string | null;
}

export function ModalModifier({
  item, audios, onClose, onConfirm, modifying, modifyError,
}: ModalModifierProps) {
  const [audioId, setAudioId] = useState<number | ''>(item.alerteAudioId ?? '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-blue-700 px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Modifier le son</h3>
            <p className="text-xs text-blue-200 mt-0.5">
              Diffusion du {fmtHeure(item.scheduledHeure, item.scheduledMinute)}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10">
            <X size={16} className="text-blue-200" />
          </button>
        </div>
        <div className="px-5 py-4 flex flex-col gap-4">
          <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5">
            <Pencil size={13} className="text-blue-500 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700">
              Vous pouvez changer le son tant qu'il reste plus de 24h avant la diffusion.
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Nouveau son</label>
            <select value={audioId} onChange={e => setAudioId(e.target.value ? Number(e.target.value) : '')}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
              <option value="">— Choisir un son —</option>
              {audios.map(a => (
                <option key={a.id} value={a.id}>{a.name ?? `Audio #${a.id}`}{a.duration ? ` (${Math.round(a.duration)}s)` : ''}</option>
              ))}
            </select>
          </div>
          {modifyError && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{modifyError}</div>}
        </div>
        <div className="px-5 py-4 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm text-slate-600 hover:bg-slate-50">Annuler</button>
          <button onClick={async () => { if (audioId) await onConfirm(Number(audioId)); }}
            disabled={!audioId || modifying || audioId === item.alerteAudioId}
            className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-2">
            {modifying ? <><Loader2 size={14} className="animate-spin" /> Modification…</> : <><CheckCircle size={14} /> Confirmer</>}
          </button>
        </div>
      </div>
    </div>
  );
}