import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout }             from "@/components/AppLayout";
import { notificationsBngrcApi } from "@/services/notificationBngrc.api";
import { NotificationBngrc }      from "@/types/notificationBngrc";
import { audioAlerteBngrcApi }   from "@/services/audioAlerteBngrc.api";
import {
  Search, Filter, X, ChevronLeft, ChevronRight, ChevronDown,
  Bell, Calendar, MapPin, Radio, Layers, Tag, AlertTriangle,
  Clock, CheckCircle, XCircle, HelpCircle, RotateCcw,
} from "lucide-react";
import "@/styles/page.css";
import "@/styles/utilisateurs.css";

// ─── helpers ──────────────────────────────────────────────────────────────────
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

function fmtDateTime(d?: string | Date | null) {
  if (!d) return "—";
  return new Date(d as string).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

function fmtDate(d?: string | Date | null) {
  if (!d) return "—";
  return new Date(d as string).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtTime(d?: string | Date | null) {
  if (!d) return "—";
  return new Date(d as string).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function timeAgo(d: string | Date) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)  return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${Math.floor(h / 24)}j`;
}

const PER_PAGE = 20;


// ─── Config statuts ───────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; color: string; bg: string; Icon: any }> = {
  sent:     { label: "Envoyé",     color: "#059669", bg: "#d1fae5", Icon: CheckCircle },
  delivery: { label: "Livré",      color: "#0891b2", bg: "#e0f2fe", Icon: CheckCircle },
  pending:  { label: "En attente", color: "#d97706", bg: "#fef3c7", Icon: Clock       },
  failed:   { label: "Échoué",     color: "#dc2626", bg: "#fee2e2", Icon: XCircle     },
  unknown:  { label: "Inconnu",    color: "#6b7280", bg: "#f3f4f6", Icon: HelpCircle  },
};

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

// ─── Mini player audio (même logique que notifications) ───────────────────────
function AudioMiniPlayer({ audio }: { audio: NonNullable<NotificationBngrc["audioBngrc"]> }) {
  const [playing,  setPlaying]  = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(audio.duration ?? 0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => () => {
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.src = "";
  }, []);

  function togglePlay(e: React.MouseEvent) {
    e.stopPropagation();
    if (!audioRef.current) {
      const url = audioAlerteBngrcApi.audioUrl(audio.audio);
      const el  = new Audio(url);
      audioRef.current = el;
      el.addEventListener("loadedmetadata", () => setDuration(el.duration));
      el.addEventListener("timeupdate",     () => setProgress(el.currentTime));
      el.addEventListener("ended",          () => { setPlaying(false); setProgress(0); });
    }
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else         { audioRef.current.play().catch(console.error); setPlaying(true); }
  }

  function fmtT(s: number) {
    if (!isFinite(s) || isNaN(s)) return "0:00";
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  }

  const pct = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: playing ? "#eff6ff" : "#f1f5f9",
      border: `1px solid ${playing ? "#bfdbfe" : "#e2e8f0"}`,
      borderRadius: 7, padding: "4px 8px",
      transition: "all 0.2s", maxWidth: 220,
    }}>
      <button onClick={togglePlay} style={{
        width: 22, height: 22, borderRadius: "50%", flexShrink: 0, border: "none",
        cursor: "pointer",
        background: playing ? "#3b82f6" : "#cbd5e1",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "background 0.15s",
      }}>
        {playing
          ? <svg width="8" height="8" viewBox="0 0 10 10" fill="#fff"><rect x="1" y="1" width="3" height="8" rx="1"/><rect x="6" y="1" width="3" height="8" rx="1"/></svg>
          : <svg width="8" height="8" viewBox="0 0 10 10" fill="#475569"><polygon points="2,1 9,5 2,9"/></svg>
        }
      </button>
      <span style={{ fontSize: 10, color: "#475569", fontWeight: 500, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
        {audio.name || (audio as any).originalFilename || `Audio #${audio.id}`}
      </span>
      <span style={{ fontSize: 9, color: "#94a3b8", flexShrink: 0 }}>{fmtT(progress)}/{fmtT(duration)}</span>
      <div
        style={{ width: 50, height: 3, background: "#e2e8f0", borderRadius: 2, flexShrink: 0, cursor: "pointer" }}
        onClick={e => {
          e.stopPropagation();
          if (!audioRef.current || !duration) return;
          const rect  = e.currentTarget.getBoundingClientRect();
          const ratio = (e.clientX - rect.left) / rect.width;
          audioRef.current.currentTime = ratio * duration;
          setProgress(ratio * duration);
        }}
      >
        <div style={{ width: `${pct}%`, height: "100%", background: "#3b82f6", borderRadius: 2, transition: "width 0.1s linear" }} />
      </div>
    </div>
  );
}

