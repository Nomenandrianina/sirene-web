import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { useRole } from '@/hooks/useRole';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { souscriptionApi, packTypeApi } from '@/services/diffusion.api';
import type { Souscription } from '@/types/diffusion';
import { usePlanningClient, JOURS_FR, fmtDate, fmtHeure, addDays, toISO, type ClientPlanningSlot,} from '@/types/useplanningclient';
import { ChevronLeft, ChevronRight, RotateCcw, Clock, Loader2, Radio, AlertTriangle, Wand2, CalendarRange, Sparkles, PackageCheck, RefreshCw, Plus, Lock, Pencil, X,} from 'lucide-react';
import { Toast } from '@/components/planning/Toast';
import { CreditBadge } from '@/components/planning/CreditBadge';
import { PlanningCell } from '@/components/planning/PlanningCell';
import { ModalConfirmCancel } from '@/components/planning/ModalConfirmCancel';
import { ModalAjout } from '@/components/planning/ModalAjout';
import { ModalModifier } from '@/components/planning/ModalModifier';
import { ModalAutoGenerate } from '@/components/planning/ModalAutoGenerate';
import { ModalChangerPack } from '@/components/planning/ModalChangerPack';
import { usePlanningMutations } from './hooks/usePlanningMutations';
import { STATUS_CFG } from './constants';
import { isToday } from './utils';

