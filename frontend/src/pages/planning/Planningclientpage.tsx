import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { useRole } from '@/hooks/useRole';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { souscriptionApi } from '@/services/diffusion.api';
import { diffusionPlanifieeApi } from '@/services/diffusionplanniee.api';
import type { Souscription } from '@/types/diffusion';
import { usePlanningClient, JOURS_FR, fmtDate, fmtHeure, addDays, toISO, type ClientPlanningSlot, type AudioDisponible, } from '@/types/useplanningclient';
import {
  ChevronLeft, ChevronRight, RotateCcw, Clock, CheckCircle,
  Loader2, X, Plus, Radio, AlertTriangle, Lock, CreditCard,
  Pencil, Wand2, Shuffle,
} from 'lucide-react';

const STATUS_CFG = {
  planned:   { label: 'Planifié', color: 'text-blue-600',  bg: 'bg-blue-50',  border: 'border-blue-200',  dot: 'bg-blue-400'  },
  sent:      { label: 'Envoyé',   color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', dot: 'bg-green-400' },
  cancelled: { label: 'Annulé',   color: 'text-red-500',   bg: 'bg-red-50',   border: 'border-red-200',   dot: 'bg-red-400'   },
  skipped:   { label: 'Ignoré',   color: 'text-slate-400', bg: 'bg-slate-50', border: 'border-slate-200', dot: 'bg-slate-300' },
} as const;

function isToday(iso: string) { return iso === toISO(new Date()); }

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, type = 'success', onClose }: {
  message: string; type?: 'success' | 'error'; onClose: () => void;
}) {
  return (
    <div className={`fixed bottom-6 right-6 z-[60] flex items-center gap-3
      px-4 py-3 rounded-xl shadow-lg animate-in slide-in-from-bottom-4 duration-300
      ${type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
      <CheckCircle size={16} className="shrink-0" />
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 p-0.5 hover:bg-white/20 rounded transition-colors">
        <X size={13} />
      </button>
    </div>
  );
}

// ── Badge crédit ──────────────────────────────────────────────────────────────
function CreditBadge({ restants, total }: { restants: number | null; total: number | null }) {
  if (restants === null) return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-50 border border-violet-200">
      <CreditCard size={12} className="text-violet-500" />
      <span className="text-xs font-semibold text-violet-700">Illimité</span>
    </div>
  );
  const pct = total ? Math.round((restants / total) * 100) : 0;
  const isLow = pct <= 20;
  const isEmpty = restants === 0;
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border
      ${isEmpty ? 'bg-red-50 border-red-200' : isLow ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
      <CreditCard size={12} className={isEmpty ? 'text-red-500' : isLow ? 'text-amber-500' : 'text-emerald-500'} />
      <span className={`text-xs font-semibold ${isEmpty ? 'text-red-700' : isLow ? 'text-amber-700' : 'text-emerald-700'}`}>
        {restants} crédit{restants > 1 ? 's' : ''}{total ? ` / ${total}` : ''}
      </span>
    </div>
  );
}

// ── Cellule planning ──────────────────────────────────────────────────────────
function PlanningCell({
  slot, noCredits, onClickAdd, onClickCancel, onClickModify, cancelling,
}: {
  slot:           ClientPlanningSlot | null;
  noCredits:      boolean;
  onClickAdd:     () => void;
  onClickCancel:  (id: number) => void;
  onClickModify:  (item: ClientPlanningSlot['items'][0]) => void;
  cancelling:     number | null;
}) {
  if (!slot) return <div className="min-h-[72px] rounded-xl border-2 border-dashed border-slate-100 bg-slate-50/30" />;

  const { estPasse, estPlein, items } = slot;
  const hasItems = items.length > 0;

  if (estPasse && !hasItems) return (
    <div className="min-h-[72px] rounded-xl border-2 border-dashed border-slate-100 bg-slate-50/20 flex items-center justify-center">
      <span className="text-[10px] text-slate-200">—</span>
    </div>
  );

  if (noCredits && !hasItems && !estPasse) return (
    <div onClick={onClickAdd} className="min-h-[72px] rounded-xl border-2 border-amber-200 bg-amber-50 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-amber-100 transition-colors">
      <AlertTriangle size={14} className="text-amber-400" />
      <span className="text-[10px] text-amber-600 font-medium">Crédits épuisés</span>
    </div>
  );

  if (estPlein && !hasItems) return (
    <div className="min-h-[72px] rounded-xl border-2 border-slate-200 bg-slate-100 flex flex-col items-center justify-center gap-1 cursor-not-allowed">
      <Lock size={13} className="text-slate-300" />
      <span className="text-[10px] text-slate-400">Créneau plein</span>
    </div>
  );

  if (!hasItems) return (
    <div onClick={onClickAdd} className="min-h-[72px] rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-emerald-100 hover:border-emerald-400 transition-all group">
      <Plus size={16} className="text-emerald-400 group-hover:text-emerald-600 transition-colors" />
      <span className="text-[10px] text-emerald-500 group-hover:text-emerald-700 font-medium">Ajouter</span>
    </div>
  );

  return (
    <div className="min-h-[72px] rounded-xl border-2 border-transparent bg-white p-1.5 flex flex-col gap-1.5">
      {items.map(item => {
        const cfg = STATUS_CFG[item.status];
        // Vérifier si modification possible (>24h avant)
        const scheduledAt = new Date(
          `${slot.date}T${String(item.scheduledHeure).padStart(2,'0')}:${String(item.scheduledMinute).padStart(2,'0')}:00`
        );
        const canModify = item.status === 'planned' &&
          (scheduledAt.getTime() - Date.now()) > 24 * 3_600_000;

        return (
          <div key={item.id} className={`rounded-lg px-2 py-1.5 border flex flex-col gap-0.5 group ${cfg.bg} ${cfg.border}`}>
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                <span className={`text-[10px] font-bold tabular-nums ${cfg.color}`}>
                  {fmtHeure(item.scheduledHeure, item.scheduledMinute)}
                </span>
                <span className={`text-[10px] ${cfg.color} opacity-60`}>{cfg.label}</span>
              </div>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                {/* Bouton modifier audio */}
                {canModify && (
                  <button
                    onClick={e => { e.stopPropagation(); onClickModify(item); }}
                    className="p-0.5 rounded text-slate-300 hover:text-blue-500 transition-colors"
                    title="Changer le son (disponible > 24h avant)"
                  >
                    <Pencil size={9} />
                  </button>
                )}
                {/* Bouton annuler */}
                {item.canCancel && (
                  <button
                    onClick={e => { e.stopPropagation(); onClickCancel(item.id); }}
                    disabled={cancelling === item.id}
                    className="p-0.5 rounded text-slate-300 hover:text-red-500 transition-colors"
                    title="Annuler cette diffusion"
                  >
                    {cancelling === item.id ? <Loader2 size={9} className="animate-spin" /> : <X size={9} />}
                  </button>
                )}
              </div>
            </div>
            {item.audioName && (
              <div className="flex items-center gap-1 pl-3">
                <span className="text-[9px] text-slate-400 truncate max-w-[90px]" title={item.audioName}>
                  🔊 {item.audioName}
                </span>
              </div>
            )}
          </div>
        );
      })}

      {!estPlein && !estPasse && !noCredits && (
        <button onClick={onClickAdd}
          className="w-full rounded-lg border border-dashed border-emerald-200 py-1 text-[10px] text-emerald-400 hover:text-emerald-600 hover:border-emerald-400 hover:bg-emerald-50 transition-all flex items-center justify-center gap-1">
          <Plus size={9} /> Ajouter un autre son
        </button>
      )}
    </div>
  );
}

// ── Modale ajout ──────────────────────────────────────────────────────────────
function ModalAjout({
  slot, audios, creditsRestants, onClose, onConfirm, adding, addError,
}: {
  slot: ClientPlanningSlot; audios: AudioDisponible[]; creditsRestants: number | null;
  onClose: () => void; onConfirm: (audioId: number) => Promise<void>;
  adding: boolean; addError: string | null;
}) {
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
                {Math.floor(slot.dureeCumuleeSecondes/60)}min {slot.dureeCumuleeSecondes%60}s / {Math.floor(slot.dureeMaxSecondes/60)}min
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full bg-blue-400 transition-all"
                style={{ width: `${Math.min(100, (slot.dureeCumuleeSecondes/slot.dureeMaxSecondes)*100)}%` }} />
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
              <p className="text-xs text-red-700">Cet audio dépasse l'espace restant ({Math.floor(dureeRestante/60)}min {dureeRestante%60}s).</p>
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

// ── Modale modifier audio ─────────────────────────────────────────────────────
function ModalModifier({
  item, audios, onClose, onConfirm, modifying, modifyError,
}: {
  item: ClientPlanningSlot['items'][0]; audios: AudioDisponible[];
  onClose: () => void; onConfirm: (audioId: number) => Promise<void>;
  modifying: boolean; modifyError: string | null;
}) {
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

// ── Modale génération automatique ─────────────────────────────────────────────
function ModalAutoGenerate({
  audios, creditsRestants, onClose, onConfirm, generating, generateError,
}: {
  audios: AudioDisponible[]; creditsRestants: number | null;
  onClose: () => void; onConfirm: (audioIds: number[]) => Promise<void>;
  generating: boolean; generateError: string | null;
}) {
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

// ── Page principale ───────────────────────────────────────────────────────────
export default function PlanningClientPage() {
  const { customerId, userId } = useRole();
  const [searchParams] = useSearchParams();
  const qc = useQueryClient();

  const [souscriptionId, setSouscriptionId] = useState<number>(
    Number(searchParams.get('souscriptionId')) || 0
  );

  const [modalSlot, setModalSlot]         = useState<{ slot: ClientPlanningSlot; date: string; heure: number } | null>(null);
  const [modalModify, setModalModify]     = useState<ClientPlanningSlot['items'][0] | null>(null);
  const [showAutoGenerate, setShowAutoGenerate] = useState(false);
  const [toast, setToast]                 = useState<{ msg: string; type?: 'success'|'error' } | null>(null);

  const showToast = (msg: string, type: 'success'|'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const { data: rawSubs } = useQuery({
    queryKey: ['souscriptions', 'client', customerId],
    queryFn:  () => souscriptionApi.getAll(customerId!),
    enabled:  !!customerId,
  });
  const souscriptions: Souscription[] = Array.isArray(rawSubs) ? rawSubs : (rawSubs as any)?.data ?? [];
  const activeSubs = souscriptions.filter(s => s.status === 'active');
  const selectedSub = activeSubs.find(s => s.id === souscriptionId) ?? activeSubs[0];

  // ── Plus de sélecteur de sirène — propagation auto ────────────────────────
  // On charge le planning sur toutes les sirènes via souscriptionId uniquement
  // Le hook retourne les slots groupés par date/heure (toutes sirènes confondues)
  const planning = usePlanningClient({
    customerId:     customerId ?? 0,
    souscriptionId: selectedSub?.id ?? 0,
    sireneId:       0, // 0 = toutes les sirènes
    enabled:        !!customerId && !!selectedSub,
  });

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(planning.weekStart, i);
    return { date: toISO(d), label: JOURS_FR[i], display: fmtDate(toISO(d)) };
  });

  const noCredits = planning.creditsRestants !== null && planning.creditsRestants <= 0;

  // ── Mutation : modifier un audio ─────────────────────────────────────────
  const modifyMutation = useMutation({
    mutationFn: ({ diffusionId, alerteAudioId }: { diffusionId: number; alerteAudioId: number }) =>
      diffusionPlanifieeApi.clientModify({ diffusionId, alerteAudioId, customerId: customerId! }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client-planning'] });
      setModalModify(null);
      showToast('Son modifié avec succès');
    },
  });

  // ── Mutation : génération automatique ────────────────────────────────────
  const autoGenerateMutation = useMutation({
    mutationFn: (audioIds: number[]) =>
      diffusionPlanifieeApi.clientAutoGenerate({
        souscriptionId: selectedSub!.id,
        customerId:     customerId!,
        audioIds,
      }),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['client-planning'] });
      qc.invalidateQueries({ queryKey: ['souscriptions'] });
      setShowAutoGenerate(false);
      showToast(`✅ ${result.generated} diffusion${result.generated > 1 ? 's' : ''} générée${result.generated > 1 ? 's' : ''} automatiquement`);
    },
  });

  const handleConfirmAdd = async (audioId: number) => {
    if (!modalSlot || !selectedSub) return;
    try {
      await planning.addDiffusion({
        souscriptionId: selectedSub.id,
        customerId:     customerId!,
        alerteAudioId:  audioId,
        date:           modalSlot.date,
        heure:          modalSlot.heure,
      });
      setModalSlot(null);
      const audioName = planning.audios.find(a => a.id === audioId)?.name ?? `Audio #${audioId}`;
      showToast(`✅ "${audioName}" ajouté au créneau ${fmtHeure(modalSlot.heure, 0)} du ${fmtDate(modalSlot.date)} — toutes sirènes`);
    } catch { /* addError géré dans la modale */ }
  };

  const handleCancel = async (id: number) => {
    if (!userId) return;
    await planning.cancelDiffusion(id, userId);
    showToast('Diffusion annulée — 1 crédit restitué');
  };

  return (
    <AppLayout>
      <div className="page-wrap">
        <div className="page-header">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Planning des diffusions</h1>
            <p className="page-subtitle">Gérez vos diffusions — propagation automatique sur toutes vos sirènes</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Bouton génération automatique */}
            <button
              onClick={() => setShowAutoGenerate(true)}
              disabled={noCredits || !planning.audios.length}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40 transition-colors"
            >
              <Wand2 size={12} /> Générer automatiquement
            </button>
            <CreditBadge restants={planning.creditsRestants} total={planning.nombreCredits} />
          </div>
        </div>

        {/* Sélecteur souscription si plusieurs */}
        {activeSubs.length > 1 && (
          <div className="mt-4">
            <select value={selectedSub?.id ?? ''}
              onChange={e => setSouscriptionId(Number(e.target.value))}
              className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200">
              {activeSubs.map(s => (
                <option key={s.id} value={s.id}>{s.packType?.name ?? `Pack #${s.packTypeId}`}</option>
              ))}
            </select>
          </div>
        )}

        {/* Info sirènes */}
        {selectedSub?.sirenes && selectedSub.sirenes.length > 0 && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400">Sirènes couvertes :</span>
            {selectedSub.sirenes.map(s => (
              <span key={s.id} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-xs text-slate-600 border border-slate-200">
                <Radio size={9} /> {s.name ?? `Sirène #${s.id}`}
              </span>
            ))}
          </div>
        )}

        {noCredits && (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <AlertTriangle size={16} className="text-amber-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Crédits épuisés</p>
              <p className="text-xs text-amber-600 mt-0.5">Contactez votre administrateur pour renouveler votre offre.</p>
            </div>
          </div>
        )}

        {/* Navigation semaine */}
        <div className="mt-4 flex items-center justify-end gap-2">
          {!planning.isCurrentWeek && (
            <button onClick={planning.goToCurrentWeek}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
              <RotateCcw size={11} /> Aujourd'hui
            </button>
          )}
          <button onClick={planning.prevWeek} className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-medium text-slate-700 min-w-[160px] text-center">
            {fmtDate(planning.from)} — {fmtDate(planning.to)}
          </span>
          <button onClick={planning.nextWeek} className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Grille */}
        <div className="mt-5 overflow-x-auto">
          {planning.isLoading ? (
            <div className="flex items-center justify-center py-24 gap-2 text-slate-400">
              <Loader2 size={22} className="animate-spin" /><span className="text-sm">Chargement…</span>
            </div>
          ) : !selectedSub ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
              <Radio size={36} strokeWidth={1.2} /><p className="text-sm">Aucune souscription active</p>
            </div>
          ) : (
            <table className="w-full border-collapse" style={{ minWidth: 700 }}>
              <thead>
                <tr>
                  <th className="w-16 pb-3 text-left">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Créneau</span>
                  </th>
                  {days.map(({ date, label, display }) => (
                    <th key={date} className="pb-3 px-1.5 text-center min-w-[110px]">
                      <div className={`rounded-xl py-2 px-2 ${isToday(date) ? 'bg-blue-600' : 'bg-slate-50'}`}>
                        <div className={`text-[10px] font-semibold uppercase tracking-wide ${isToday(date) ? 'text-blue-100' : 'text-slate-500'}`}>{label}</div>
                        <div className={`text-sm font-bold mt-0.5 ${isToday(date) ? 'text-white' : 'text-slate-700'}`}>{display}</div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {planning.creneaux.map(cr => (
                  <tr key={`${cr.heure}-${cr.minute}`}>
                    <td className="py-2 pr-2 align-top">
                      <div className="flex items-center gap-1 pt-1">
                        <Clock size={11} className="text-slate-400 shrink-0" />
                        <span className="text-xs font-semibold text-slate-500">{fmtHeure(cr.heure, cr.minute)}</span>
                      </div>
                    </td>
                    {days.map(({ date }) => {
                      const slot = planning.getSlot(date, cr.heure);
                      return (
                        <td key={date} className="py-2 px-1.5 align-top">
                          <PlanningCell
                            slot={slot}
                            noCredits={noCredits}
                            onClickAdd={() => { if (slot) setModalSlot({ slot, date, heure: cr.heure }); }}
                            onClickCancel={handleCancel}
                            onClickModify={setModalModify}
                            cancelling={planning.cancelling}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Légende */}
        <div className="mt-4 flex items-center gap-5 flex-wrap text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><div className="w-4 h-4 rounded border-2 border-dashed border-emerald-300 bg-emerald-50/50 flex items-center justify-center"><Plus size={7} className="text-emerald-400" /></div> Créneau libre</span>
          <span className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-slate-100 border-2 border-slate-200 flex items-center justify-center"><Lock size={7} className="text-slate-300" /></div> Créneau plein</span>
          <span className="flex items-center gap-1.5"><Pencil size={10} className="text-blue-400" /> Modifier son (survol, &gt;24h)</span>
          <span className="flex items-center gap-1.5"><X size={10} className="text-red-400" /> Annuler (survol)</span>
          {Object.entries(STATUS_CFG).map(([key, c]) => (
            <span key={key} className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${c.dot}`} />{c.label}</span>
          ))}
        </div>
      </div>

      {/* Modales */}
      {modalSlot && (
        <ModalAjout
          slot={modalSlot.slot} audios={planning.audios} creditsRestants={planning.creditsRestants}
          onClose={() => setModalSlot(null)} onConfirm={handleConfirmAdd}
          adding={planning.adding}
          addError={planning.addError?.response?.data?.message ?? planning.addError?.message ?? null}
        />
      )}
      {modalModify && (
        <ModalModifier
          item={modalModify} audios={planning.audios}
          onClose={() => setModalModify(null)}
          onConfirm={async (audioId) => {
            await modifyMutation.mutateAsync({ diffusionId: modalModify.id, alerteAudioId: audioId });
          }}
          modifying={modifyMutation.isPending}
          modifyError={modifyMutation.error ? (modifyMutation.error as any)?.response?.data?.message ?? 'Erreur' : null}
        />
      )}
      {showAutoGenerate && (
        <ModalAutoGenerate
          audios={planning.audios} creditsRestants={planning.creditsRestants}
          onClose={() => setShowAutoGenerate(false)}
          onConfirm={async (audioIds) => { await autoGenerateMutation.mutateAsync(audioIds); }}
          generating={autoGenerateMutation.isPending}
          generateError={autoGenerateMutation.error ? (autoGenerateMutation.error as any)?.response?.data?.message ?? 'Erreur' : null}
        />
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </AppLayout>
  );
}