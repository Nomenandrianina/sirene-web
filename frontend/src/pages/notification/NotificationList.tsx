import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { NotificationFilters, NotificationStatus, Notification } from "@/types/notification";
import { notificationsApi } from "@/services/notification.api";
import { sirenesApi }              from "@/services/sirene.api";
import { sousCategorieAlertesApi } from "@/services/souscategorieAlerte.api";
import { customersApi }            from "@/services/customers.api";
import { AlerteDeleteDialog }      from "@/components/alerte/Alertedeletedialog";
import { alerteAudiosApi } from "@/services/alerteaudio.api";
import { useRole }                 from "@/hooks/useRole";
import { CanDo }                   from "@/components/Cando";
import {
  Search, Trash2, Bell, Filter, X, CheckCircle, Clock, XCircle, HelpCircle, Radio, Calendar, Building2, ChevronDown,AlertTriangle, MapPin, Tag, Layers,
} from "lucide-react";
import "@/styles/page.css";
import "@/styles/utilisateurs.css";
import "@/styles/notification.css";

// ── Config statuts ─────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; Icon: any }> = {
  sent:     { label: "Envoyé",     color: "#059669", bg: "#d1fae5", Icon: CheckCircle },
  delivery: { label: "Livré",      color: "#0891b2", bg: "#e0f2fe", Icon: CheckCircle },
  pending:  { label: "En attente", color: "#d97706", bg: "#fef3c7", Icon: Clock       },
  failed:   { label: "Échoué",     color: "#dc2626", bg: "#fee2e2", Icon: XCircle     },
  unknown:  { label: "Inconnu",    color: "#6b7280", bg: "#f3f4f6", Icon: HelpCircle  },
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtDate(d?: string | Date | null) {
  if (!d) return "—";
  return new Date(d as string).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

function fmtDateShort(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function toArr<T>(r: unknown): T[] {
  if (!r) return [];
  if (Array.isArray(r)) return r as T[];
  if (typeof r === "object") {
    for (const k of ["data", "response", "items", "results"]) {
      const v = (r as any)[k];
      if (Array.isArray(v)) return v as T[];
    }
  }
  return [];
}

function getZone(sirene?: any): string {
  if (!sirene) return "—";
  const parts = [
    sirene.village?.region?.name,
    sirene.village?.fokontany?.commune?.district?.name,
    sirene.village?.name,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" › ") : (sirene.name ?? sirene.imei ?? "—");
}

const PER_PAGE = 20;

// ── Composants utilitaires ─────────────────────────────────────────────────────

function StatusBadge({ status }: { status?: string | null }) {
  const cfg = STATUS_CFG[status ?? "unknown"] ?? STATUS_CFG.unknown;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20,
      color: cfg.color, background: cfg.bg, whiteSpace: "nowrap",
    }}>
      <cfg.Icon size={10} /> {cfg.label}
    </span>
  );
}

function Chip({ icon, label, color, bg }: { icon?: React.ReactNode; label: string; color: string; bg: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 20,
      color, background: bg, whiteSpace: "nowrap",
    }}>
      {icon} {label}
    </span>
  );
}

function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      fontSize: 11, fontWeight: 500, color: "#1d4ed8", background: "#eff6ff",
      padding: "3px 10px", borderRadius: 20, border: "1px solid #bfdbfe",
    }}>
      {label}
      <button onClick={onRemove} style={{ background: "none", border: "none", cursor: "pointer", color: "#93c5fd", padding: 0, display: "flex" }}>
        <X size={11} />
      </button>
    </span>
  );
}

function PageBtn({ label, active, disabled, onClick }: {
  label: string; active?: boolean; disabled?: boolean; onClick: () => void;
}) {
  return (
    <button disabled={disabled} onClick={onClick} style={{
      width: 32, height: 32, borderRadius: 8,
      border: `1px solid ${active ? "#1d4ed8" : "#e2e8f0"}`,
      background: active ? "#1d4ed8" : disabled ? "#f8fafc" : "#fff",
      color: active ? "#fff" : disabled ? "#cbd5e1" : "#475569",
      cursor: disabled ? "not-allowed" : "pointer",
      fontSize: 13, fontWeight: 600,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {label}
    </button>
  );
}

function InfoBlock({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div style={{ background: "#f8fafc", borderRadius: 8, padding: "8px 12px" }}>
      <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 12, color: "#1e293b", fontWeight: 500, fontFamily: mono ? "monospace" : undefined, wordBreak: "break-all" }}>
        {value ?? "—"}
      </div>
    </div>
  );
}

