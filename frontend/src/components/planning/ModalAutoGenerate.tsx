import { useState } from 'react';
import { X, Wand2, CreditCard, Shuffle, Loader2 } from 'lucide-react';
import { type AudioDisponible } from '@/types/useplanningclient';

interface ModalAutoGenerateProps {
  audios: AudioDisponible[];
  creditsRestants: number | null;
  onClose: () => void;
  onConfirm: (audioIds: number[]) => Promise<void>;
  generating: boolean;
  generateError: string | null;
}

export function ModalAutoGenerate({ audios, creditsRestants, onClose, onConfirm, generating, generateError,}: ModalAutoGenerateProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const toggle = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-violet-700 px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Wand2 size={15} /> Générer automatiquement
            </h3>
            <p className="text-xs text-violet-200 mt-0.5">
              Le système répartit aléatoirement les sons sélectionnés sur le mois restant
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10"><X size={16} className="text-violet-200" /></button>
        </div>
        <div className="px-5 py-4 flex flex-col gap-4">
          {creditsRestants !== null && (
            <div className="flex items-center gap-2 rounded-xl bg-violet-50 border border-violet-200 px-4 py-3">
              <CreditCard size={14} className="text-violet-500" />
              <p className="text-xs text-violet-700 font-medium">
                {creditsRestants} crédit{creditsRestants > 1 ? 's' : ''} disponible{creditsRestants > 1 ? 's' : ''}
                {' '}— 1 crédit par créneau généré
              </p>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">
              Sons à distribuer ({selectedIds.length} sélectionné{selectedIds.length > 1 ? 's' : ''})
            </label>
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
              {audios.map(a => (
                <label key={a.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors
                  ${selectedIds.includes(a.id)
                    ? 'border-violet-300 bg-violet-50'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>
                  <input type="checkbox" checked={selectedIds.includes(a.id)} onChange={() => toggle(a.id)}
                    className="accent-violet-600" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{a.name ?? `Audio #${a.id}`}</p>
                    {a.duration && <p className="text-xs text-slate-400">{Math.round(a.duration)}s</p>}
                  </div>
                  <Shuffle size={11} className="text-slate-300 shrink-0" />
                </label>
              ))}
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-xs text-slate-500">
            <p>🎲 Les sons sélectionnés seront distribués <strong>aléatoirement</strong> sur chaque créneau disponible du mois restant, pour toutes vos sirènes.</p>
          </div>
          {generateError && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{generateError}</div>}
        </div>
        <div className="px-5 py-4 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm text-slate-600 hover:bg-slate-50">Annuler</button>
          <button onClick={async () => { if (selectedIds.length) await onConfirm(selectedIds); }}
            disabled={!selectedIds.length || generating}
            className="flex-1 rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-2">
            {generating ? <><Loader2 size={14} className="animate-spin" /> Génération…</> : <><Wand2 size={14} /> Générer</>}
          </button>
        </div>
      </div>
    </div>
  );
}