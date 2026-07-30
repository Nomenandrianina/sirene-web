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
  skipped:   { label: 'q',   color: 'text-slate-400', bg: 'bg-slate-50', border: 'border-slate-200', dot: 'bg-slate-300', Icon: SkipForward },
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
    <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-white/70 ${c.color} border ${c.border}`}>
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

// ── Card par groupe (souscatégorie + client) ─────────────────────────────────
// Le groupe reste neutre (peut contenir plusieurs sirènes de statuts différents),
// mais chaque item à l'intérieur reprend le style coloré "plein" de la vue client.
function PlanningCard({ group, onSelect, onCancel, cancelling, hideClientName, }: {
  group:          CellGroup;
  onSelect:       (i: PlanningItem) => void;
  onCancel:       (id: number) => void;
  cancelling:     number | null;
  hideClientName?: boolean;
}) {
  // Le clic sur la card ouvre le drawer du premier item
  const firstItem = group.items[0];

  return (
    <div
      onClick={() => onSelect(firstItem)}
      className="rounded-xl border border-slate-200 bg-white px-2 py-2 cursor-pointer hover:shadow-md hover:border-slate-300 transition-all"
    >
      {/* En-tête groupe : souscatégorie + client */}
      <div className="flex items-center justify-between gap-1 mb-1.5">
        <div className="text-xs font-semibold truncate flex items-center gap-1 text-slate-700">
          <Tag size={10} className="shrink-0 text-slate-400" />
          {group.sousCategorieNom ?? 'Sans catégorie'}
        </div>
      </div>

      {!hideClientName && group.customerName && (
        <div className="flex items-center gap-1 mb-1.5">
          <User size={9} className="text-slate-400 shrink-0" />
          <span className="text-[10px] font-medium text-slate-500 truncate">{group.customerName}</span>
        </div>
      )}

      {/* Une sous-carte colorée par sirène/item, façon vue client */}
      <div className="flex flex-col gap-1">
        {group.items.map(item => (
          <SireneRow key={item.id} item={item} onCancel={onCancel} cancelling={cancelling} />
        ))}
      </div>
    </div>
  );
}

// ── Sous-carte par item (sirène) — reprend le style plein de la vue client ───
function SireneRow({
  item,
  onCancel,
  cancelling,
}: {
  item:       PlanningItem;
  onCancel:   (id: number) => void;
  cancelling: number | null;
}) {
  const cfg = STATUS_CFG[item.status];

  return (
    <div className={`rounded-lg px-2 py-1.5 border flex flex-col gap-1 ${cfg.bg} ${cfg.border}`}>
      {/* Ligne 1 : statut + heure + bouton annuler (toujours visible) */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
          <span className={`text-[10px] font-bold ${cfg.color}`}>
            {CRENEAU_LABELS[item.scheduledHeure]}
          </span>
          <span className={`text-[10px] ${cfg.color} opacity-60 truncate`}>{cfg.label}</span>
        </div>
        {item.canCancel && (
          <button
            onClick={e => { e.stopPropagation(); onCancel(item.id); }}
            disabled={cancelling === item.id}
            className="shrink-0 p-1 rounded-md bg-white/70 hover:bg-red-100 disabled:opacity-50 transition-colors"
            title="Annuler cette diffusion"
          >
            {cancelling === item.id
              ? <Loader2 size={10} className="animate-spin text-red-500" />
              : <X size={10} className="text-red-500" />}
          </button>
        )}
      </div>

      {/* Sirène */}
      <div className="flex items-center gap-1 pl-3">
        <Radio size={9} className="text-slate-400 shrink-0" />
        <span className="text-[10px] text-slate-600 truncate">
          {item.sireneName ?? `Sirène #${item.sireneId}`}
        </span>
      </div>

      {/* Audio */}
      {item.alerteAudioName && (
        <div className="flex items-center gap-1 pl-3">
          <span className="text-[9px] text-slate-400 truncate">🔊 {item.alerteAudioName}</span>
        </div>
      )}

      {/* Lien notif individuel si envoyé */}
      {item.status === 'sent' && item.notificationId && (
        <a
          href={`/notifications?id=${item.notificationId}`}
          onClick={e => e.stopPropagation()}
          className="text-[9px] text-blue-500 hover:text-blue-700 pl-3 flex items-center gap-1"
          title="Voir la notification"
        >
          <ExternalLink size={9} /> Notification
        </a>
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

  // Quand un seul client est filtré (ou qu'on n'est pas superadmin), le nom du
  // client est redondant sur chaque card → on l'affiche plus dans la grille.
  const hideClientName = !isSuperAdmin || !!filterCustomerId;

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
      <div className="bg-gradient-to-b from-slate-50 to-white min-h-full -m-6 p-6">
        <div className="flex flex-col gap-5">

          {/* ── Header card ─────────────────────────────────────────────── */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Planning des diffusions</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  {isSuperAdmin
                    ? 'Vue globale — toutes les diffusions planifiées'
                    : 'Vos diffusions de la semaine'}
                </p>
              </div>

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
            </div>

            {/* Filtres admin, intégrés au header */}
            {isSuperAdmin && (
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 flex-wrap">
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
            <div className="rounded-2xl border border-purple-200 bg-purple-50 px-4 py-2.5 text-sm text-purple-700 flex items-center justify-between shadow-sm">
              {triggerResult}
              <button onClick={() => setTriggerResult(null)}><X size={14} /></button>
            </div>
          )}

          {/* ── Stats card ───────────────────────────────────────────────── */}
          {stats && (
            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
              <div className="grid grid-cols-5 gap-3">
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
            </div>
          )}

          {/* ── Grille planning card ─────────────────────────────────────── */}
          <div className="rounded-2xl bg-gradient-to-b from-slate-50/80 to-white border border-slate-200 shadow-sm overflow-hidden">

            {/* Navigation semaine */}
            <div className="flex items-center justify-between gap-2 px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Clock size={14} className="text-slate-400" />
                {fmtDate(toISO(planning.weekStart))} — {fmtDate(toISO(planning.weekEnd))}
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

            {/* Grille */}
            <div className="overflow-x-auto">
              {planning.loading ? (
                <div className="flex items-center justify-center py-24 gap-2 text-slate-400">
                  <Loader2 size={22} className="animate-spin" /><span className="text-sm">Chargement…</span>
                </div>
              ) : (
                <table className="w-full border-collapse" style={{ minWidth: 800 }}>
                  <thead>
                    <tr className="bg-slate-50/70">
                      <th className="w-20 py-3 px-4 text-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Créneau</span>
                      </th>
                      {days.map(({ date, label, display }) => (
                        <th key={date} className="py-3 px-1.5 text-center min-w-[130px]">
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
                    {CRENEAUX.map((heure, i) => (
                      <tr
                        key={heure}
                        className={`${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}
                          ${i > 0 ? 'border-t-2 border-slate-100' : ''}`}
                      >
                        <td className="py-3 px-4 align-middle">
                          <div className="flex flex-col items-center justify-center gap-1 text-center">
                            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                              <Clock size={12} className="text-blue-400" />
                            </div>
                            <span className="text-xs font-bold text-slate-600">{CRENEAU_LABELS[heure]}</span>
                          </div>
                        </td>
                        {days.map(({ date }) => {
                          const slot   = planning.getSlot(date, heure);
                          const isPast = new Date(`${date}T${String(heure).padStart(2, '0')}:00:00`) < new Date();
                          const groups = slot ? groupBySousCat(slot.items) : [];

                          return (
                            <td key={date} className="py-2.5 px-1.5 align-top">
                              <div className={`min-h-[72px] rounded-xl p-1.5 transition-colors
                                ${groups.length
                                  ? 'bg-white'
                                  : isPast
                                    ? 'border-2 border-dashed border-slate-100 bg-slate-50/20'
                                    : 'border-2 border-dashed border-slate-200 bg-white'}`}
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
                                        hideClientName={hideClientName}
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
          </div>

          {/* ── Légende card ─────────────────────────────────────────────── */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm px-5 py-4">
            <div className="flex items-center gap-5 flex-wrap text-xs text-slate-500">
              {(Object.entries(STATUS_CFG) as [DPStatus, typeof STATUS_CFG[DPStatus]][]).map(([key, c]) => (
                <span key={key} className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${c.dot}`} /> {c.label}
                </span>
              ))}
            </div>
          </div>

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