export default function PlanningClientPage() {
  const { customerId, userId } = useRole();
  const [searchParams] = useSearchParams();
  const qc = useQueryClient();

  const [confirmCancelItem, setConfirmCancelItem] = useState<ClientPlanningSlot['items'][0] | null>(null);
  const [sireneId, setSireneId] = useState<number | null>(null);
  const [showChangePack, setShowChangePack] = useState(false);
  const [souscriptionId, setSouscriptionId] = useState<number>(
    Number(searchParams.get('souscriptionId')) || 0
  );
  const [modalSlot, setModalSlot] = useState<{ slot: ClientPlanningSlot; date: string; heure: number } | null>(null);
  const [modalModify, setModalModify] = useState<ClientPlanningSlot['items'][0] | null>(null);
  const [showAutoGenerate, setShowAutoGenerate] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type?: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Souscriptions & packs ──────────────────────────────────────────────
  const { data: rawSubs } = useQuery({
    queryKey: ['souscriptions', 'client', customerId],
    queryFn: () => souscriptionApi.getAll({ customerId }),
    enabled: !!customerId,
  });
  const souscriptions: Souscription[] = Array.isArray(rawSubs) ? rawSubs : (rawSubs as any)?.data ?? [];
  const activeSubs = souscriptions.filter(s => s.status === 'active');
  const selectedSub = activeSubs.find(s => s.id === souscriptionId) ?? activeSubs[0];

  const { data: packs = [] } = useQuery({
    queryKey: ['pack-types', 'active'],
    queryFn: () => packTypeApi.getAll(true),
  });

  useEffect(() => {
    if (selectedSub?.sirenes?.length) {
      const stillValid = selectedSub.sirenes.some(s => s.id === sireneId);
      if (!stillValid) setSireneId(selectedSub.sirenes[0].id);
    } else {
      setSireneId(null);
    }
  }, [selectedSub?.id]);

  // ── Planning (toutes sirènes de la souscription) ───────────────────────
  const planning = usePlanningClient({
    customerId: customerId ?? 0,
    souscriptionId: selectedSub?.id ?? 0,
    sireneId: sireneId ?? 0,
    enabled: !!customerId && !!selectedSub && !!sireneId,
  });

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(planning.weekStart, i);
    return { date: toISO(d), label: JOURS_FR[i], display: fmtDate(toISO(d)) };
  });

  const noCredits = planning.creditsRestants !== null && planning.creditsRestants <= 0;

  // ── Mutations secondaires (modifier / auto-générer / changer de pack) ──
  const {
    modifyMutation, autoGenerateMutation, cancelUpgradeMutation, scheduleUpgradeMutation,
  } = usePlanningMutations({
    customerId,
    souscriptionId: selectedSub?.id,
    sireneId,
    audios: planning.audios,
    showToast,
    onModifySuccess: () => setModalModify(null),
    onAutoGenerateSuccess: () => setShowAutoGenerate(false),
    onUpgradeScheduled: () => setShowChangePack(false),
  });

  // ── Handlers liés au planning lui-même (add / cancel) ───────────────────
  const handleConfirmAdd = async (audioId: number) => {
    if (!modalSlot || !selectedSub || !sireneId) return;
    try {
      await planning.addDiffusion({
        souscriptionId: selectedSub.id,
        customerId: customerId!,
        alerteAudioId: audioId,
        date: modalSlot.date,
        heure: modalSlot.heure,
        sireneId,
      });
      setModalSlot(null);
      const audioName = planning.audios.find(a => a.id === audioId)?.name ?? `Audio #${audioId}`;
      showToast(`✅ "${audioName}" ajouté au créneau ${fmtHeure(modalSlot.heure, 0)} du ${fmtDate(modalSlot.date)}`);
    } catch {
      /* addError géré dans la modale */
    }
  };

  const handleCancel = async (id: number) => {
    if (!userId) return;
    try {
      await planning.cancelDiffusion(id, userId);
      setConfirmCancelItem(null);
      showToast('✅ Diffusion annulée — 1 crédit restitué');
    } catch {
      showToast("❌ Erreur lors de l'annulation", 'error');
    }
  };

  return (
    <AppLayout>
      <div className="bg-gradient-to-b from-slate-50 to-white min-h-full -m-6 p-6">
        <div className="flex flex-col gap-5">

          {/* ── Header card ─────────────────────────────────────────── */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-sm shadow-blue-200">
                  <CalendarRange size={20} className="text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-slate-900">Planning des diffusions</h1>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Gérez vos diffusions, sirène par sirène
                  </p>
                </div>
              </div>

              {selectedSub?.pendingPackType && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-indigo-50 border border-indigo-200 px-4 py-3">
                    <div className="flex items-center gap-2 text-xs text-indigo-700">
                      <Sparkles size={14} />
                      Passage au pack <strong className="capitalize">{selectedSub.pendingPackType.name}</strong> programmé
                      pour le {fmtDate(toISO(addDays(new Date(selectedSub.endDate), 1)))}
                    </div>
                    <button
                      onClick={() => cancelUpgradeMutation.mutate(selectedSub.id)}
                      className="text-xs font-medium text-indigo-500 hover:text-indigo-700 underline"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowChangePack(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold
                  bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <RefreshCw size={13} /> Changer de pack
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAutoGenerate(true)}
                  disabled={noCredits || !planning.audios.length || !sireneId}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold
                    bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed
                    transition-colors shadow-sm shadow-violet-200"
                >
                  <Wand2 size={13} /> Remplir automatiquement
                </button>
                <CreditBadge restants={planning.creditsRestants} total={planning.nombreCredits} />
              </div>
            </div>

            {(activeSubs.length > 1 || planning.packName) && (
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3 flex-wrap">
                {planning.packName && (
                  <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full
                    bg-blue-50 text-blue-700 border border-blue-100">
                    <PackageCheck size={12} /> Pack {planning.packName}
                  </span>
                )}
                {activeSubs.length > 1 && (
                  <select value={selectedSub?.id ?? ''}
                    onChange={e => setSouscriptionId(Number(e.target.value))}
                    className="text-xs px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-600
                      focus:outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer">
                    {activeSubs.map(s => (
                      <option key={s.id} value={s.id}>{s.packType?.name ?? `Pack #${s.packTypeId}`}</option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>

          {/* ── Sirènes card ─────────────────────────────────────────── */}
          {selectedSub?.sirenes && selectedSub.sirenes.length > 0 && (
            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <Radio size={14} className="text-slate-400" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Sirènes ({selectedSub.sirenes.length})
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {selectedSub.sirenes.map(s => {
                  const active = s.id === sireneId;
                  const empty = s.creditsRestants !== null && s.creditsRestants <= 0;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSireneId(s.id)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-medium transition-all
                        ${active
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-200 scale-[1.02]'
                          : empty
                            ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300 hover:shadow-sm'}`}
                    >
                      <Radio size={12} className={active ? 'text-blue-100' : ''} />
                      {s.name ?? `Sirène #${s.id}`}
                      {s.creditsRestants !== null && (
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full
                          ${active ? 'bg-white/20 text-white' : empty ? 'bg-red-100 text-red-500' : 'bg-slate-200/70 text-slate-500'}`}>
                          {s.creditsRestants}/{s.nombreCredits}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Alerte crédits épuisés ───────────────────────────────── */}
          {noCredits && (
            <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 shadow-sm">
              <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <AlertTriangle size={16} className="text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-800">Crédits épuisés pour cette sirène</p>
                <p className="text-xs text-amber-600 mt-0.5">Contactez votre administrateur pour renouveler votre offre.</p>
              </div>
            </div>
          )}

          {/* ── Grille planning card ─────────────────────────────────── */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">

            <div className="flex items-center justify-between gap-2 px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Clock size={14} className="text-slate-400" />
                {fmtDate(planning.from)} — {fmtDate(planning.to)}
              </div>
              <div className="flex items-center gap-2">
                {!planning.isCurrentWeek && (
                  <button onClick={planning.goToCurrentWeek}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg
                      border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition-colors">
                    <RotateCcw size={11} /> Aujourd'hui
                  </button>
                )}
                <button onClick={planning.prevWeek}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition-colors">
                  <ChevronLeft size={15} />
                </button>
                <button onClick={planning.nextWeek}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition-colors">
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              {planning.isLoading ? (
                <div className="flex items-center justify-center py-28 gap-2 text-slate-400">
                  <Loader2 size={22} className="animate-spin" /><span className="text-sm">Chargement…</span>
                </div>
              ) : !selectedSub ? (
                <div className="flex flex-col items-center justify-center py-28 gap-3 text-slate-300">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center">
                    <Radio size={28} strokeWidth={1.3} />
                  </div>
                  <p className="text-sm text-slate-400">Aucune souscription active</p>
                </div>
              ) : !sireneId ? (
                <div className="flex flex-col items-center justify-center py-28 gap-3 text-slate-300">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center">
                    <Radio size={28} strokeWidth={1.3} />
                  </div>
                  <p className="text-sm text-slate-400">Sélectionnez une sirène ci-dessus</p>
                </div>
              ) : (
                <table className="w-full border-collapse" style={{ minWidth: 760 }}>
                  <thead>
                    <tr className="bg-slate-50/70">
                      <th className="w-20 py-3 px-4 text-left">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Créneau</span>
                      </th>
                      {days.map(({ date, label, display }) => (
                        <th key={date} className="py-3 px-1.5 text-center min-w-[112px]">
                          <div className={`rounded-xl py-2 px-2 mx-1 transition-colors
                            ${isToday(date) ? 'bg-blue-600 shadow-sm shadow-blue-200' : 'bg-white border border-slate-100'}`}>
                            <div className={`text-[10px] font-bold uppercase tracking-wide ${isToday(date) ? 'text-blue-100' : 'text-slate-400'}`}>
                              {label}
                            </div>
                            <div className={`text-sm font-bold mt-0.5 ${isToday(date) ? 'text-white' : 'text-slate-700'}`}>
                              {display}
                            </div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {planning.creneaux.map((cr, i) => (
                      <tr key={`${cr.heure}-${cr.minute}`} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}>
                        <td className="py-2.5 px-4 align-top">{/* ... inchangé ... */}</td>
                        {days.map(({ date }) => {
                          const slot = planning.getSlot(date, cr.heure);
                          const dayStatus = planning.getDayStatus(date);
                          return (
                            <td key={date} className="py-2.5 px-1.5 align-top">
                              <PlanningCell
                                slot={slot}
                                noCredits={noCredits}
                                dayLocked={dayStatus !== 'ouvert'}
                                dayLockReason={dayStatus}
                                onClickAdd={() => { if (slot) setModalSlot({ slot, date, heure: cr.heure }); }}
                                onClickCancel={(item) => setConfirmCancelItem(item)}
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
          </div>

          {/* ── Légende card ─────────────────────────────────────────── */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm px-5 py-4">
            <div className="flex items-center gap-5 flex-wrap text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded border-2 border-dashed border-emerald-300 bg-emerald-50/50 flex items-center justify-center">
                  <Plus size={7} className="text-emerald-400" />
                </div> Créneau libre
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-slate-100 border-2 border-slate-200 flex items-center justify-center">
                  <Lock size={7} className="text-slate-300" />
                </div> Créneau plein
              </span>
              <span className="flex items-center gap-1.5"><Pencil size={10} className="text-blue-400" /> Modifier son (&gt;24h)</span>
              <span className="flex items-center gap-1.5"><X size={10} className="text-red-400" /> Annuler</span>
              <span className="w-px h-3 bg-slate-200" />
              {Object.entries(STATUS_CFG).map(([key, c]) => (
                <span key={key} className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${c.dot}`} />{c.label}
                </span>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── Modales ──────────────────────────────────────────────────── */}
      {confirmCancelItem && (
        <ModalConfirmCancel
          item={confirmCancelItem}
          onClose={() => setConfirmCancelItem(null)}
          onConfirm={() => handleCancel(confirmCancelItem.id)}
          cancelling={planning.cancelling === confirmCancelItem.id}
        />
      )}

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

      {showChangePack && selectedSub && (
        <ModalChangerPack
          packs={packs}
          currentPackId={selectedSub.packTypeId}
          pendingPackId={selectedSub.pendingPackTypeId ?? null}
          onClose={() => setShowChangePack(false)}
          onConfirm={(packTypeId) => scheduleUpgradeMutation.mutate({ id: selectedSub.id, packTypeId })}
          submitting={scheduleUpgradeMutation.isPending}
        />
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </AppLayout>
  );
}