// ─── Badge aléa ───────────────────────────────────────────────────────────────
function AleaBadge({ label }: { label: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 11, fontWeight: 700,
      color: "#dc2626", background: "#fef2f2",
      border: "1px solid #fecaca",
      padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap",
    }}>
      🌀 {label}
    </span>
  );
}

// ─── Badge catégorie ──────────────────────────────────────────────────────────
function CategBadge({ label }: { label: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 11, fontWeight: 500,
      color: "#7c3aed", background: "#f5f3ff",
      border: "1px solid #ddd6fe",
      padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap",
    }}>
      <Tag size={9} /> {label}
    </span>
  );
}

// ─── Ligne expandée ───────────────────────────────────────────────────────────
function ExpandedRow({ n }: { n: any }) {
  const typeName  = n.categorieAlerteBngrc?.type?.name  ?? "—";
  const categName = n.categorieAlerteBngrc?.name        ?? "—";
  const region    = n.sirene?.village?.region?.name     ?? n.sirene?.village?.district?.region?.name ?? "—";
  const district  = n.sirene?.village?.district?.name   ?? "—";
  const commune   = n.sirene?.village?.commune?.name    ?? "—";
  const fokontany = n.sirene?.village?.fokontany?.name  ?? "—";
  const village   = n.sirene?.village?.name             ?? "—";
  const sender    = n.user ? (`${n.user.first_name ?? ""} ${n.user.last_name ?? ""}`.trim() || "—") : "—";

  const block = (k: string, v: string) => (
    <div style={{ background: "#f8fafc", borderRadius: 8, padding: "8px 12px" }}>
      <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>{k}</div>
      <div style={{ fontSize: 12, color: "#1e293b", fontWeight: 500 }}>{v}</div>
    </div>
  );

  return (
    <tr>
      <td colSpan={7} style={{ padding: 0, background: "#fafbfc" }}>
        <div style={{ padding: "14px 20px", borderTop: "1px solid #f1f5f9" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8, marginBottom: n.audioBngrc ? 10 : 0 }}>
            {block("Aléa",        typeName)}
            {block("Catégorie",   categName)}
            {block("Région",      region)}
            {block("District",    district)}
            {block("Commune",     commune)}
            {block("Fokontany",   fokontany)}
            {block("Village",     village)}
            {block("Envoyé par",  sender)}
            {block("Envoyé le",   fmtDateTime(n.sendingTime))}
            {n.sirene && block("Sirène", n.sirene.name ?? n.sirene.imei ?? `#${n.sireneId}`)}
          </div>
          {n.audioBngrc && (
            <div style={{ marginTop: 4 }}>
              <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 }}>Audio diffusé</div>
              <AudioMiniPlayer audio={n.audioBngrc} />
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── FilterSelect ─────────────────────────────────────────────────────────────
function FilterSelect({ label, value, options, onChange, disabled = false }: {
  label: string; value: string;
  options: { id: string | number; name: string }[];
  onChange: (v: string) => void; disabled?: boolean;
}) {
  return (
    <div className="sirene-field">
      <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
        style={{ opacity: disabled ? 0.45 : 1 }}>
        <option value="">— Tous —</option>
        {options.map(o => <option key={o.id} value={String(o.id)}>{o.name}</option>)}
      </select>
    </div>
  );
}

// ─── FilterTag ────────────────────────────────────────────────────────────────
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

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AlerteStory() {
  const [page,        setPage]        = useState(1);
  const [search,      setSearch]      = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [expanded,    setExpanded]    = useState<Set<number>>(new Set());

  // Filtres date
  const [fStartDate, setFStartDate]   = useState("");
  const [fEndDate,   setFEndDate]     = useState("");

  // Filtres géographiques (construits depuis les données)
  const [fRegion,    setFRegion]    = useState("");
  const [fDistrict,  setFDistrict]  = useState("");
  const [fCommune,   setFCommune]   = useState("");

  // Filtre aléa (TypeAlerteBngrc)
  const [fType,      setFType]      = useState("");

  // ── Données ────────────────────────────────────────────────────────────────
  // On récupère tout via getAll avec les filtres actifs
  const apiFilters = useMemo(() => ({
    startDate: fStartDate || undefined,
    endDate:   fEndDate   || undefined,
    status:    "sent" as const,
    page,
    limit: PER_PAGE,
  }), [fStartDate, fEndDate, page]);

  const { data: raw, isLoading } = useQuery({
    queryKey: ["historique-bngrc", apiFilters],
    queryFn:  () => notificationsBngrcApi.getAll(apiFilters),
  });

  // Normalise la réponse (paginée ou tableau brut)
  const result = useMemo(() => {
    if (!raw) return { data: [], total: 0, lastPage: 1, page: 1 };
    if ((raw as any)?.data && Array.isArray((raw as any).data)) return raw as any;
    const arr = toArr<any>(raw);
    return { data: arr, total: arr.length, lastPage: 1, page: 1 };
  }, [raw]);

  const items: any[] = result.data ?? [];

  // ── Listes pour filtres geo & aléa (extraites des données reçues) ──────────
  const geoIndex = useMemo(() => {
    const regions:   Map<string, string> = new Map();
    const districts: Map<string, { name: string; regionId: string }> = new Map();
    const communes:  Map<string, { name: string; districtId: string }> = new Map();
    const types:     Map<string, string> = new Map();

    items.forEach((n: any) => {
      const v = n.sirene?.village;
      if (v?.region)   regions.set(String(v.region.id),     v.region.name);
      if (v?.district) districts.set(String(v.district.id), { name: v.district.name, regionId: String(v.region?.id ?? "") });
      if (v?.commune)  communes.set(String(v.commune.id),   { name: v.commune.name,  districtId: String(v.district?.id ?? "") });

      const typeName = n.categorieAlerteBngrc?.type?.name;
      const typeId   = String(n.categorieAlerteBngrc?.type?.id ?? "");
      if (typeName && typeId) types.set(typeId, typeName);
    });

    return { regions, districts, communes, types };
  }, [items]);

  const regionOpts   = Array.from(geoIndex.regions.entries()).map(([id, name]) => ({ id, name }));
  const districtOpts = Array.from(geoIndex.districts.entries())
    .filter(([, d]) => !fRegion || d.regionId === fRegion)
    .map(([id, d]) => ({ id, name: d.name }));
  const communeOpts  = Array.from(geoIndex.communes.entries())
    .filter(([, c]) => !fDistrict || c.districtId === fDistrict)
    .map(([id, c]) => ({ id, name: c.name }));
  const typeOpts     = Array.from(geoIndex.types.entries()).map(([id, name]) => ({ id, name }));

  // ── Filtrage client-side (geo + type + search) ────────────────────────────
  const filtered = useMemo(() => {
    return items.filter((n: any) => {
      const v = n.sirene?.village;
      if (fRegion   && String(v?.region?.id   ?? "") !== fRegion)   return false;
      if (fDistrict && String(v?.district?.id ?? "") !== fDistrict) return false;
      if (fCommune  && String(v?.commune?.id  ?? "") !== fCommune)  return false;
      if (fType     && String(n.categorieAlerteBngrc?.type?.id ?? "") !== fType) return false;

      if (search) {
        const q = search.toLowerCase();
        const typeName  = n.categorieAlerteBngrc?.type?.name?.toLowerCase() ?? "";
        const catName   = n.categorieAlerteBngrc?.name?.toLowerCase() ?? "";
        const sirenName = (n.sirene?.name ?? n.sirene?.imei ?? "").toLowerCase();
        const regionN   = (v?.region?.name   ?? "").toLowerCase();
        const districtN = (v?.district?.name ?? "").toLowerCase();
        const communeN  = (v?.commune?.name  ?? "").toLowerCase();
        const sender    = n.user ? `${n.user.first_name ?? ""} ${n.user.last_name ?? ""}`.toLowerCase() : "";
        if (![typeName, catName, sirenName, regionN, districtN, communeN, sender].some(s => s.includes(q))) return false;
      }
      return true;
    });
  }, [items, fRegion, fDistrict, fCommune, fType, search]);

  const activeFilterCount = [fRegion, fDistrict, fCommune, fType, fStartDate, fEndDate].filter(Boolean).length;

  function resetFilters() {
    setFRegion(""); setFDistrict(""); setFCommune("");
    setFType(""); setFStartDate(""); setFEndDate("");
    setPage(1); setShowFilters(false);
  }

  function toggleRow(id: number) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <AppLayout>
      <div className="page-wrap">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="page-header">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Historique des alertes </h1>
            <p className="page-subtitle">
              Toutes les alertes envoyées via le réseau de sirènes
            </p>
          </div>
        </div>

        <div className="panel">

          {/* ── Barre recherche + filtres ─────────────────────────────────── */}
          <div style={{ display: "flex", gap: 10, padding: "14px 16px", borderBottom: "1px solid #f1f5f9", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
              <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Aléa, sirène, zone, expéditeur…"
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
              {filtered.length} alerte{filtered.length > 1 ? "s" : ""}
              {result.total > items.length && ` (sur ${result.total})`}
            </span>
          </div>

          {/* ── Panneau filtres ───────────────────────────────────────────── */}
          {showFilters && (
            <div style={{ padding: "16px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>

                {/* Aléa (TypeAlerteBngrc) */}
                <FilterSelect
                  label="Aléa" value={fType}
                  options={typeOpts}
                  onChange={v => { setFType(v); setPage(1); }}
                />

                {/* Zone */}
                <FilterSelect
                  label="Région" value={fRegion}
                  options={regionOpts}
                  onChange={v => { setFRegion(v); setFDistrict(""); setFCommune(""); setPage(1); }}
                />
                <FilterSelect
                  label="District" value={fDistrict}
                  options={districtOpts}
                  onChange={v => { setFDistrict(v); setFCommune(""); setPage(1); }}
                  disabled={!fRegion}
                />
                <FilterSelect
                  label="Commune" value={fCommune}
                  options={communeOpts}
                  onChange={v => { setFCommune(v); setPage(1); }}
                  disabled={!fDistrict}
                />

                {/* Dates */}
                <div className="sirene-field">
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Date début</label>
                  <input type="date" value={fStartDate}
                    onChange={e => { setFStartDate(e.target.value); setPage(1); }} />
                </div>
                <div className="sirene-field">
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Date fin</label>
                  <input type="date" value={fEndDate}
                    onChange={e => { setFEndDate(e.target.value); setPage(1); }} />
                </div>

              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
                <button onClick={resetFilters} style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "7px 14px", borderRadius: 8,
                  border: "1px solid #e2e8f0", background: "#fff",
                  fontSize: 13, color: "#475569", cursor: "pointer",
                }}>
                  <RotateCcw size={12} /> Réinitialiser
                </button>
              </div>
            </div>
          )}

          {/* ── Tags filtres actifs ───────────────────────────────────────── */}
          {activeFilterCount > 0 && (
            <div style={{ display: "flex", gap: 6, padding: "8px 16px", flexWrap: "wrap", borderBottom: "1px solid #f1f5f9" }}>
              {fType     && <FilterTag label={`Aléa : ${typeOpts.find(o => o.id === fType)?.name}`}         onRemove={() => { setFType("");     setPage(1); }} />}
              {fRegion   && <FilterTag label={`Région : ${regionOpts.find(o => o.id === fRegion)?.name}`}   onRemove={() => { setFRegion("");   setFDistrict(""); setFCommune(""); setPage(1); }} />}
              {fDistrict && <FilterTag label={`District : ${districtOpts.find(o => o.id === fDistrict)?.name}`} onRemove={() => { setFDistrict(""); setFCommune(""); setPage(1); }} />}
              {fCommune  && <FilterTag label={`Commune : ${communeOpts.find(o => o.id === fCommune)?.name}`} onRemove={() => { setFCommune(""); setPage(1); }} />}
              {fStartDate && <FilterTag label={`Depuis ${fmtDate(fStartDate)}`} onRemove={() => { setFStartDate(""); setPage(1); }} />}
              {fEndDate   && <FilterTag label={`Jusqu'au ${fmtDate(fEndDate)}`} onRemove={() => { setFEndDate("");   setPage(1); }} />}
            </div>
          )}

          {/* ── Tableau ───────────────────────────────────────────────────── */}
          <div style={{ overflowX: "auto" }}>
            {isLoading ? (
              <div style={{ padding: "48px 0", textAlign: "center", color: "#94a3b8" }}>
                <div style={{ width: 32, height: 32, border: "3px solid #e2e8f0", borderTop: "3px solid #3b82f6", borderRadius: "50%", animation: "spin 0.9s linear infinite", margin: "0 auto 10px" }} />
                <p style={{ fontSize: 13 }}>Chargement…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: "48px 0", textAlign: "center", color: "#94a3b8" }}>
                <Bell size={32} style={{ margin: "0 auto 12px", opacity: 0.3, display: "block" }} />
                <p style={{ fontSize: 13 }}>Aucune alerte trouvée</p>
              </div>
            ) : (
              <table className="data-table" style={{ minWidth: 900 }}>
                <thead>
                  <tr>
                    <th style={{ width: 32 }}></th>
                    <th>Statut</th>
                    <th>Aléa / Catégorie</th>
                    <th>Sirène</th>
                    <th>Région</th>
                    <th>District</th>
                    <th>Commune</th>
                    <th>Date</th>
                    <th>Envoyé par</th>
                    <th>Audio</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((n: any) => {
                    const isOpen    = expanded.has(n.id);
                    const typeName  = n.categorieAlerteBngrc?.type?.name  ?? "—";
                    const categName = n.categorieAlerteBngrc?.name        ?? "—";
                    const region    = n.sirene?.village?.region?.name     ?? n.sirene?.village?.district?.region?.name ?? "—";
                    const district  = n.sirene?.village?.district?.name   ?? "—";
                    const commune   = n.sirene?.village?.commune?.name    ?? "—";
                    const sirenName = n.sirene?.name ?? n.sirene?.imei    ?? `#${n.sireneId}`;
                    const sender    = n.user
                      ? (`${n.user.first_name ?? ""} ${n.user.last_name ?? ""}`.trim() || "—")
                      : "—";

                    return [
                      <tr
                        key={n.id}
                        style={{ cursor: "pointer", background: isOpen ? "#fafbff" : undefined }}
                        onClick={() => toggleRow(n.id)}
                        onMouseEnter={e => !isOpen && ((e.currentTarget as HTMLElement).style.background = "#f8fafc")}
                        onMouseLeave={e => !isOpen && ((e.currentTarget as HTMLElement).style.background = "")}
                      >
                        {/* Expand toggle */}
                        <td style={{ textAlign: "center", paddingLeft: 12 }}>
                          <ChevronDown
                            size={14}
                            color="#94a3b8"
                            style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
                          />
                        </td>

                        {/* Statut */}
                        <td><StatusBadge status={n.status} /></td>

                        {/* Aléa + catégorie */}
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <AleaBadge label={typeName} />
                            {categName !== "—" && <CategBadge label={categName} />}
                          </div>
                        </td>

                        {/* Sirène */}
                        <td>
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            fontSize: 12, fontWeight: 500, color: "#6366f1",
                            background: "#eef2ff", padding: "2px 8px", borderRadius: 20,
                          }}>
                            <Radio size={9} /> {sirenName}
                          </span>
                        </td>

                        {/* Zone */}
                        <td style={{ fontSize: 12, color: "#374151" }}>{region}</td>
                        <td style={{ fontSize: 12, color: "#374151" }}>{district}</td>
                        <td style={{ fontSize: 12, color: "#374151" }}>{commune}</td>

                        {/* Date */}
                        <td>
                          <div style={{ fontSize: 12, color: "#374151" }}>{fmtDate(n.sendingTime)}</div>
                          <div style={{ fontSize: 10, color: "#94a3b8" }}>{fmtTime(n.sendingTime)}</div>
                        </td>

                        {/* Expéditeur */}
                        <td style={{ fontSize: 12, color: "#374151" }}>{sender}</td>

                        {/* Audio */}
                        <td onClick={e => e.stopPropagation()}>
                          {n.audioBngrc
                            ? <AudioMiniPlayer audio={n.audioBngrc} />
                            : <span style={{ fontSize: 11, color: "#cbd5e1" }}>—</span>
                          }
                        </td>
                      </tr>,

                      isOpen && <ExpandedRow key={`exp-${n.id}`} n={n} />,
                    ];
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* ── Pagination ────────────────────────────────────────────────── */}
          {!isLoading && result.lastPage > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", borderTop: "1px solid #f1f5f9" }}>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>
                Page {result.page} / {result.lastPage} — {result.total} alertes
              </span>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    border: "1px solid #e2e8f0", background: page <= 1 ? "#f8fafc" : "#fff",
                    color: page <= 1 ? "#cbd5e1" : "#475569",
                    cursor: page <= 1 ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <ChevronLeft size={14} />
                </button>

                {Array.from({ length: result.lastPage }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === result.lastPage || Math.abs(p - page) <= 1)
                  .reduce<(number | "...")[]>((acc, p, i, arr) => {
                    if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                    acc.push(p); return acc;
                  }, [])
                  .map((p, i) => p === "..."
                    ? <span key={`d${i}`} style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#94a3b8" }}>…</span>
                    : (
                      <button key={p}
                        onClick={() => setPage(p as number)}
                        style={{
                          width: 32, height: 32, borderRadius: 8,
                          border: `1px solid ${page === p ? "#1d4ed8" : "#e2e8f0"}`,
                          background: page === p ? "#1d4ed8" : "#fff",
                          color: page === p ? "#fff" : "#475569",
                          cursor: "pointer", fontSize: 13, fontWeight: 600,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        {p}
                      </button>
                    )
                  )
                }

                <button
                  disabled={page >= result.lastPage}
                  onClick={() => setPage(p => p + 1)}
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    border: "1px solid #e2e8f0", background: page >= result.lastPage ? "#f8fafc" : "#fff",
                    color: page >= result.lastPage ? "#cbd5e1" : "#475569",
                    cursor: page >= result.lastPage ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </AppLayout>
  );
}