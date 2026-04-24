import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Loader2, AlertCircle, Radio, Star, Trophy,
  CalendarDays, Gauge, MapPin, RefreshCw, FileText,
  Eye, CheckCircle2, XCircle, PauseCircle, Hourglass,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { useRole } from "@/hooks/useRole";
import { souscriptionApi } from "@/services/diffusion.api";
import type { Souscription, SouscriptionStatus, SouscriptionSirene } from "@/types/diffusion";

// ── Helpers ──────────────────────────────────────────────────────────────────
function daysLeft(endDate: string): number {
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

function contractRef(id: number): string {
  return `CTR-${new Date().getFullYear()}-${String(id).padStart(4, "0")}`;
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: SouscriptionStatus }) {
  const map: Record<SouscriptionStatus, { label: string; cls: string; Icon: React.ElementType }> = {
    active:    { label: "Actif",      cls: "bg-emerald-50 text-emerald-700 border border-emerald-200", Icon: CheckCircle2 },
    expired:   { label: "Expiré",     cls: "bg-slate-100 text-slate-500 border border-slate-200",     Icon: XCircle      },
    suspended: { label: "Suspendu",   cls: "bg-amber-50 text-amber-700 border border-amber-200",      Icon: PauseCircle  },
    pending:   { label: "En attente", cls: "bg-blue-50 text-blue-700 border border-blue-200",          Icon: Hourglass    },
  };
  const { label, cls, Icon } = map[status] ?? map.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}>
      <Icon size={11} /> {label}
    </span>
  );
}

