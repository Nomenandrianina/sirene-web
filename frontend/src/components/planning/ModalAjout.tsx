import { useState } from 'react';
import { X, CreditCard, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { fmtDate, fmtHeure, type ClientPlanningSlot, type AudioDisponible } from '@/types/useplanningclient';

interface ModalAjoutProps {
  slot: ClientPlanningSlot;
  audios: AudioDisponible[];
  creditsRestants: number | null;
  onClose: () => void;
  onConfirm: (audioId: number) => Promise<void>;
  adding: boolean;
  addError: string | null;
}

export function ModalAjout({
  slot, audios, creditsRestants, onClose, onConfirm, adding, addError,
}: ModalAjoutProps) {
  const [audioId, setAudioId] = useState<number | ''>('');
  const selectedAudio = audios.find(a => a.id === Number(audioId));
  const dureeRestante = slot.dureeMaxSecondes - slot.dureeCumuleeSecondes;
  const audioFit = selectedAudio?.duration ? selectedAudio.duration <= dureeRestante : true;
  const noCredits = creditsRestants !== null && creditsRestants <= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-slate-900 px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Ajouter une diffusion</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {fmtDate(slot.date)} · {fmtHeure(slot.heure, slot.minute)} — toutes les sirènes
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X size={16} className="text-slate-400" />
          </button>
        </div>
        <div className="px-5 py-4 flex flex-col gap-4">
          {creditsRestants !== null && (
            <div className={`flex items-center gap-3 rounded-xl px-4 py-3 border ${noCredits ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
              <CreditCard size={16} className={noCredits ? 'text-red-500' : 'text-emerald-500'} />
              <div>
                <p className={`text-xs font-semibold ${noCredits ? 'text-red-700' : 'text-emerald-700'}`}>
                  {noCredits ? "Crédits épuisés" : `${creditsRestants} crédit${creditsRestants > 1 ? 's' : ''} disponible${creditsRestants > 1 ? 's' : ''}`}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">1 crédit pour toutes vos sirènes</p>
              </div>
            </div>
          )}
          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-xs font-medium text-slate-500">Espace créneau</span>
              <span className="text-xs text-slate-400">
                {Math.floor(slot.dureeCumuleeSecondes / 60)}min {slot.dureeCumuleeSecondes % 60}s / {Math.floor(slot.dureeMaxSecondes / 60)}min
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full bg-blue-400 transition-all"
                style={{ width: `${Math.min(100, (slot.dureeCumuleeSecondes / slot.dureeMaxSecondes) * 100)}%` }} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Son à diffuser</label>
            {audios.length === 0 ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-700">
                Aucun audio approuvé disponible.
              </div>
            ) : (
              <select value={audioId} onChange={e => setAudioId(e.target.value ? Number(e.target.value) : '')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
                <option value="">— Choisir un son —</option>
                {audios.map(a => (
                  <option key={a.id} value={a.id}>{a.name ?? `Audio #${a.id}`}{a.duration ? ` (${Math.round(a.duration)}s)` : ''}</option>
                ))}
              </select>
            )}
          </div>
          {selectedAudio && !audioFit && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
              <AlertTriangle size={13} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-xs text-red-700">Cet audio dépasse l'espace restant ({Math.floor(dureeRestante / 60)}min {dureeRestante % 60}s).</p>
            </div>
          )}
          {addError && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{addError}</div>}
        </div>
        <div className="px-5 py-4 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors">Annuler</button>
          <button onClick={async () => { if (audioId) await onConfirm(Number(audioId)); }}
            disabled={!audioId || adding || noCredits || (selectedAudio ? !audioFit : false) || audios.length === 0}
            className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
            {adding ? <><Loader2 size={14} className="animate-spin" /> Enregistrement…</> : <><CheckCircle size={14} /> Valider — −1 crédit</>}
          </button>
        </div>
      </div>
    </div>
  );
}