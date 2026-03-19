import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { alerteAudiosApi } from "@/services/alerteaudio.api";
import { AlerteAudio } from "@/types/alerteAudio";
import { AlerteDeleteDialog } from "@/components/alerte/Alertedeletedialog";
import {
  Search, Plus, Pencil, Trash2, Loader2,
  ChevronLeft, ChevronRight, Music, Play, Pause, Download,
  Volume2, X, SkipBack,
} from "lucide-react";
import "@/styles/page.css";
import "@/styles/utilisateurs.css";
import "@/styles/alerte-audio.css";
import { CanDo } from "@/components/Cando";

const PER_PAGE = 10;

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Lecteur global (barre fixe en bas) ───────────────────────────────────────

interface PlayerState {
  audioId:  number;
  name:     string;
  url:      string;
  playing:  boolean;
  progress: number;
  duration: number;
}

interface GlobalPlayerProps {
  state:    PlayerState | null;
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
  onToggle: () => void;
  onSeek:   (t: number) => void;
  onClose:  () => void;
}

function GlobalPlayer({ state, audioRef: _, onToggle, onSeek, onClose }: GlobalPlayerProps) {
  if (!state) return null;

  const pct = state.duration > 0 ? (state.progress / state.duration) * 100 : 0;

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1000,
      background: "#0f172a",
      borderTop: "1px solid #1e293b",
      padding: "0 24px",
      height: 64,
      display: "flex", alignItems: "center", gap: 16,
      boxShadow: "0 -4px 24px rgba(0,0,0,0.25)",
    }}>

      {/* Icône + nom */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: "0 0 260px" }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: state.playing ? "#1d4ed8" : "#334155",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, transition: "background 0.2s",
        }}>
          <Music size={16} color="#e2e8f0" />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {state.name}
          </div>
          <div style={{ fontSize: 11, color: "#64748b" }}>Audio d'alerte</div>
        </div>
      </div>

      {/* Bouton play/pause */}
      <button onClick={onToggle} style={{
        width: 40, height: 40, borderRadius: "50%",
        background: "#1d4ed8", border: "none", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, transition: "background 0.15s",
      }}
        onMouseEnter={e => (e.currentTarget.style.background = "#2563eb")}
        onMouseLeave={e => (e.currentTarget.style.background = "#1d4ed8")}
      >
        {state.playing
          ? <Pause size={18} color="#fff" />
          : <Play  size={18} color="#fff" />}
      </button>

      {/* Temps + barre de progression */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 11, color: "#64748b", flexShrink: 0, width: 36, textAlign: "right" }}>
          {fmtTime(state.progress)}
        </span>
        <div style={{ flex: 1, position: "relative", height: 4, background: "#1e293b", borderRadius: 2, cursor: "pointer" }}
          onClick={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = (e.clientX - rect.left) / rect.width;
            onSeek(ratio * state.duration);
          }}>
          <div style={{
            position: "absolute", left: 0, top: 0, height: "100%",
            width: `${pct}%`, background: "#3b82f6", borderRadius: 2,
            transition: "width 0.1s linear",
          }} />
          {/* Poignée */}
          <div style={{
            position: "absolute", top: "50%", left: `${pct}%`,
            transform: "translate(-50%, -50%)",
            width: 12, height: 12, borderRadius: "50%",
            background: "#60a5fa", border: "2px solid #1d4ed8",
            transition: "left 0.1s linear",
          }} />
        </div>
        <span style={{ fontSize: 11, color: "#64748b", flexShrink: 0, width: 36 }}>
          {fmtTime(state.duration)}
        </span>
      </div>

      {/* Volume icône décoratif */}
      <Volume2 size={16} color="#475569" style={{ flexShrink: 0 }} />

      {/* Fermer */}
      <button onClick={onClose} style={{
        background: "none", border: "none", cursor: "pointer",
        color: "#475569", padding: 4, borderRadius: 6,
        display: "flex", alignItems: "center",
        transition: "color 0.15s",
      }}
        onMouseEnter={e => (e.currentTarget.style.color = "#f1f5f9")}
        onMouseLeave={e => (e.currentTarget.style.color = "#475569")}
        title="Fermer le lecteur"
      >
        <X size={16} />
      </button>
    </div>
  );
}

// ─── Bouton play dans le tableau ──────────────────────────────────────────────

