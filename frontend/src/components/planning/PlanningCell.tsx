import { Plus, Radio, AlertTriangle, Lock, Pencil, X, Loader2 } from 'lucide-react';
import { fmtHeure, type ClientPlanningSlot } from '@/types/useplanningclient';
import { STATUS_CFG } from '@/pages/planning/constants';

interface PlanningCellProps {
  slot: ClientPlanningSlot | null;
  noCredits: boolean;
  dayLocked: boolean;
  dayLockReason: 'jour_complet' | 'quota_semaine_atteint' | 'ouvert';
  onClickAdd: () => void;
  onClickCancel: (item: ClientPlanningSlot['items'][0]) => void;
  onClickModify: (item: ClientPlanningSlot['items'][0]) => void;
  cancelling: number | null;
}

export function PlanningCell({
  slot, noCredits, dayLocked, dayLockReason,
  onClickAdd, onClickCancel, onClickModify, cancelling,
}: PlanningCellProps) {
  if (!slot) {
    return <div className="min-h-[72px] rounded-xl border-2 border-dashed border-slate-100 bg-slate-50/30" />;
  }

  const { estPasse, estPlein, items } = slot;
  const hasItems = items.length > 0;

  if (estPasse && !hasItems) {
    return (
      <div className="min-h-[72px] rounded-xl border-2 border-dashed border-slate-100 bg-slate-50/20 flex items-center justify-center">
        <span className="text-[10px] text-slate-200">—</span>
      </div>
    );
  }

  if (dayLocked && !hasItems && !estPasse) {
    const label = dayLockReason === 'jour_complet'
      ? 'Jour complet (quota du pack)'
      : 'Quota de la semaine atteint';
    return (
      <div className="min-h-[72px] rounded-xl border-2 border-slate-200 bg-slate-100 flex flex-col items-center justify-center gap-1 cursor-not-allowed">
        <Lock size={13} className="text-slate-300" />
        <span className="text-[10px] text-slate-400 font-medium text-center px-1">{label}</span>
      </div>
    );
  }

  if (noCredits && !hasItems && !estPasse) {
    return (
      <div onClick={onClickAdd} className="min-h-[72px] rounded-xl border-2 border-amber-200 bg-amber-50 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-amber-100 transition-colors">
        <AlertTriangle size={14} className="text-amber-400" />
        <span className="text-[10px] text-amber-600 font-medium">Crédits épuisés</span>
      </div>
    );
  }

  if (estPlein && !hasItems) {
    return (
      <div className="min-h-[72px] rounded-xl border-2 border-slate-200 bg-slate-100 flex flex-col items-center justify-center gap-1 cursor-not-allowed">
        <Lock size={13} className="text-slate-300" />
        <span className="text-[10px] text-slate-400">Créneau plein</span>
      </div>
    );
  }

  if (!hasItems) {
    return (
      <div onClick={onClickAdd} className="min-h-[72px] rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-emerald-100 hover:border-emerald-400 transition-all group">
        <Plus size={16} className="text-emerald-400 group-hover:text-emerald-600 transition-colors" />
        <span className="text-[10px] text-emerald-500 group-hover:text-emerald-700 font-medium">Ajouter</span>
      </div>
    );
  }

  return (
    <div className="min-h-[72px] rounded-xl border-2 border-transparent bg-white p-1.5 flex flex-col gap-1.5">
      {items.map(item => {
        const cfg = STATUS_CFG[item.status];
        const scheduledAt = new Date(
          `${slot.date}T${String(item.scheduledHeure).padStart(2, '0')}:${String(item.scheduledMinute).padStart(2, '0')}:00`
        );
        const canModify = item.status === 'planned' &&
          (scheduledAt.getTime() - Date.now()) >= 24 * 3_600_000;

        return (
          <div key={item.id} className={`rounded-lg px-2 py-2 border flex flex-col gap-1 ${cfg.bg} ${cfg.border}`}>
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                <span className={`text-[10px] font-bold tabular-nums ${cfg.color}`}>
                  {fmtHeure(item.scheduledHeure, item.scheduledMinute)}
                </span>
                <span className={`text-[10px] ${cfg.color} opacity-60`}>{cfg.label}</span>
              </div>

              <div className="flex items-center gap-1">
                {canModify && (
                  <button
                    onClick={e => { e.stopPropagation(); onClickModify(item); }}
                    className="p-1 rounded-md bg-blue-100 hover:bg-blue-200 transition-colors"
                    title="Modifier le son"
                  >
                    <Pencil size={11} className="text-blue-600" />
                  </button>
                )}
                {item.canCancel && (
                  <button
                    onClick={e => { e.stopPropagation(); onClickCancel(item); }}
                    disabled={cancelling === item.id}
                    className="p-1 rounded-md bg-red-100 hover:bg-red-200 transition-colors"
                    title="Annuler cette diffusion"
                  >
                    {cancelling === item.id
                      ? <Loader2 size={11} className="animate-spin text-red-500" />
                      : <X size={11} className="text-red-500" />}
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

            {item.sireneName && (
              <div className="flex items-center gap-1 pl-3">
                <Radio size={8} className="text-slate-400 shrink-0" />
                <span className="text-[9px] text-slate-400 truncate" title={item.sireneName}>
                  {item.sireneName}
                </span>
              </div>
            )}
          </div>
        );
      })}

      {!estPlein && !estPasse && !noCredits && !dayLocked && (
        <button onClick={onClickAdd}
          className="w-full rounded-lg border border-dashed border-emerald-200 py-1 text-[10px] text-emerald-400 hover:text-emerald-600 hover:border-emerald-400 hover:bg-emerald-50 transition-all flex items-center justify-center gap-1">
          <Plus size={9} /> Ajouter un autre son
        </button>
      )}
    </div>
  );
}