// ── Carte notification ─────────────────────────────────────────────────────────

function NotifCard({ n, onDelete, showCustomer }: {
  n: Notification; onDelete: () => void; showCustomer: boolean;
}) {

  const [expanded, setExpanded] = useState(false);
  const cfg  = STATUS_CFG[n.status ?? "unknown"] ?? STATUS_CFG.unknown;
  const zone = getZone((n as any).sirene);
  
  return (
    <div style={{
      background: "#fff",
      border: `1px solid ${n.status === "failed" ? "#fecaca" : "#e8edf2"}`,
      borderLeft: `3px solid ${cfg.color}`,
      borderRadius: 10, padding: "14px 16px",
      transition: "box-shadow 0.15s",
    }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)")}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>

        {/* Icône statut */}
        <div style={{
          width: 38, height: 38, borderRadius: 9, flexShrink: 0,
          background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <cfg.Icon size={17} style={{ color: cfg.color }} />
        </div>

        {/* Contenu */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Badges */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
            <StatusBadge status={n.status} />

            {n.sousCategorie && (
              <Chip icon={<Tag size={9} />} label={n.sousCategorie.name} color="#7c3aed" bg="#f5f3ff" />
            )}

            {n.type && (
              <Chip icon={<Layers size={9} />} label={n.type} color="#0f766e" bg="#f0fdfa" />
            )}

            {showCustomer && (n as any).Customer && (
              <Chip icon={<Building2 size={9} />} label={(n as any).Customer.name} color="#0891b2" bg="#e0f2fe" />
            )}
          </div>


          {(n as any).alerteAudio && (
            <AudioMiniPlayer audio={(n as any).alerteAudio} />
          )}


          {/* Sirène + zone */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {(n as any).sirene && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                fontSize: 11, fontWeight: 500, color: "#6366f1", background: "#eef2ff",
                padding: "2px 8px", borderRadius: 20,
              }}>
                <Radio size={9} />
                {(n as any).sirene.name ?? (n as any).sirene.imei ?? `Sirène #${n.sireneId}`}
              </span>
            )}
            {zone !== "—" && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "#64748b" }}>
                <MapPin size={10} style={{ color: "#94a3b8" }} /> {zone}
              </span>
            )}
          </div>

        </div>

        {/* Date + opérateur */}
        <div style={{ flexShrink: 0, textAlign: "right", minWidth: 130 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end", fontSize: 11, color: "#64748b" }}>
            <Calendar size={10} /> {fmtDate(n.sendingTime)}
          </div>
          {n.sendingTimeAfterAlerte && (
            <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
              Délai : {fmtDate(n.sendingTimeAfterAlerte)}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button
            onClick={() => setExpanded(v => !v)}
            style={{
              width: 28, height: 28, borderRadius: 7,
              border: "1px solid #e2e8f0", background: "#f8fafc",
              color: "#475569", display: "flex", alignItems: "center",
              justifyContent: "center", cursor: "pointer",
            }}
          >
            <ChevronDown size={13} style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
          </button>
          <CanDo permission="notifications:delete">
            <button
              onClick={onDelete}
              style={{
                width: 28, height: 28, borderRadius: 7,
                border: "1px solid #fecaca", background: "#fff1f2",
                color: "#e11d48", display: "flex", alignItems: "center",
                justifyContent: "center", cursor: "pointer",
              }}
            >
              <Trash2 size={12} />
            </button>
          </CanDo>
        </div>
      </div>

      {/* Détail expandé */}
      {expanded && (
        <div style={{
          marginTop: 12, paddingTop: 12, borderTop: "1px solid #f1f5f9",
          display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8,
        }}>
          <InfoBlock label="Date envoi"        value={fmtDate(n.sendingTime)} />
          <InfoBlock label="Délai post-alerte" value={fmtDate(n.sendingTimeAfterAlerte)} />
          <InfoBlock label="Zone"              value={zone} />
          {n.sousCategorie && <InfoBlock label="Sous-catégorie" value={n.sousCategorie.name} />}
          {n.type && <InfoBlock label="Catégorie" value={n.type} />}
          {showCustomer && (n as any).Customer && <InfoBlock label="Client" value={(n as any).Customer.name} />}
          {n.observation && <InfoBlock label="Observation" value={n.observation} />}
        </div>
      )}
    </div>
  );
}

function AudioMiniPlayer({ audio }: { audio: { id: number; name?: string; audio: string; duration?: number } }) {
  const [playing,  setPlaying]  = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(audio.duration ?? 0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (audioRef.current) audioRef.current.src = "";
    };
  }, []);

  function togglePlay() {
    if (!audioRef.current) {
      const url = alerteAudiosApi.audioUrl(audio.audio);
      const el  = new Audio(url);
      audioRef.current = el;

      el.addEventListener("loadedmetadata", () => setDuration(el.duration));
      el.addEventListener("timeupdate",     () => setProgress(el.currentTime));
      el.addEventListener("ended",          () => { setPlaying(false); setProgress(0); });
    }

    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().catch(console.error);
      setPlaying(true);
    }
  }

  function fmtT(s: number) {
    if (!isFinite(s) || isNaN(s)) return "0:00";
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  }

  const pct = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      background: playing ? "#eff6ff" : "#f8fafc",
      border: `1px solid ${playing ? "#bfdbfe" : "#e2e8f0"}`,
      borderRadius: 8, padding: "6px 10px", marginTop: 8,
      transition: "all 0.2s", marginBottom: "6px"
    }}>
      {/* Bouton play */}
      <button
        onClick={e => { e.stopPropagation(); togglePlay(); }}
        style={{
          width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
          border: "none", cursor: "pointer",
          background: playing ? "#3b82f6" : "#e2e8f0",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "background 0.15s",
        }}
      >
        {playing
          ? <svg width="10" height="10" viewBox="0 0 10 10" fill="#fff"><rect x="1" y="1" width="3" height="8" rx="1"/><rect x="6" y="1" width="3" height="8" rx="1"/></svg>
          : <svg width="10" height="10" viewBox="0 0 10 10" fill={playing ? "#fff" : "#475569"}><polygon points="2,1 9,5 2,9"/></svg>
        }
      </button>

      {/* Nom audio */}
      <span style={{ fontSize: 11, color: "#475569", fontWeight: 500, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
        🎵 {audio.name || `Audio #${audio.id}`}
      </span>

      {/* Temps */}
      <span style={{ fontSize: 10, color: "#94a3b8", flexShrink: 0 }}>
        {fmtT(progress)} / {fmtT(duration)}
      </span>

      {/* Barre de progression */}
      <div
        style={{ width: 80, height: 3, background: "#e2e8f0", borderRadius: 2, flexShrink: 0, cursor: "pointer", position: "relative" }}
        onClick={e => {
          e.stopPropagation();
          if (!audioRef.current || !duration) return;
          const rect  = e.currentTarget.getBoundingClientRect();
          const ratio = (e.clientX - rect.left) / rect.width;
          audioRef.current.currentTime = ratio * duration;
          setProgress(ratio * duration);
        }}
      >
        <div style={{
          width: `${pct}%`, height: "100%",
          background: "#3b82f6", borderRadius: 2,
          transition: "width 0.1s linear",
        }} />
      </div>
    </div>
  );
}