// ── Pack icon ─────────────────────────────────────────────────────────────────
function PackIcon({ name }: { name: string }) {
  const lower = name.toLowerCase();
  if (lower.includes("premium")) return <Trophy size={20} className="text-amber-500" />;
  if (lower.includes("medium"))  return <Star   size={20} className="text-sky-500"  />;
  return <Radio size={20} className="text-slate-500" />;
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ value, max, color = "bg-emerald-500" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ── Zones couvertes : liste des sirènes avec leur village ─────────────────────
function ZoneList({ sirenes }: { sirenes: SouscriptionSirene[] }) {
  if (!sirenes || sirenes.length === 0) {
    return <span className="text-slate-300 text-xs italic">Aucune sirène associée</span>;
  }

  const MAX_VISIBLE = 3;
  const visible  = sirenes.slice(0, MAX_VISIBLE);
  const overflow = sirenes.length - MAX_VISIBLE;

  return (
    <div className="flex flex-col gap-2">
      {visible.map(sirene => (
        <div key={sirene.id} className="flex items-center gap-2 flex-wrap">
          {/* Sirène */}
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border w-fit
            ${sirene.isActive
              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
              : "bg-slate-100 text-slate-400 border-slate-200"
            }`}
          >
            <Radio size={10} />
            {sirene.name ?? `Sirène #${sirene.id}`}
            {!sirene.isActive && <span className="text-[10px] text-red-400 ml-0.5">(inactive)</span>}
          </span>

          {/* Flèche + Village */}
          {sirene.village && (
            <>
              <span className="text-slate-300 text-xs">›</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 w-fit">
                <MapPin size={10} />
                {sirene.village.name}
              </span>
            </>
          )}
        </div>
      ))}

      {overflow > 0 && (
        <span className="text-xs text-slate-400 ml-1 italic">
          +{overflow} autre{overflow > 1 ? "s" : ""} sirène{overflow > 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}

// ── Souscription Card ─────────────────────────────────────────────────────────
function SouscriptionCard({
  sub,
  onDetail,
  onRenew,
  onReport,
}: {
  sub:      Souscription;
  onDetail: () => void;
  onRenew:  () => void;
  onReport: () => void;
}) {
  const sirenes    = sub.sirenes ?? [];
  const days       = sub.joursRestants ?? daysLeft(sub.endDate);
  const totalDays  = Math.max(1, Math.ceil(
    (new Date(sub.endDate).getTime() - new Date(sub.startDate).getTime()) / (1000 * 60 * 60 * 24)
  ));
  const elapsed    = totalDays - days;
  const isActive   = sub.status === "active";
  const isExpiring = isActive && days <= 14;
  const timeBarColor = isExpiring ? "bg-amber-400" : "bg-emerald-500";

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col transition hover:shadow-md
      ${isActive ? "border-slate-200" : "border-slate-100 opacity-80"}`}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-slate-100">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
              <PackIcon name={sub.packType?.name ?? ""} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 leading-tight">
                {sub.packType?.name ?? `Pack #${sub.packTypeId}`}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">{contractRef(sub.id)}</p>
            </div>
          </div>
          <StatusBadge status={sub.status} />
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 flex flex-col gap-4 flex-1">

        {/* Période + diffusions */}
        <div className="flex gap-3">
          <div className="flex-1 rounded-xl bg-slate-50 border border-slate-100 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <CalendarDays size={13} className="text-slate-400" />
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Période</span>
            </div>
            <p className="text-sm font-semibold text-slate-800">
              {formatDate(sub.startDate)} – {formatDate(sub.endDate)}
            </p>
            <div className="mt-2">
              <ProgressBar value={elapsed} max={totalDays} color={timeBarColor} />
            </div>
            <p className="text-xs text-slate-400 mt-1.5">
              {isActive
                ? isExpiring
                  ? <span className="text-amber-600 font-medium">{days} jours restants</span>
                  : `${days} jours restants`
                : sub.status === "expired" ? "Expiré" : `${days} jours restants`}
            </p>
          </div>

          <div className="w-28 rounded-xl bg-slate-50 border border-slate-100 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Gauge size={13} className="text-slate-400" />
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Diffusions</span>
            </div>
            <p className="text-xl font-bold text-slate-900 leading-tight">
              {sub.packType?.frequenceParJour ?? "—"}
              <span className="text-xs font-medium text-slate-400"> /j</span>
            </p>
            {sub.packType && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                <span className="px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] text-slate-500">
                  {sub.packType.joursParSemaine}j/sem.
                </span>
                <span className="px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] text-slate-500">
                  {sub.packType.dureeMaxMinutes}min
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Zones couvertes : sirènes → villages */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <MapPin size={13} className="text-slate-400" />
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Zone{sirenes.length > 1 ? "s" : ""} couverte{sirenes.length > 1 ? "s" : ""}
              {sirenes.length > 0 && (
                <span className="ml-1.5 text-slate-300 font-normal normal-case tracking-normal">
                  ({sirenes.length} sirène{sirenes.length > 1 ? "s" : ""})
                </span>
              )}
            </span>
          </div>
          <ZoneList sirenes={sirenes} />
        </div>
      </div>

      {/* Footer actions */}
      <div className="px-5 pb-5 flex items-center gap-2 pt-1">
        <button
          onClick={onReport}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white transition"
        >
          <FileText size={13} /> Rapport PDF
        </button>
        <button
          onClick={onDetail}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
        >
          <Eye size={13} /> Détail
        </button>
        {isActive && (
          <button
            onClick={onRenew}
            className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-white bg-amber-500 hover:bg-amber-600 transition"
          >
            <RefreshCw size={13} /> Renouveler
          </button>
        )}
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function MesOffres() {
  const navigate       = useNavigate();
  const { customerId } = useRole();

  // L'API doit retourner les sirènes avec leur village en eager :
  // relations: ['sirenes', 'sirenes.village']  dans le service NestJS
  const { data: rawSubs, isLoading, isError } = useQuery({
    queryKey: ["souscriptions", "client", customerId],
    queryFn:  () => souscriptionApi.getAll(customerId!),
    enabled:  !!customerId,
  });

  const souscriptions: Souscription[] = Array.isArray(rawSubs)
    ? rawSubs
    : (rawSubs as any)?.data ?? [];

  const activeCount  = souscriptions.filter(s => s.status === "active").length;
  const expiredCount = souscriptions.filter(s => s.status === "expired").length;
  const sireneActiveCount = souscriptions
    .filter(s => s.status === "active")
    .reduce((acc, s) => acc + (s.sirenes?.filter(sr => sr.isActive).length ?? 0), 0);

  return (
    <AppLayout>
      <div className="min-h-screen bg-slate-50">

        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-5">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Mes offres et contrats</h1>
            {!isLoading && (
              <p className="text-sm text-slate-500 mt-0.5">
                {activeCount > 0
                  ? `${activeCount} contrat${activeCount > 1 ? "s" : ""} actif${activeCount > 1 ? "s" : ""} · Cliquez pour voir le détail`
                  : "Aucun contrat actif"}
              </p>
            )}
          </div>
        </div>

        <div className="px-6 py-6 max-w-6xl mx-auto flex flex-col gap-6">

          {/* Stats rapides */}
          {!isLoading && souscriptions.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Contrats actifs", value: activeCount,         icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
                { label: "Expirés",         value: expiredCount,         icon: XCircle,      color: "text-slate-500 bg-slate-100"   },
                { label: "Total contrats",  value: souscriptions.length, icon: FileText,     color: "text-sky-600 bg-sky-50"        },
                { label: "Sirènes actives", value: sireneActiveCount,    icon: Radio,        color: "text-violet-600 bg-violet-50"  },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-slate-900 leading-tight">{value}</p>
                    <p className="text-xs text-slate-400">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Contenu */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
              <Loader2 size={22} className="animate-spin" />
              <span className="text-sm">Chargement de vos offres…</span>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
              <AlertCircle size={32} strokeWidth={1.5} className="text-red-400" />
              <p className="text-sm font-medium text-red-500">Impossible de charger vos offres</p>
              <p className="text-xs">Veuillez réessayer ou contacter le support</p>
            </div>
          ) : souscriptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
              <Radio size={40} strokeWidth={1.2} />
              <p className="text-sm font-medium">Aucune offre disponible</p>
              <p className="text-xs">Contactez votre administrateur pour souscrire à un pack</p>
            </div>
          ) : (
            (["active", "pending", "suspended", "expired"] as SouscriptionStatus[]).map(statusGroup => {
              const group = souscriptions.filter(s => s.status === statusGroup);
              if (group.length === 0) return null;

              const groupLabels: Record<SouscriptionStatus, string> = {
                active:    "Contrats actifs",
                pending:   "En attente",
                suspended: "Suspendus",
                expired:   "Expirés",
              };

              return (
                <div key={statusGroup}>
                  <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    {groupLabels[statusGroup]}
                    <span className="ml-2 text-slate-300 font-normal normal-case tracking-normal">
                      ({group.length})
                    </span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {group.map(sub => (
                      <SouscriptionCard
                        key={sub.id}
                        sub={sub}
                        onDetail={() => navigate(`/mes-offres/${sub.id}`)}
                        onRenew={()  => navigate(`/mes-offres/${sub.id}/renouveler`)}
                        onReport={() => navigate(`/mes-offres/${sub.id}/rapport`)}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </AppLayout>
  );
}