function PlayButton({ audioId, playing, onClick }: { audioId: number; playing: boolean; onClick: () => void }) {
  return (
    <button
      className="mini-player-btn"
      onClick={e => { e.stopPropagation(); onClick(); }}
      title={playing ? "Pause" : "Écouter"}
      style={{
        display: "flex", alignItems: "center", gap: 5,
        padding: "5px 10px", borderRadius: 6, border: "none", cursor: "pointer",
        fontSize: 12, fontWeight: 500,
        background: playing ? "#dbeafe" : "#f1f5f9",
        color:      playing ? "#1d4ed8" : "#475569",
        transition: "all 0.15s",
      }}
    >
      {playing ? <Pause size={13} /> : <Play size={13} />}
      {playing ? "Pause" : "Écouter"}
    </button>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function AlerteAudioList() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page,   setPage]   = useState(1);
  const [delItem,  setDelItem]  = useState<{ id: number; name: string } | null>(null);
  const [delError, setDelError] = useState("");

  // ── Lecteur global ─────────────────────────────────────────────────
  const audioRef               = useRef<HTMLAudioElement | null>(null);
  const [player, setPlayer]    = useState<PlayerState | null>(null);

  // Nettoyage à démontage
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (audioRef.current) audioRef.current.src = "";
    };
  }, []);

  const playAudio = useCallback((audio: AlerteAudio) => {
    const url = alerteAudiosApi.audioUrl(audio.audio);

    console.log('audio_url',url);
    // Même audio → toggle play/pause
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

    // Nouvel audio → arrêter l'ancien
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current.onended     = null;
      audioRef.current.ontimeupdate = null;
      audioRef.current.onloadedmetadata = null;
    }

    const el = new Audio(url);
    audioRef.current = el;

    el.addEventListener("loadedmetadata", () => {
      setPlayer(p => p ? { ...p, duration: el.duration } : p);
    });

    el.addEventListener("timeupdate", () => {
      setPlayer(p => p ? { ...p, progress: el.currentTime } : p);
    });

    el.addEventListener("ended", () => {
      setPlayer(p => p ? { ...p, playing: false, progress: 0 } : p);
    });

    el.addEventListener("error", (e) => {
      console.error("Erreur audio:", e, url);
    });

    setPlayer({
      audioId:  audio.id,
      name:     audio.name || audio.originalFilename || `Audio #${audio.id}`,
      url,
      playing:  true,
      progress: 0,
      duration: 0,
    });

    el.play().catch(err => {
      console.error("play() rejected:", err);
      setPlayer(p => p ? { ...p, playing: false } : p);
    });
  }, [player]);

  const handleToggle = useCallback(() => {
    if (!audioRef.current || !player) return;
    if (player.playing) {
      audioRef.current.pause();
      setPlayer(p => p ? { ...p, playing: false } : p);
    } else {
      audioRef.current.play().catch(console.error);
      setPlayer(p => p ? { ...p, playing: true } : p);
    }
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

  // ── Données ────────────────────────────────────────────────────────
  const { data: raw, isLoading } = useQuery({
    queryKey: ["alerte-audios"],
    queryFn:  () => alerteAudiosApi.getAll(),
  });
  const items: AlerteAudio[] = Array.isArray(raw) ? raw : (raw as any)?.response ?? [];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter(a =>
      (a.name || "").toLowerCase().includes(q) ||
      a.mobileId.toLowerCase().includes(q) ||
      (a.sousCategorie?.name || "").toLowerCase().includes(q)
    );
  }, [items, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const deleteMut = useMutation({
    mutationFn: (id: number) => alerteAudiosApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alerte-audios"] });
      setDelError("");
      setTimeout(() => setDelItem(null), 300);
    },
    onError: (e: any) => setDelError(e?.response?.data?.message || e?.message || "Erreur suppression"),
  });

  function handleDownload(audio: AlerteAudio) {
    const url  = alerteAudiosApi.audioUrl(audio.audio);
    const link = document.createElement("a");
    link.href      = url;
    link.download  = audio.originalFilename ?? audio.name ?? `audio-${audio.id}`;
    link.click();
  }

  // ── Rendu ──────────────────────────────────────────────────────────
  return (
    <AppLayout>
      {/* padding bottom pour ne pas masquer la dernière ligne avec la barre lecteur */}
      <div className="page-wrap" style={{ paddingBottom: player ? 80 : undefined }}>
        <div className="page-header">
          <div>
            <h1 className="page-title">Audios d'alerte</h1>
            <p className="page-subtitle">{items.length} audio{items.length > 1 ? "s" : ""} enregistré{items.length > 1 ? "s" : ""}</p>
          </div>
          <CanDo permission="alerte-audios:create">
            <button className="btn-primary" onClick={() => navigate("/alerte-audios/create")}>
              <Plus size={15} /> Nouvel audio
            </button>
          </CanDo>
        </div>

        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Liste des audios</span>
            <div className="search-wrap">
              <Search size={14} className="search-icon" />
              <input className="search-input" placeholder="Nom, mobile ID, sous-catégorie…"
                value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            {isLoading ? (
              <div className="empty-state"><Loader2 size={24} className="spin" /><p>Chargement…</p></div>
            ) : paginated.length === 0 ? (
              <div className="empty-state"><Music size={28} /><p>Aucun audio trouvé</p></div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Audio</th>
                    <th>Mobile ID</th>
                    <th>Sous-catégorie</th>
                    <th>Durée</th>
                    <th>Taille</th>
                    <th>Écoute</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(a => {
                    const isPlaying = player?.audioId === a.id && player.playing;
                    const isActive  = player?.audioId === a.id;
                    return (
                      <tr key={a.id} style={{
                        background: isActive ? "#eff6ff" : undefined,
                        transition: "background 0.15s",
                      }}>
                        <td>
                          <div className="user-cell">
                            <div className="role-avatar" style={{
                              background: isPlaying ? "#dbeafe" : undefined,
                              color:      isPlaying ? "#1d4ed8" : undefined,
                              transition: "all 0.2s",
                            }}>
                              {isPlaying
                                ? <span style={{ fontSize: 10, letterSpacing: 1 }}>▶▶</span>
                                : <Music size={14} />}
                            </div>
                            <div>
                              <span className="user-cell-name">{a.name || a.originalFilename || `Audio #${a.id}`}</span>
                              {a.description && (
                                <p style={{ fontSize: "0.73rem", color: "var(--p-text-3)", margin: 0 }}>{a.description}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td><span className="cell-imei">{a.mobileId}</span></td>
                        <td>
                          {a.sousCategorie
                            ? <span className="perm-tag">{a.sousCategorie.name}</span>
                            : <span style={{ color: "var(--p-text-3)" }}>—</span>}
                        </td>
                        <td><span style={{ fontSize: "0.82rem" }}>{fmt(a.duration)}</span></td>
                        <td><span style={{ fontSize: "0.82rem" }}>{fmtSize(a.fileSize)}</span></td>
                        <td>
                          <PlayButton
                            audioId={a.id}
                            playing={isPlaying}
                            onClick={() => playAudio(a)}
                          />
                        </td>
                        <td>
                          <div className="action-btns">
                            <button className="action-btn" title="Télécharger" onClick={() => handleDownload(a)}
                              style={{ color: "#0891b2", border: "1px solid #cffafe", background: "#ecfeff" }}>
                              <Download size={14} />
                            </button>
                            <CanDo permission="alerte-audios:update">
                              <button className="action-btn edit" title="Modifier"
                                onClick={() => navigate(`/alerte-audios/${a.id}/edit`)}>
                                <Pencil size={14} />
                              </button>
                            </CanDo>
                            <CanDo permission="alerte-audios:delete">
                              <button className="action-btn delete" title="Supprimer"
                                onClick={() => { setDelError(""); setDelItem({ id: a.id, name: a.name || a.originalFilename || `Audio #${a.id}` }); }}>
                                <Trash2 size={14} />
                              </button>
                            </CanDo>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

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
                    acc.push(p);
                    return acc;
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

      {/* ── Lecteur global fixe en bas ── */}
      <GlobalPlayer
        state={player}
        audioRef={audioRef}
        onToggle={handleToggle}
        onSeek={handleSeek}
        onClose={handleClose}
      />

      <AlerteDeleteDialog
        open={!!delItem}
        label="l'audio"
        itemName={delItem?.name ?? ""}
        loading={deleteMut.isPending}
        error={delError}
        onConfirm={() => delItem && deleteMut.mutate(delItem.id)}
        onCancel={() => { setDelItem(null); setDelError(""); deleteMut.reset(); }}
      />
    </AppLayout>
  );
}