// ── Page principale ────────────────────────────────────────────────────────────

export default function NotificationList() {
  const qc = useQueryClient();
  const { isSuperAdmin, customerId } = useRole();

  const [filters, setFilters]         = useState<NotificationFilters>({ page: 1, limit: PER_PAGE });
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch]           = useState("");

  const [tmpSirene,   setTmpSirene]   = useState("");
  const [tmpStatus,   setTmpStatus]   = useState("");
  const [tmpStart,    setTmpStart]    = useState("");
  const [tmpEnd,      setTmpEnd]      = useState("");
  const [tmpSousCat,  setTmpSousCat]  = useState("");
  const [tmpCustomer, setTmpCustomer] = useState("");
  

  const [delItem,  setDelItem]  = useState<{ id: number; name: string } | null>(null);
  const [delError, setDelError] = useState("");

  // ── Filtre automatique customerId pour les clients ─────────────────────────

  const effectiveFilters: NotificationFilters = isSuperAdmin
    ? filters
    : { ...filters, customerId: customerId ?? undefined };

  // ── Données ────────────────────────────────────────────────────────────────

  const { data: raw, isLoading } = useQuery({
    queryKey: ["notifications", effectiveFilters],
    queryFn:  () => notificationsApi.getAll(effectiveFilters),
  });

  const { data: statsRaw } = useQuery({
    queryKey: ["notifications-stats", effectiveFilters],  // ← dépend de effectiveFilters
    queryFn:  () => notificationsApi.getStats(effectiveFilters),
  });

  const { data: rawSirenes }   = useQuery({ queryKey: ["sirenes"],                queryFn: sirenesApi.getAll });
  const { data: rawSousCats }  = useQuery({ queryKey: ["sous-categorie-alertes"], queryFn: sousCategorieAlertesApi.getAll });
  const { data: rawCustomers } = useQuery({
    queryKey: ["customers"],
    queryFn:  customersApi.getAll,
    enabled:  isSuperAdmin,
  });

  const result: { data: Notification[]; total: number; page: number; lastPage: number } =
    (raw as any)?.data
      ? raw as any
      : { data: toArr(raw), total: 0, page: 1, lastPage: 1 };

  const items     = result.data;
  const stats     = statsRaw as any;
  const sirenes   = toArr<any>(rawSirenes);
  const sousCats  = toArr<any>(rawSousCats);
  const customers = toArr<any>(rawCustomers);

  const filtered = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter(n =>
      n.type?.toLowerCase().includes(q) ||
      n.phoneNumber?.toLowerCase().includes(q) ||
      (n as any).sirene?.imei?.toLowerCase().includes(q) ||
      (n as any).sirene?.name?.toLowerCase().includes(q) ||
      n.sousCategorie?.name?.toLowerCase().includes(q)
    );
  }, [items, search]);

  // ── Filtres ────────────────────────────────────────────────────────────────

  function applyFilters() {
    setFilters({
      sireneId:              tmpSirene   ? +tmpSirene   : undefined,
      status:                tmpStatus   ? tmpStatus as NotificationStatus : undefined,
      startDate:             tmpStart    || undefined,
      endDate:               tmpEnd      || undefined,
      sousCategorieAlerteId: tmpSousCat  ? +tmpSousCat  : undefined,
      customerId:            tmpCustomer ? +tmpCustomer : undefined,
      page: 1, limit: PER_PAGE,
    });
    setShowFilters(false);
  }

  function updateFilter(key: keyof NotificationFilters, value: any) {
    setFilters(f => ({ ...f, [key]: value || undefined, page: 1 }));
  }
  
  function resetFilters() {
    setFilters({ page: 1, limit: PER_PAGE });
    setShowFilters(false);
  }

  

  const activeFilterCount = [
    filters.sireneId, filters.status, filters.startDate,
    filters.sousCategorieAlerteId,
    ...(isSuperAdmin ? [filters.customerId] : []),
  ].filter(Boolean).length;

  // ── Suppression ────────────────────────────────────────────────────────────

  const deleteMut = useMutation({
    mutationFn: (id: number) => notificationsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications-stats"] });
      setDelError(""); setTimeout(() => setDelItem(null), 300);
    },
    onError: (e: any) => setDelError(e?.response?.data?.message || e?.message || "Erreur"),
  });

  // ── Rendu ──────────────────────────────────────────────────────────────────

  return (
    <AppLayout>
      <div className="page-wrap">

        <div className="page-header">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              {isSuperAdmin ? "Diffusions envoyées" : "Mes diffusions"}
            </h1>
            <p className="page-subtitle">
              {isSuperAdmin
                ? "Historique de toutes les alertes envoyées aux sirènes"
                : "Historique de vos alertes envoyées"}
            </p>
          </div>
        </div>

        {/* KPIs */}

        {/* Alerte taux d'échec */}
        {stats && stats.total > 0 && (stats.failed / stats.total) > 0.1 && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "#fff7ed", border: "1px solid #fed7aa",
            borderRadius: 10, padding: "10px 16px", marginBottom: 16,
            fontSize: 13, color: "#9a3412",
          }}>
            <AlertTriangle size={16} style={{ color: "#ea580c", flexShrink: 0 }} />
            <span>Taux d'échec élevé : <strong>{Math.round((stats.failed / stats.total) * 100)}%</strong> des diffusions ont échoué</span>
          </div>
        )}

        <div className="panel">

          {/* Barre recherche + filtres */}
          <div style={{ display: "flex", gap: 10, padding: "14px 16px", borderBottom: "1px solid #f1f5f9", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
              <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Sirène, zone, sous-catégorie…"
                style={{
                  width: "100%", paddingLeft: 34, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
                  border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, color: "#1e293b",
                  outline: "none", background: "#fff", boxSizing: "border-box",
                }}
              />
            </div>

            <button onClick={() => setShowFilters(v => !v)} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8,
              border: `1px solid ${activeFilterCount > 0 ? "#93c5fd" : "#e2e8f0"}`,
              background: activeFilterCount > 0 ? "#eff6ff" : "#fff",
              color: activeFilterCount > 0 ? "#1d4ed8" : "#475569",
              fontSize: 13, fontWeight: 500, cursor: "pointer",
            }}>
              <Filter size={13} /> Filtres
              {activeFilterCount > 0 && (
                <span style={{ background: "#1d4ed8", color: "#fff", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>
                  {activeFilterCount}
                </span>
              )}
            </button>

            <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: "auto" }}>
              {result.total} diffusion{result.total > 1 ? "s" : ""}
            </span>
          </div>

          {/* Panneau filtres */}
          {showFilters && (
            <div style={{ padding: "16px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>

                <div className="sirene-field">
                  <label>Sirène</label>
                  <select
                    value={filters.sireneId ?? ""}
                    onChange={e => updateFilter("sireneId", e.target.value ? +e.target.value : undefined)}
                  >
                    <option value="">— Toutes —</option>
                    {sirenes.map((s: any) => <option key={s.id} value={s.id}>{s.name ?? s.imei}</option>)}
                  </select>
                </div>

                <div className="sirene-field">
                  <label>Statut</label>
                  <select
                    value={filters.status ?? ""}
                    onChange={e => updateFilter("status", e.target.value || undefined)}
                  >
                    <option value="">— Tous —</option>
                    {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>

                <div className="sirene-field">
                  <label>Sous-catégorie</label>
                  <select
                    value={filters.sousCategorieAlerteId ?? ""}
                    onChange={e => updateFilter("sousCategorieAlerteId", e.target.value ? +e.target.value : undefined)}
                  >
                    <option value="">— Toutes —</option>
                    {sousCats.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                {isSuperAdmin && (
                  <div className="sirene-field">
                    <label>Client</label>
                    <select
                      value={filters.customerId ?? ""}
                      onChange={e => updateFilter("customerId", e.target.value ? +e.target.value : undefined)}
                    >
                      <option value="">— Tous —</option>
                      {customers.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                )}

                <div className="sirene-field">
                  <label>Date début</label>
                  <input
                    type="datetime-local"
                    value={filters.startDate ?? ""}
                    onChange={e => updateFilter("startDate", e.target.value || undefined)}
                  />
                </div>

                <div className="sirene-field">
                  <label>Date fin</label>
                  <input
                    type="datetime-local"
                    value={filters.endDate ?? ""}
                    onChange={e => updateFilter("endDate", e.target.value || undefined)}
                  />
                </div>

              </div>

              {/* Seulement le bouton réinitialiser */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
                <button
                  onClick={resetFilters}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "7px 14px", borderRadius: 8,
                    border: "1px solid #e2e8f0", background: "#fff",
                    fontSize: 13, color: "#475569", cursor: "pointer",
                  }}
                >
                  <X size={13} /> Réinitialiser
                </button>
              </div>
            </div>
          )}

          {/* Tags filtres actifs */}
          {activeFilterCount > 0 && (
            <div style={{ display: "flex", gap: 6, padding: "8px 16px", flexWrap: "wrap", borderBottom: "1px solid #f1f5f9" }}>
              {filters.status && <FilterTag label={`Statut : ${STATUS_CFG[filters.status]?.label}`} onRemove={() => setFilters(f => ({ ...f, status: undefined, page: 1 }))} />}
              {filters.sireneId && <FilterTag label={`Sirène #${filters.sireneId}`} onRemove={() => setFilters(f => ({ ...f, sireneId: undefined, page: 1 }))} />}
              {isSuperAdmin && filters.customerId && <FilterTag label={`Client #${filters.customerId}`} onRemove={() => setFilters(f => ({ ...f, customerId: undefined, page: 1 }))} />}
              {filters.sousCategorieAlerteId && <FilterTag label={`Sous-cat #${filters.sousCategorieAlerteId}`} onRemove={() => setFilters(f => ({ ...f, sousCategorieAlerteId: undefined, page: 1 }))} />}
              {filters.startDate && <FilterTag label={`Depuis ${fmtDateShort(filters.startDate)}`} onRemove={() => setFilters(f => ({ ...f, startDate: undefined, page: 1 }))} />}
            </div>
          )}

          {/* Liste */}
          <div style={{ padding: "8px 16px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ height: 80, borderRadius: 10, background: "linear-gradient(90deg, #f1f5f9 25%, #e8edf2 50%, #f1f5f9 75%)", animation: "pulse 1.5s ease-in-out infinite" }} />
              ))
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8" }}>
                <Bell size={32} style={{ margin: "0 auto 12px", opacity: 0.3, display: "block" }} />
                <p style={{ fontSize: 13 }}>Aucune diffusion trouvée</p>
              </div>
            ) : (
              filtered.map(n => (
                <NotifCard
                  key={n.id} n={n} showCustomer={isSuperAdmin}
                  onDelete={() => { setDelError(""); setDelItem({ id: n.id, name: `Diffusion #${n.id}` }); }}
                />
              ))
            )}
          </div>

          {/* Pagination */}
          {!isLoading && result.lastPage > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", borderTop: "1px solid #f1f5f9" }}>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>Page {result.page} / {result.lastPage} — {result.total} diffusions</span>
              <div style={{ display: "flex", gap: 4 }}>
                <PageBtn disabled={result.page <= 1} label="‹" onClick={() => setFilters(f => ({ ...f, page: (f.page ?? 1) - 1 }))} />
                {Array.from({ length: result.lastPage }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === result.lastPage || Math.abs(p - result.page) <= 1)
                  .reduce<(number | "...")[]>((acc, p, i, arr) => {
                    if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                    acc.push(p); return acc;
                  }, [])
                  .map((p, i) => p === "..."
                    ? <span key={`d${i}`} style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#94a3b8" }}>…</span>
                    : <PageBtn key={p} active={result.page === p} label={String(p)} onClick={() => setFilters(f => ({ ...f, page: p as number }))} />
                  )
                }
                <PageBtn disabled={result.page >= result.lastPage} label="›" onClick={() => setFilters(f => ({ ...f, page: (f.page ?? 1) + 1 }))} />
              </div>
            </div>
          )}
        </div>
      </div>

      <AlerteDeleteDialog
        open={!!delItem} label="la diffusion" itemName={delItem?.name ?? ""}
        loading={deleteMut.isPending} error={delError}
        onConfirm={() => delItem && deleteMut.mutate(delItem.id)}
        onCancel={() => { setDelItem(null); setDelError(""); deleteMut.reset(); }}
      />
    </AppLayout>
  );
}