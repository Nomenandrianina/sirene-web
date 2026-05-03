// src/pages/alerte-audio/AlerteAudioReview.tsx
import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { alerteAudiosApi } from "@/services/alerteaudio.api";
import {
  ChevronLeft, Loader2, Play, Pause, Check, X,
  Music, FileAudio, Clock, HardDrive, Tag, User, Building2,
} from "lucide-react";

function fmt(s?: number | null) {
  if (!s) return "—";
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function fmtSize(bytes?: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

function fmtTime(s: number) {
  if (!isFinite(s) || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

const statusConfig = {
  pending:  { label: "En attente",  bg: "#fef3c7", color: "#92400e", dot: "#f59e0b" },
  approved: { label: "Validé",      bg: "#d1fae5", color: "#065f46", dot: "#10b981" },
  rejected: { label: "Refusé",      bg: "#fee2e2", color: "#991b1b", dot: "#ef4444" },
};

export default function AlerteAudioReview() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc       = useQueryClient();

  // ── Player ──────────────────────────────────────────────────────────
  const audioRef                    = useRef<HTMLAudioElement | null>(null);
  const [playing,  setPlaying]      = useState(false);
  const [progress, setProgress]     = useState(0);
  const [duration, setDuration]     = useState(0);

  // ── Formulaire refus ─────────────────────────────────────────────────
  const [comment,      setComment]      = useState("");
  const [showReject,   setShowReject]   = useState(false);
  const [actionError,  setActionError]  = useState("");

  // ── Data ─────────────────────────────────────────────────────────────
  const { data: audio, isLoading } = useQuery({
    queryKey: ["alerte-audio", id],
    queryFn:  () => alerteAudiosApi.getOne(Number(id)),
    enabled:  !!id,
  });

  // Initialiser le player quand l'audio est chargé
  useEffect(() => {
    if (!audio?.audio) return;
    const url = alerteAudiosApi.audioUrl(audio.audio);
    const el  = new Audio(url);
    audioRef.current = el;

    el.addEventListener("loadedmetadata", () => setDuration(el.duration));
    el.addEventListener("timeupdate",     () => setProgress(el.currentTime));
    el.addEventListener("ended",          () => { setPlaying(false); setProgress(0); });

    return () => {
      el.pause();
      el.src = "";
    };
  }, [audio?.audio]);

  function togglePlay() {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      a.play().catch(console.error);
      setPlaying(true);
    }
  }

  // ── Mutations ─────────────────────────────────────────────────────────
  const approveMut = useMutation({
    mutationFn: () => alerteAudiosApi.approve(Number(id)),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ["alerte-audios"] });
      qc.invalidateQueries({ queryKey: ["alerte-audio", id] });
      qc.invalidateQueries({ queryKey: ["notifications-web-unread"] });
    },
    onError: (e: any) =>
      setActionError(e?.response?.data?.message || "Erreur lors de la validation"),
  });

  const rejectMut = useMutation({
    mutationFn: () => alerteAudiosApi.reject(Number(id), comment),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ["alerte-audios"] });
      qc.invalidateQueries({ queryKey: ["alerte-audio", id] });
      qc.invalidateQueries({ queryKey: ["notifications-web-unread"] });
      setShowReject(false);
    },
    onError: (e: any) =>
      setActionError(e?.response?.data?.message || "Erreur lors du refus"),
  });

  // ── Rendu ─────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 size={28} className="animate-spin text-slate-400" />
        </div>
      </AppLayout>
    );
  }

  if (!audio) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-screen gap-3">
          <FileAudio size={36} className="text-slate-300" />
          <p className="text-slate-500 text-sm">Audio introuvable</p>
          <button
            onClick={() => navigate("/alerte-audios")}
            className="text-sm text-blue-600 hover:underline"
          >
            Retour à la liste
          </button>
        </div>
      </AppLayout>
    );
  }

  const statusCfg = statusConfig[audio.status ?? "pending"];
  const pct       = duration > 0 ? (progress / duration) * 100 : 0;
  const isPending = audio.status === "pending";

  return (
    <AppLayout>
      <div className="min-h-screen bg-slate-50">

        {/* ── Header ── */}
        <div className="bg-white border-b border-slate-200 px-6 py-4">
          <button
            onClick={() => navigate("/alerte-audios")}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition mb-3"
          >
            <ChevronLeft size={15} /> Retour à la liste
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">
                {audio.name || audio.originalFilename || `Audio #${audio.id}`}
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Examen de l'audio avant validation
              </p>
            </div>
            {/* Badge statut */}
            <span style={{
              background: statusCfg.bg,
              color:      statusCfg.color,
              padding:    "4px 12px",
              borderRadius: 20,
              fontSize:   13,
              fontWeight: 500,
              display:    "flex",
              alignItems: "center",
              gap:        6,
            }}>
              <span style={{
                width: 7, height: 7,
                borderRadius: "50%",
                background: statusCfg.dot,
                display: "inline-block",
              }} />
              {statusCfg.label}
            </span>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-4">

          {/* ── Lecteur audio ── */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
              <Music size={13} className="inline mr-1.5" />
              Écoute de l'audio
            </div>

            {/* Waveform décoratif */}
            <div className="flex items-center gap-0.5 justify-center mb-4" style={{ height: 40 }}>
              {Array.from({ length: 40 }).map((_, i) => {
                const h = 10 + Math.abs(Math.sin(i * 0.8) * 24 + Math.cos(i * 0.4) * 12);
                const filled = pct > 0 && (i / 40) * 100 < pct;
                return (
                  <div key={i} style={{
                    width:        4,
                    height:       h,
                    borderRadius: 2,
                    background:   filled ? "#3b82f6" : "#e2e8f0",
                    transition:   "background 0.1s",
                  }} />
                );
              })}
            </div>

            {/* Barre de progression + temps */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs text-slate-400 w-8 text-right">{fmtTime(progress)}</span>
              <div
                className="flex-1 h-1.5 bg-slate-100 rounded-full cursor-pointer relative"
                onClick={e => {
                  const rect  = e.currentTarget.getBoundingClientRect();
                  const ratio = (e.clientX - rect.left) / rect.width;
                  if (audioRef.current) audioRef.current.currentTime = ratio * duration;
                  setProgress(ratio * duration);
                }}
              >
                <div style={{
                  width:        `${pct}%`,
                  height:       "100%",
                  background:   "#3b82f6",
                  borderRadius: 9999,
                  transition:   "width 0.1s linear",
                }} />
              </div>
              <span className="text-xs text-slate-400 w-8">{fmtTime(duration)}</span>
            </div>

            {/* Bouton play */}
            <div className="flex justify-center">
              <button
                onClick={togglePlay}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium text-white transition"
                style={{ background: playing ? "#6366f1" : "#3b82f6" }}
              >
                {playing
                  ? <><Pause size={16} /> Pause</>
                  : <><Play  size={16} /> Écouter</>}
              </button>
            </div>
          </div>

          {/* ── Infos audio ── */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
              Informations
            </div>
            <div className="grid grid-cols-2 gap-3">

              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-50">
                <Clock size={15} className="text-slate-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">Durée</p>
                  <p className="text-sm font-medium text-slate-700">{fmt(audio.duration)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-50">
                <HardDrive size={15} className="text-slate-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">Taille</p>
                  <p className="text-sm font-medium text-slate-700">{fmtSize(audio.fileSize)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-50 col-span-2">
                <Tag size={15} className="text-slate-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">Sous-catégorie</p>
                  <p className="text-sm font-medium text-slate-700">
                    {audio.sousCategorie?.name || "—"}
                  </p>
                </div>
              </div>

              {audio.description && (
                <div className="col-span-2 p-3 rounded-lg bg-slate-50">
                  <p className="text-xs text-slate-400 mb-1">Description</p>
                  <p className="text-sm text-slate-700">{audio.description}</p>
                </div>
              )}

            </div>
          </div>
          
          {/* Demandeur */}
          {audio.createdByUser && (

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                SOUMIS PAR
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-50">
                  <User size={15} className="text-slate-400 flex-shrink-0" />
                  <div>
                      <p className="text-sm font-medium text-slate-700">
                      {[audio.createdByUser.first_name, audio.createdByUser.last_name]
                        .filter(Boolean).join(' ') || audio.createdByUser.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-50">
                  <Building2 size={15} className="text-slate-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">Client</p>
                    <p className="text-sm font-medium text-slate-700">{audio.customer.name}</p>
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* ── Commentaire de refus (si refusé) ── */}
          {audio.status === "rejected" && audio.rejectionComment && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1.5">
                Motif du refus
              </p>
              <p className="text-sm text-red-700">{audio.rejectionComment}</p>
            </div>
          )}

          {/* ── Erreur action ── */}
          {actionError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {actionError}
            </div>
          )}

          {/* ── Actions de validation (superadmin + status pending) ── */}
          {isPending && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                Décision
              </div>

              {!showReject ? (
                <div className="flex gap-3">
                  {/* Valider */}
                  <button
                    onClick={() => { setActionError(""); approveMut.mutate(); }}
                    disabled={approveMut.isPending || rejectMut.isPending}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white transition disabled:opacity-50"
                    style={{ background: "#10b981" }}
                  >
                    {approveMut.isPending
                      ? <Loader2 size={15} className="animate-spin" />
                      : <Check size={15} />}
                    Valider l'audio
                  </button>

                  {/* Refuser */}
                  <button
                    onClick={() => { setActionError(""); setShowReject(true); }}
                    disabled={approveMut.isPending || rejectMut.isPending}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50"
                    style={{ background: "#fee2e2", color: "#991b1b" }}
                  >
                    <X size={15} />
                    Refuser
                  </button>
                </div>
              ) : (
                /* Formulaire de refus */
                <div className="flex flex-col gap-3">
                  <textarea
                    rows={3}
                    placeholder="Motif du refus (obligatoire)…"
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent resize-none"
                    autoFocus
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setShowReject(false); setComment(""); }}
                      className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => { setActionError(""); rejectMut.mutate(); }}
                      disabled={!comment.trim() || rejectMut.isPending}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white transition disabled:opacity-50"
                      style={{ background: "#ef4444" }}
                    >
                      {rejectMut.isPending
                        ? <Loader2 size={15} className="animate-spin" />
                        : <X size={15} />}
                      Confirmer le refus
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Message si déjà traité */}
          {!isPending && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
              <p className="text-sm text-slate-500">
                Cet audio a déjà été{" "}
                <span style={{ color: statusCfg.color, fontWeight: 500 }}>
                  {audio.status === "approved" ? "validé" : "refusé"}
                </span>.
              </p>
            </div>
          )}

        </div>
      </div>
    </AppLayout>
  );
}