import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { useRole } from '@/hooks/useRole';
import { usePlanning, JOURS_FR, CRENEAUX, addDays, toISO, type PlanningItem, type DPStatus, } from '@/services/useplanning.api';
import { ChevronLeft, ChevronRight, RotateCcw, X, Clock,CheckCircle, XCircle, AlertCircle, Loader2, Send,  SkipForward, Bell, ExternalLink, Radio, User, Tag, } from 'lucide-react';
import { customersApi } from '@/services';
import { useQuery } from '@tanstack/react-query';
import { sirenesApi } from '@/services/sirene.api';

// ── Config statuts ────────────────────────────────────────────────────────────
const STATUS_CFG: Record<DPStatus, {
  label: string; color: string; bg: string; border: string; dot: string; Icon: any;
}> = {
  planned:   { label: 'Planifié', color: 'text-blue-600',  bg: 'bg-blue-50',  border: 'border-blue-200',  dot: 'bg-blue-400',  Icon: Clock       },
  sent:      { label: 'Envoyé',   color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', dot: 'bg-green-400', Icon: CheckCircle },
  cancelled: { label: 'Annulé',   color: 'text-red-500',   bg: 'bg-red-50',   border: 'border-red-200',   dot: 'bg-red-400',   Icon: XCircle     },
  skipped:   { label: 'Ignoré',   color: 'text-slate-400', bg: 'bg-slate-50', border: 'border-slate-200', dot: 'bg-slate-300', Icon: SkipForward },
};

const MOIS_FR = ['jan','fév','mar','avr','mai','juin','juil','août','sep','oct','nov','déc'];
const CRENEAU_LABELS: Record<number, string> = { 7: '7h00', 12: '12h00', 16: '16h00' };

function fmtDate(iso: string) {
  const d = new Date(iso + 'T12:00:00');
  return `${d.getDate()} ${MOIS_FR[d.getMonth()]}`;
}
function isToday(iso: string) { return iso === toISO(new Date()); }

// ── Chip statut ───────────────────────────────────────────────────────────────
function StatusChip({ status }: { status: DPStatus }) {
  const c = STATUS_CFG[status];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${c.bg} ${c.color} border ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />
      {c.label}
    </span>
  );
}

// ── Groupe : un item = une souscatégorie + un client ─────────────────────────
// Dans une cellule on groupe les items qui partagent la même souscatégorie
// (d'après la réponse : souscatégorie unique par cellule, sirènes différentes)

interface CellGroup {
  sousCategorieId:  number | null;
  sousCategorieNom: string | null;
  customerId:       number | null;
  customerName:     string | null;
  items:            PlanningItem[];   // une ou plusieurs sirènes
}

function groupBySousCat(items: PlanningItem[]): CellGroup[] {
  const map = new Map<string, CellGroup>();
  for (const item of items) {
    // clé = souscatégorie + client (pour gérer le cas où 2 clients auraient la même souscat)
    const key = `${item.sousCategorieId ?? 'null'}-${item.customerId ?? 'null'}`;
    if (!map.has(key)) {
      map.set(key, {
        sousCategorieId:  item.sousCategorieId,
        sousCategorieNom: item.sousCategorieNom,
        customerId:       item.customerId,
        customerName:     item.customerName,
        items:            [],
      });
    }
    map.get(key)!.items.push(item);
  }
  return Array.from(map.values());
}

