import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient }              from "@tanstack/react-query";
import { useNavigate }                                        from "react-router-dom";
import { AppLayout }                                          from "@/components/AppLayout";
import { audioAlerteBngrcApi }                               from "@/services/audioAlerteBngrc.api";
import { categorieAlerteBngrcApi }                           from "@/services/categorieAlerteBngrc.api";
import { BngrcDeleteDialog }                                  from "@/components/audio-alerte-bngrc/BngrcDeleteDialog";
import { CanDo }                                              from "@/components/Cando";
import { Search, Plus, Pencil, Trash2, Loader2,ChevronLeft, ChevronRight, Music, Play, Pause, Download, Volume2, X, Radio, Clock, HardDrive, CheckCircle2, AlertCircle, Timer, Layers,} from "lucide-react";
import "@/styles/page.css";
import "@/styles/utilisateurs.css";
import "@/styles/alerte-audio.css";

const PER_PAGE = 10;
const BASE     = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(s?: number) {
  if (!s) return "—";
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function fmtSize(bytes?: number) {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

function fmtTime(s: number) {
  if (!isFinite(s) || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// ── Status ────────────────────────────────────────────────────────────────────

const statusConfig = {
  pending:  { label: "En attente", bg: "#fef3c7", color: "#92400e", Icon: Timer,        iconColor: "#d97706" },
  approved: { label: "Approuvé",   bg: "#d1fae5", color: "#065f46", Icon: CheckCircle2, iconColor: "#059669" },
  rejected: { label: "Rejeté",     bg: "#fee2e2", color: "#991b1b", Icon: AlertCircle,  iconColor: "#dc2626" },
};

function StatusBadge({ status }: { status?: string }) {
  const cfg = statusConfig[status as keyof typeof statusConfig] ?? statusConfig.approved;
  const { Icon, iconColor } = cfg;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
      background: cfg.bg, color: cfg.color, whiteSpace: "nowrap",
    }}>
      <Icon size={11} style={{ color: iconColor }} />
      {cfg.label}
    </span>
  );
}

// ── Waveform ──────────────────────────────────────────────────────────────────

function WaveformBars({ progress, duration, isPlaying }: {
  progress: number; duration: number; isPlaying: boolean;
}) {
  const pct = duration > 0 ? (progress / duration) * 100 : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2, height: 28, flex: 1 }}>
      {Array.from({ length: 32 }).map((_, i) => {
        const h      = 6 + Math.abs(Math.sin(i * 0.9) * 16 + Math.cos(i * 0.5) * 8);
        const filled = pct > 0 && (i / 32) * 100 < pct;
        const active = isPlaying && filled;
        return (
          <div key={i} style={{
            width: 3, height: h, borderRadius: 2, flexShrink: 0,
            background: active ? "#3b82f6" : filled ? "#93c5fd" : "#e2e8f0",
            transition: "background 0.15s",
          }} />
        );
      })}
    </div>
  );
}

// ── Lecteur global fixe en bas ────────────────────────────────────────────────

interface PlayerState {
  audioId: number; name: string; url: string;
  playing: boolean; progress: number; duration: number;
}