// ── Card par groupe (souscatégorie + client) ──────────────────────────────────
function PlanningCard({
  group,
  onSelect,
  onCancel,
  cancelling,
  isSuperAdmin,
}: {
  group:       CellGroup;
  onSelect:    (i: PlanningItem) => void;
  onCancel:    (id: number) => void;
  cancelling:  number | null;
  isSuperAdmin?: boolean;
}) {
  // Statut dominant : si au moins un item est planned → planned ; sinon le plus fréquent
  const dominant = (group.items.find(i => i.status === 'planned')
    ?? group.items.find(i => i.status === 'sent')
    ?? group.items[0]).status;

    console.log('group :',group)

  const c = STATUS_CFG[dominant];

  // Le clic sur la card ouvre le drawer du premier item
  // (ou on peut ouvrir un drawer de groupe — voir drawer ci-dessous)
  const firstItem = group.items[0];

  const canCancelAny = group.items.some(i => i.canCancel);

  return (
    <div
      onClick={() => onSelect(firstItem)}
      className={`rounded-lg border px-2.5 py-2 cursor-pointer hover:shadow-sm transition-all group
        ${c.bg} ${c.border}`}
    >
      {/* Ligne 1 : souscatégorie + statut */}
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0 flex-1">

          {/* Souscatégorie */}
          <div className={`text-xs font-semibold truncate flex items-center gap-1 ${c.color}`}>
            <Tag size={10} className="shrink-0" />
            {group.sousCategorieNom ?? 'Sans catégorie'}
          </div>

          {/* Client (superadmin ou toujours visible selon besoin) */}
          {group.customerName && (
            <div className="flex items-center gap-1 mt-0.5">
              <User size={9} className="text-slate-400 shrink-0" />
              <span className="text-[10px] text-slate-500 truncate">{group.customerName}</span>
            </div>
          )}

          {/* Sirènes associées */}
          <div className="mt-1.5 flex flex-col gap-0.5">
            {group.items.map(item => (
              <SireneRow
                key={item.id}
                item={item}
                onCancel={onCancel}
                cancelling={cancelling}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Statut global */}
      <div className="mt-1.5 flex items-center justify-between">
        <StatusChip status={dominant} />
        {/* Lien notifs si au moins un item envoyé */}
        {group.items.some(i => i.notificationId) && (
          <a
            href={`/notifications?souscriptionId=${firstItem.souscriptionId}`}
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-700"
            title="Voir les notifications"
          >
            <Bell size={10} />
            {group.items.filter(i => i.notificationId).length}
          </a>
        )}
      </div>
    </div>
  );
}

// ── Ligne sirène à l'intérieur d'une card ────────────────────────────────────
function SireneRow({
  item,
  onCancel,
  cancelling,
}: {
  item:       PlanningItem;
  onCancel:   (id: number) => void;
  cancelling: number | null;
}) {
  return (
    <div className="flex items-center justify-between gap-1 group/row">
      <div className="flex items-center gap-1 min-w-0">
        <Radio size={9} className="text-slate-400 shrink-0" />
        <span className="text-[10px] text-slate-600 truncate">
          {item.sireneName ?? `Sirène #${item.sireneId}`}
        </span>
        {/* Lien notif individuel si envoyé */}
        {item.status === 'sent' && item.notificationId && (
          <a
            href={`/notifications?id=${item.notificationId}`}
            onClick={e => e.stopPropagation()}
            className="ml-1 text-[10px] text-blue-400 hover:text-blue-600 shrink-0"
            title="Voir la notification"
          >
            <ExternalLink size={9} />
          </a>
        )}
      </div>
      {/* Bouton annulation individuelle */}
      {item.canCancel && (
        <button
          onClick={e => { e.stopPropagation(); onCancel(item.id); }}
          disabled={cancelling === item.id}
          className="shrink-0 p-0.5 rounded text-slate-300 hover:text-red-500 hover:bg-red-50
            transition-colors opacity-0 group-hover/row:opacity-100"
          title="Annuler cette diffusion"
        >
          {cancelling === item.id
            ? <Loader2 size={10} className="animate-spin" />
            : <X size={10} />}
        </button>
      )}
    </div>
  );
}

// ── Drawer détail ─────────────────────────────────────────────────────────────
function DetailDrawer({
  item,
  onClose,
  onCancel,
  cancelling,
  userId,
}: {
  item:       PlanningItem;
  onClose:    () => void;
  onCancel:   (id: number) => void;
  cancelling: number | null;
  userId:     number | null;
}) {
  const c    = STATUS_CFG[item.status];
  const Icon = c.Icon;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white shadow-2xl flex flex-col h-full">

        {/* Header */}
        <div className={`px-5 py-4 border-b ${c.bg} ${c.border} border-b`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon size={18} className={c.color} />
              <span className={`text-sm font-semibold ${c.color}`}>{c.label}</span>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/10 transition-colors">
              <X size={16} className="text-slate-600" />
            </button>
          </div>
          <div className="mt-2 text-xs text-slate-600">
            Diffusion prévue le{' '}
            <strong>{fmtDate(item.scheduledDate)} à {CRENEAU_LABELS[item.scheduledHeure]}</strong>
          </div>
        </div>

        {/* Corps */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">

          {/* Souscatégorie + audio */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Tag size={13} className="text-slate-400" />
              <div>
                <p className="text-xs text-slate-400">Sous-catégorie</p>
                <p className="text-sm font-semibold text-slate-800">
                  {item.sousCategorieNom ?? '—'}
                </p>
              </div>
            </div>
            {item.alerteAudioName && (
              <div className="flex items-center gap-2">
                <Bell size={13} className="text-slate-400" />
                <div>
                  <p className="text-xs text-slate-400">Audio</p>
                  <p className="text-sm text-slate-700">{item.alerteAudioName}</p>
                </div>
              </div>
            )}
          </div>

          {/* Client + sirène */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 flex flex-col gap-2">
            {item.customerName && (
              <div className="flex items-center gap-2">
                <User size={13} className="text-slate-400" />
                <div>
                  <p className="text-xs text-slate-400">Client</p>
                  <p className="text-sm font-semibold text-slate-800">{item.customerName}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Radio size={13} className="text-slate-400" />
              <div>
                <p className="text-xs text-slate-400">Sirène</p>
                <p className="text-sm text-slate-700">
                  {item.sireneName ?? `Sirène #${item.sireneId}`}
                </p>
              </div>
            </div>
          </div>

          {/* Notifications liées */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Notifications liées
            </p>
            <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 bg-slate-50">
              {item.notifications?.length ? (
                <>
                  {item.notifications.map(n => (
                    <div key={n.id} className="flex items-center justify-between px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                          n.status === 'sent'   ? 'bg-green-400' :
                          n.status === 'failed' ? 'bg-red-400'   : 'bg-amber-400'
                        }`} />
                        <span className="text-xs text-slate-700">#{n.id}</span>
                        {n.message && (
                          <code className="text-xs text-slate-400 font-mono truncate max-w-[120px]">
                            {n.message.slice(0, 20)}…
                          </code>
                        )}
                      </div>
                      <a
                        href={`/notifications?id=${n.id}`}
                        className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700"
                        target="_blank" rel="noreferrer"
                      >
                        Voir <ExternalLink size={10} />
                      </a>
                    </div>
                  ))}
                  <div className="px-4 py-2.5">
                    <a
                      href={`/notifications?souscriptionId=${item.souscriptionId}&sireneId=${item.sireneId}`}
                      className="flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-700"
                      target="_blank" rel="noreferrer"
                    >
                      <ExternalLink size={11} />
                      Toutes les notifications de cette souscription
                    </a>
                  </div>
                </>
              ) : item.notificationId ? (
                <div className="px-4 py-2.5">
                  <a
                    href={`/notifications?id=${item.notificationId}`}
                    className="flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-700"
                    target="_blank" rel="noreferrer"
                  >
                    <ExternalLink size={11} />
                    Voir la notification #{item.notificationId}
                  </a>
                </div>
              ) : (
                <div className="px-4 py-3 text-xs text-slate-400">
                  Aucune notification pour ce créneau.
                </div>
              )}
            </div>
          </div>

          {/* Observation */}
          {item.observation && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs font-semibold text-amber-700 mb-1">Observation</p>
              <p className="text-xs text-amber-800">{item.observation}</p>
            </div>
          )}
        </div>

        {/* Footer annulation */}
        {item.canCancel && userId && (
          <div className="px-5 py-4 border-t border-slate-100">
            <button
              onClick={() => onCancel(item.id)}
              disabled={cancelling === item.id}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-200
                bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600
                hover:bg-red-100 disabled:opacity-50 transition-colors"
            >
              {cancelling === item.id
                ? <><Loader2 size={15} className="animate-spin" /> Annulation…</>
                : <><XCircle size={15} /> Annuler cette diffusion</>}
            </button>
            <p className="text-xs text-slate-400 text-center mt-2">
              L'annulation empêche l'envoi SMS au cerveau pour ce créneau.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function PlanningDiffusionPage() {
  const { isSuperAdmin, userId, customerId } = useRole();
  const [selected,           setSelected]           = useState<PlanningItem | null>(null);
  const [triggerResult,      setTriggerResult]      = useState<string | null>(null);
  const [filterCustomerId,   setFilterCustomerId]   = useState<number | undefined>();
  const [filterSireneId,     setFilterSireneId]     = useState<number | undefined>();

  const { data: rawCustomers } = useQuery({
    queryKey: ['customers'],
    queryFn:  () => customersApi.getAll(),
    enabled:  isSuperAdmin,
  });
  const customers: any[] = Array.isArray(rawCustomers)
    ? rawCustomers
    : (rawCustomers as any)?.data ?? (rawCustomers as any)?.response ?? [];

  const { data: sirenes } = useQuery({
    queryKey: ['sirenes'],
    queryFn:  () => sirenesApi.getAll(),
    enabled:  isSuperAdmin,
  });

  const planning = usePlanning({
    customerId:       isSuperAdmin ? undefined : (customerId ?? undefined),
    filterCustomerId: isSuperAdmin ? filterCustomerId : undefined,
    filterSireneId:   isSuperAdmin ? filterSireneId   : undefined,
  });

  const handleCancel = async (id: number) => {
    if (!userId) return;
    await planning.cancelItem(id, userId);
    if (selected?.id === id) setSelected(null);
  };

  const handleTrigger = async (date: string) => {
    const res = await planning.triggerDate(date);
    if (res) {
      setTriggerResult(
        `✅ ${res.date} — ${res.sent} envoyé(s), ${res.skipped} ignoré(s), ${res.failed} échec(s)`
      );
      setTimeout(() => setTriggerResult(null), 6000);
    }
  };

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(planning.weekStart, i);
    return { date: toISO(d), label: JOURS_FR[i], display: fmtDate(toISO(d)) };
  });

  const { stats } = planning;

  return (
    <AppLayout>
      <div className="page-wrap">

        {/* ── Header ── */}
        <div className="page-header">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Planning des diffusions</h1>
            <p className="page-subtitle">
              {isSuperAdmin
                ? 'Vue globale — toutes les diffusions planifiées'
                : 'Vos diffusions de la semaine'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isSuperAdmin && (
              <div className="flex gap-1.5">
                {[
                  { label: "Tester aujourd'hui", date: 'today'    },
                  { label: 'Tester demain',       date: 'tomorrow' },
                ].map(({ label, date }) => (
                  <button
                    key={date}
                    onClick={() => handleTrigger(date)}
                    disabled={planning.triggering}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg
                      border border-purple-200 bg-purple-50 text-purple-700
                      hover:bg-purple-100 disabled:opacity-50 transition-colors"
                  >
                    {planning.triggering
                      ? <Loader2 size={11} className="animate-spin" />
                      : <Send size={11} />}
                    {label}
                  </button>
                ))}
              </div>
            )}

            {!planning.isCurrentWeek && (
              <button
                onClick={planning.goToCurrentWeek}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                <RotateCcw size={12} /> Aujourd'hui
              </button>
            )}
            <button onClick={planning.prevWeek}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium text-slate-700 min-w-[160px] text-center">
              {fmtDate(toISO(planning.weekStart))} — {fmtDate(toISO(planning.weekEnd))}
            </span>
            <button onClick={planning.nextWeek}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Filtres admin */}
          {isSuperAdmin && (
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={filterCustomerId ?? ''}
                onChange={e => setFilterCustomerId(e.target.value ? Number(e.target.value) : undefined)}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600
                  hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="">— Tous les clients —</option>
                {customers.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name ?? c.email}</option>
                ))}
              </select>

              <select
                value={filterSireneId ?? ''}
                onChange={e => setFilterSireneId(e.target.value ? Number(e.target.value) : undefined)}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600
                  hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="">— Toutes les sirènes —</option>
                {(sirenes as any[])?.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name ?? s.imei}</option>
                ))}
              </select>

              {(filterCustomerId || filterSireneId) && (
                <button
                  onClick={() => { setFilterCustomerId(undefined); setFilterSireneId(undefined); }}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg
                    border border-slate-200 text-slate-500 hover:bg-slate-50"
                >
                  <X size={11} /> Réinitialiser
                </button>
              )}
            </div>
          )}
        </div>

        {/* Résultat trigger */}
        {triggerResult && (
          <div className="mt-3 rounded-xl border border-purple-200 bg-purple-50 px-4 py-2.5 text-sm text-purple-700 flex items-center justify-between">
            {triggerResult}
            <button onClick={() => setTriggerResult(null)}><X size={14} /></button>
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="mt-5 grid grid-cols-5 gap-3">
            {[
              { label: 'Total',     value: stats.total,     color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200' },
              { label: 'Planifiés', value: stats.planned,   color: 'text-blue-700',  bg: 'bg-blue-50',  border: 'border-blue-200'  },
              { label: 'Envoyés',   value: stats.sent,      color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
              { label: 'Annulés',   value: stats.cancelled, color: 'text-red-600',   bg: 'bg-red-50',   border: 'border-red-200'   },
              { label: 'Ignorés',   value: stats.skipped,   color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200' },
            ].map(({ label, value, color, bg, border }) => (
              <div key={label} className={`rounded-xl border ${border} ${bg} px-4 py-3`}>
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Grille */}
        <div className="mt-5 overflow-x-auto">
          {planning.loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 size={24} className="animate-spin text-blue-400" />
              <span className="ml-2 text-sm text-slate-400">Chargement…</span>
            </div>
          ) : (
            <table className="w-full border-collapse" style={{ minWidth: 800 }}>
              <thead>
                <tr>
                  <th className="w-20 pb-3 text-left">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Créneau</span>
                  </th>
                  {days.map(({ date, label, display }) => (
                    <th key={date} className="pb-3 px-1.5 text-center min-w-[130px]">
                      <div className={`rounded-xl py-2 px-3 ${isToday(date) ? 'bg-blue-600' : 'bg-slate-50'}`}>
                        <div className={`text-xs font-semibold uppercase tracking-wide ${isToday(date) ? 'text-blue-100' : 'text-slate-500'}`}>
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
                {CRENEAUX.map(heure => (
                  <tr key={heure}>
                    <td className="py-2 pr-3 align-top">
                      <div className="flex items-center gap-1.5 pt-1">
                        <Clock size={12} className="text-slate-400 shrink-0" />
                        <span className="text-xs font-semibold text-slate-500">{CRENEAU_LABELS[heure]}</span>
                      </div>
                    </td>
                    {days.map(({ date }) => {
                      const slot   = planning.getSlot(date, heure);
                      const isPast = new Date(`${date}T${String(heure).padStart(2, '0')}:00:00`) < new Date();
                      const groups = slot ? groupBySousCat(slot.items) : [];

                      return (
                        <td key={date} className="py-2 px-1.5 align-top">
                          <div className={`min-h-[64px] rounded-xl border-2 p-1.5 transition-colors
                            ${groups.length
                              ? 'border-transparent bg-white'
                              : isPast
                                ? 'border-dashed border-slate-100 bg-slate-50/30'
                                : 'border-dashed border-slate-200 bg-slate-50'}`}
                          >
                            {groups.length ? (
                              <div className="space-y-1.5">
                                {groups.map((group, idx) => (
                                  <PlanningCard
                                    key={`${group.sousCategorieId}-${group.customerId}-${idx}`}
                                    group={group}
                                    onSelect={setSelected}
                                    onCancel={handleCancel}
                                    cancelling={planning.cancelling}
                                    isSuperAdmin={isSuperAdmin}
                                  />
                                ))}
                              </div>
                            ) : (
                              <div className="flex items-center justify-center h-full min-h-[56px]">
                                {!isPast && <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />}
                              </div>
                            )}
                          </div>
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
        <div className="mt-4 flex items-center gap-5 flex-wrap">
          {(Object.entries(STATUS_CFG) as [DPStatus, typeof STATUS_CFG[DPStatus]][]).map(([key, c]) => (
            <span key={key} className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className={`w-2 h-2 rounded-full ${c.dot}`} /> {c.label}
            </span>
          ))}
        </div>
      </div>

      {selected && (
        <DetailDrawer
          item={selected}
          onClose={() => setSelected(null)}
          onCancel={handleCancel}
          cancelling={planning.cancelling}
          userId={userId}
        />
      )}
    </AppLayout>
  );
}