function GlobalPlayer({ state, onToggle, onSeek, onClose }: {
  state: PlayerState | null;
  onToggle: () => void;
  onSeek: (t: number) => void;
  onClose: () => void;
}) {
  if (!state) return null;
  const pct = state.duration > 0 ? (state.progress / state.duration) * 100 : 0;
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1000,
      background: "#0f172a", borderTop: "1px solid #1e293b",
      padding: "0 24px", height: 64,
      display: "flex", alignItems: "center", gap: 16,
      boxShadow: "0 -4px 24px rgba(0,0,0,0.25)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: "0 0 260px" }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8, flexShrink: 0,
          background: state.playing ? "#1d4ed8" : "#334155",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "background 0.2s",
        }}>
          <Music size={16} color="#e2e8f0" />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {state.name}
          </div>
          <div style={{ fontSize: 11, color: "#64748b" }}>Audio BNGRC</div>
        </div>
      </div>
      <button onClick={onToggle} style={{
        width: 40, height: 40, borderRadius: "50%",
        background: "#1d4ed8", border: "none", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        {state.playing ? <Pause size={18} color="#fff" /> : <Play size={18} color="#fff" />}
      </button>
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 11, color: "#64748b", flexShrink: 0, width: 36, textAlign: "right" }}>
          {fmtTime(state.progress)}
        </span>
        <div
          style={{ flex: 1, position: "relative", height: 4, background: "#1e293b", borderRadius: 2, cursor: "pointer" }}
          onClick={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            onSeek(((e.clientX - rect.left) / rect.width) * state.duration);
          }}
        >
          <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${pct}%`, background: "#3b82f6", borderRadius: 2 }} />
          <div style={{
            position: "absolute", top: "50%", left: `${pct}%`,
            transform: "translate(-50%,-50%)",
            width: 12, height: 12, borderRadius: "50%",
            background: "#60a5fa", border: "2px solid #1d4ed8",
          }} />
        </div>
        <span style={{ fontSize: 11, color: "#64748b", flexShrink: 0, width: 36 }}>
          {fmtTime(state.duration)}
        </span>
      </div>
      <Volume2 size={16} color="#475569" style={{ flexShrink: 0 }} />
      <button onClick={onClose} style={{
        background: "none", border: "none", cursor: "pointer",
        color: "#475569", padding: 4, borderRadius: 6,
        display: "flex", alignItems: "center",
      }}>
        <X size={16} />
      </button>
    </div>
  );
}

// ── Carte audio BNGRC ─────────────────────────────────────────────────────────

function AudioBngrcCard({
  audio, isActive, isPlaying, progress, duration,
  onPlay, onDownload, onEdit, onDelete,
}: {
  audio:      any;
  isActive:   boolean;
  isPlaying:  boolean;
  progress:   number;
  duration:   number;
  onPlay:     () => void;
  onDownload: () => void;
  onEdit:     () => void;
  onDelete:   () => void;
}) {
  return (
    <div style={{
      background: isActive ? "#f0f7ff" : "#fff",
      border: `1px solid ${isActive ? "#bfdbfe" : "#e8edf2"}`,
      borderRadius: 12, padding: "14px 16px",
      transition: "all 0.15s",
      borderLeft: "3px solid #10b981", // toujours vert — BNGRC = toujours approuvé
    }}>

      {/* Ligne 1 : nom + statut */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8, flexShrink: 0,
            background: isPlaying ? "#dbeafe" : "#f1f5f9",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s",
          }}>
            {isPlaying
              ? <span style={{ fontSize: 9, letterSpacing: 1, color: "#1d4ed8" }}>▶▶</span>
              : <Music size={15} style={{ color: "#64748b" }} />}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {audio.name || audio.originalFilename || `Audio BNGRC #${audio.id}`}
            </div>
            {audio.description && (
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>{audio.description}</div>
            )}
          </div>
        </div>
        <StatusBadge status={audio.status} />
      </div>

      {/* Ligne 2 : waveform + play */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        background: "#f8fafc", borderRadius: 8, padding: "8px 12px", marginBottom: 10,
      }}>
        <button onClick={e => { e.stopPropagation(); onPlay(); }} style={{
          width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
          border: "none", cursor: "pointer",
          background: isPlaying ? "#6366f1" : "#3b82f6",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "background 0.15s",
        }}>
          {isPlaying ? <Pause size={14} color="#fff" /> : <Play size={14} color="#fff" />}
        </button>
        <WaveformBars
          progress={isActive ? progress : 0}
          duration={isActive ? duration : (audio.duration ?? 0)}
          isPlaying={isPlaying}
        />
        <span style={{ fontSize: 11, color: "#94a3b8", flexShrink: 0 }}>
          {isActive ? `${fmtTime(progress)} / ${fmtTime(duration)}` : fmt(audio.duration)}
        </span>
      </div>

      {/* Ligne 3 : métadonnées */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>

        {/* Catégorie BNGRC */}
        {audio.categorie && (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            fontSize: 11, fontWeight: 500, color: "#0891b2", background: "#ecfeff",
            padding: "2px 8px", borderRadius: 10,
          }}>
            <Layers size={9} /> {audio.categorie.name}
          </span>
        )}

        {/* Type / Aléa */}
        {audio.categorie?.type && (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            fontSize: 11, fontWeight: 500, color: "#7c3aed", background: "#f5f3ff",
            padding: "2px 8px", borderRadius: 10,
          }}>
            {audio.categorie.type.name}
          </span>
        )}

        {/* Sirènes */}
        {audio.sirenes?.map((s: any) => (
          <span key={s.id} style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            fontSize: 11, fontWeight: 500, color: "#6366f1", background: "#eef2ff",
            padding: "2px 8px", borderRadius: 10,
          }}>
            <Radio size={9} /> {s.name}
          </span>
        ))}

        {/* Durée */}
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          fontSize: 11, color: "#64748b", background: "#f1f5f9",
          padding: "2px 8px", borderRadius: 10,
        }}>
          <Clock size={9} /> {fmt(audio.duration)}
        </span>

        {/* Taille */}
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          fontSize: 11, color: "#64748b", background: "#f1f5f9",
          padding: "2px 8px", borderRadius: 10,
        }}>
          <HardDrive size={9} /> {fmtSize(audio.fileSize)}
        </span>
      </div>

      {/* Ligne 4 : mobileId + actions */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <code style={{
          fontSize: 10, color: "#94a3b8", background: "#f1f5f9",
          padding: "2px 6px", borderRadius: 4,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          display: "block", maxWidth: 320,
        }}>
          {audio.mobileId}
        </code>

        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button onClick={onDownload} title="Télécharger" style={{
            width: 30, height: 30, borderRadius: 8,
            border: "1px solid #cffafe", background: "#ecfeff",
            color: "#0891b2", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          }}>
            <Download size={13} />
          </button>

          <CanDo permission="alertes:update">
            <button onClick={onEdit} title="Modifier" style={{
              width: 30, height: 30, borderRadius: 8,
              border: "1px solid #e0f2fe", background: "#f0f9ff",
              color: "#0284c7", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}>
              <Pencil size={13} />
            </button>
          </CanDo>

          <CanDo permission="alertes:delete">
            <button onClick={onDelete} title="Supprimer" style={{
              width: 30, height: 30, borderRadius: 8,
              border: "1px solid #fecaca", background: "#fff1f2",
              color: "#e11d48", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}>
              <Trash2 size={13} />
            </button>
          </CanDo>
        </div>
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function AudioAlerteBngrcList() {
  const navigate = useNavigate();
  const qc       = useQueryClient();

  const [search,       setSearch]       = useState("");
  const [filterCat,    setFilterCat]    = useState<number | "">("");
  const [page,         setPage]         = useState(1);
  const [delItem,      setDelItem]      = useState<{ id: number; name: string } | null>(null);
  const [delError,     setDelError]     = useState("");

  // Lecteur
  const audioRef            = useRef<HTMLAudioElement | null>(null);
  const [player, setPlayer] = useState<PlayerState | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (audioRef.current) audioRef.current.src = "";
    };
  }, []);

  // ── Données ───────────────────────────────────────────────────────────────
  const { data: rawCats } = useQuery({
    queryKey: ["categorie-alerte-bngrc"],
    queryFn:  () => categorieAlerteBngrcApi.getAll(),
  });
  const allCats = Array.isArray(rawCats) ? rawCats : (rawCats as any)?.response ?? [];

  const { data: raw, isLoading } = useQuery({
    queryKey: ["audio-alerte-bngrc", filterCat],
    queryFn:  () => filterCat ? audioAlerteBngrcApi.getByCategorie(filterCat) : audioAlerteBngrcApi.getAll(),
  });
  const items: any[] = Array.isArray(raw) ? raw : (raw as any)?.response ?? [];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter(a =>
      (a.name ?? a.originalFilename ?? "").toLowerCase().includes(q) ||
      (a.mobileId ?? "").toLowerCase().includes(q) ||
      (a.categorie?.name ?? "").toLowerCase().includes(q) ||
      (a.sirenes?.some((s: any) => s.name?.toLowerCase().includes(q)) ?? false),
    );
  }, [items, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Compteurs par statut
  const counts = useMemo(() => ({
    approved: items.filter(a => a.status === "approved").length,
    pending:  items.filter(a => a.status === "pending").length,
    rejected: items.filter(a => a.status === "rejected").length,
  }), [items]);

  // ── Lecteur ───────────────────────────────────────────────────────────────
  const playAudio = useCallback((audio: any) => {
    const url = audioAlerteBngrcApi.audioUrl(audio.audio);

    if (player?.audioId === audio.id) {
      if (!audioRef.current) return;
      if (player.playing) {
        audioRef.current.pause();
        setPlayer(p => p ? { ...p, playing: false } : p);
      } else {
        audioRef.current.play().catch(console.error);
        setPlayer(p => p ? { ...p, playing: true } : p);
      }
      return;
    }

    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }

    const el = new Audio(url);
    audioRef.current = el;
    el.addEventListener("loadedmetadata", () => setPlayer(p => p ? { ...p, duration: el.duration } : p));
    el.addEventListener("timeupdate",     () => setPlayer(p => p ? { ...p, progress: el.currentTime } : p));
    el.addEventListener("ended",          () => setPlayer(p => p ? { ...p, playing: false, progress: 0 } : p));

    setPlayer({ audioId: audio.id, name: audio.name || audio.originalFilename || `Audio BNGRC #${audio.id}`, url, playing: true, progress: 0, duration: 0 });
    el.play().catch(() => setPlayer(p => p ? { ...p, playing: false } : p));
  }, [player]);

  const handleToggle = useCallback(() => {
    if (!audioRef.current || !player) return;
    if (player.playing) { audioRef.current.pause(); setPlayer(p => p ? { ...p, playing: false } : p); }
    else                { audioRef.current.play().catch(console.error); setPlayer(p => p ? { ...p, playing: true } : p); }
  }, [player]);

  const handleSeek = useCallback((t: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = t;
    setPlayer(p => p ? { ...p, progress: t } : p);
  }, []);

  const handleClose = useCallback(() => {
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.src = "";
    setPlayer(null);
  }, []);

  function handleDownload(audio: any) {
    const url  = audioAlerteBngrcApi.audioUrl(audio.audio);
    const link = document.createElement("a");
    link.href     = url;
    link.download = audio.originalFilename ?? audio.name ?? `audio-bngrc-${audio.id}`;
    link.click();
  }

  // ── Suppression ───────────────────────────────────────────────────────────
  const deleteMut = useMutation({
    mutationFn: (id: number) => audioAlerteBngrcApi.remove(id),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ["audio-alerte-bngrc"] });
      setDelError("");
      setTimeout(() => setDelItem(null), 300);
    },
    onError: (e: any) => setDelError(e?.response?.data?.message || e?.message || "Erreur suppression"),
  });

  const selectStyle = { fontSize: 13, padding: "6px 10px", borderRadius: 8, border: "1px solid var(--p-border)" };

  // ── Rendu ─────────────────────────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="page-wrap" style={{ paddingBottom: player ? 80 : undefined }}>

        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Audios alertes</h1>
            <p className="page-subtitle">
              {items.length} audio{items.length > 1 ? "s" : ""} enregistré{items.length > 1 ? "s" : ""}
            </p>
          </div>
          <CanDo permission="alertes:create">
            <button className="btn-primary" onClick={() => navigate("/audio-alerte-bngrc/create")}>
              <Plus size={15} /> Nouvel audio alertes
            </button>
          </CanDo>
        </div>

        {/* Compteurs statuts */}
        {items.length > 0 && (
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            {[
              { key: "approved", label: "Approuvés",   bg: "#d1fae5", color: "#065f46", count: counts.approved },
              { key: "pending",  label: "En attente",  bg: "#fef3c7", color: "#92400e", count: counts.pending  },
              { key: "rejected", label: "Rejetés",     bg: "#fee2e2", color: "#991b1b", count: counts.rejected },
            ].map(s => (
              <div key={s.key} style={{
                padding: "8px 14px", borderRadius: 10,
                background: s.bg, color: s.color,
                fontSize: 12, fontWeight: 600,
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <span style={{ fontSize: 16, fontWeight: 700 }}>{s.count}</span>
                {s.label}
              </div>
            ))}
          </div>
        )}

        <div className="panel">
          {/* Filtres + recherche */}
          <div className="panel-header">
            <span className="panel-title">Liste des audios Alertes</span>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <select style={selectStyle} value={filterCat}
                onChange={e => { setFilterCat(e.target.value ? Number(e.target.value) : ""); setPage(1); }}>
                <option value="">Toutes les catégories</option>
                {allCats.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div className="search-wrap">
                <Search size={14} className="search-icon" />
                <input className="search-input"
                  placeholder="Nom, mobile ID, catégorie, sirène…"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }} />
              </div>
            </div>
          </div>

          {/* Liste en cartes */}
          <div style={{ padding: "4px 0" }}>
            {isLoading ? (
              <div className="empty-state"><Loader2 size={24} className="spin" /><p>Chargement…</p></div>
            ) : paginated.length === 0 ? (
              <div className="empty-state"><Music size={28} /><p>Aucun audio BNGRC trouvé</p></div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 16px 12px" }}>
                {paginated.map(a => {
                  const isActive  = player?.audioId === a.id;
                  const isPlaying = isActive && (player?.playing ?? false);
                  return (
                    <AudioBngrcCard
                      key={a.id}
                      audio={a}
                      isActive={isActive}
                      isPlaying={isPlaying}
                      progress={isActive ? (player?.progress ?? 0) : 0}
                      duration={isActive ? (player?.duration ?? 0) : 0}
                      onPlay={() => playAudio(a)}
                      onDownload={() => handleDownload(a)}
                      onEdit={() => navigate(`/audio-alerte-bngrc/${a.id}/edit`)}
                      onDelete={() => { setDelError(""); setDelItem({ id: a.id, name: a.name || a.originalFilename || String(a.id) }); }}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination */}
          {!isLoading && filtered.length > PER_PAGE && (
            <div className="pagination">
              <span className="pagination-info">
                {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} sur {filtered.length}
              </span>
              <div className="pagination-controls">
                <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft size={15} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | "...")[]>((acc, p, i, arr) => {
                    if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                    acc.push(p); return acc;
                  }, [])
                  .map((p, i) => p === "..."
                    ? <span key={`d${i}`} className="page-dots">…</span>
                    : <button key={p} className={`page-btn${page === p ? " active" : ""}`} onClick={() => setPage(p as number)}>{p}</button>
                  )}
                <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lecteur global fixe */}
      <GlobalPlayer
        state={player}
        onToggle={handleToggle}
        onSeek={handleSeek}
        onClose={handleClose}
      />

      <BngrcDeleteDialog
        open={!!delItem} label="l'audio BNGRC"
        itemName={delItem?.name ?? ""}
        loading={deleteMut.isPending} error={delError}
        onConfirm={() => delItem && deleteMut.mutate(delItem.id)}
        onCancel={() => { setDelItem(null); setDelError(""); deleteMut.reset(); }}
      />
    </AppLayout>
  );
}