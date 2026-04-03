import { useState, useRef, useEffect } from "react";
import { Mic, Square, Play, Pause, RotateCcw, Check, Loader2, AlertCircle } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type RecorderState = "idle" | "requesting" | "recording" | "recorded" | "encoding" | "error";

interface RecorderWidgetProps {
  onRecorded: (file: File, durationSeconds: number) => void;
  onReset?:   () => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_DURATION_SEC = 120; // 2 minutes

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(s: number): string {
  // Protection contre Infinity et NaN (bug fréquent avec les blobs webm/ogg streamés)
  if (!isFinite(s) || isNaN(s) || s < 0) return "0:00";
  const m   = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

/**
 * Lit la vraie durée d'un Blob audio via Web Audio API (decodeAudioData).
 * Nécessaire car les blobs webm/ogg produits par MediaRecorder en streaming
 * n'ont pas de durée dans leurs métadonnées → audio.duration retourne Infinity.
 */
async function getRealDuration(blob: Blob): Promise<number> {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const audioCtx    = new AudioContext();
    const decoded     = await audioCtx.decodeAudioData(arrayBuffer);
    await audioCtx.close();
    return decoded.duration;
  } catch {
    return 0;
  }
}

/**
 * Encode un Blob audio en MP3 via lamejs (chargé depuis CDN).
 * Décode PCM via Web Audio API → encode en MP3 128 kbps.
 */
async function encodeMp3(blob: Blob, onProgress?: (p: number) => void): Promise<Blob> {
  if (!(window as any).lamejs) {
    await new Promise<void>((res, rej) => {
      const s    = document.createElement("script");
      s.src      = "https://cdnjs.cloudflare.com/ajax/libs/lamejs/1.2.1/lame.min.js";
      s.onload   = () => res();
      s.onerror  = () => rej(new Error("Impossible de charger lamejs"));
      document.head.appendChild(s);
    });
  }

  const lamejs = (window as any).lamejs;

  const arrayBuffer = await blob.arrayBuffer();
  const audioCtx    = new AudioContext();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  await audioCtx.close();

  const sampleRate  = audioBuffer.sampleRate;
  const numChannels = Math.min(audioBuffer.numberOfChannels, 2) as 1 | 2;

  const toInt16 = (f32: Float32Array): Int16Array => {
    const i16 = new Int16Array(f32.length);
    for (let i = 0; i < f32.length; i++) {
      const s = Math.max(-1, Math.min(1, f32[i]));
      i16[i]  = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return i16;
  };

  const leftPcm  = toInt16(audioBuffer.getChannelData(0));
  const rightPcm = numChannels === 2 ? toInt16(audioBuffer.getChannelData(1)) : leftPcm;

  const mp3enc    = new lamejs.Mp3Encoder(numChannels, sampleRate, 128);
  const mp3Data: Int8Array[] = [];
  const chunkSize = 1152;
  const total     = leftPcm.length;

  for (let i = 0; i < total; i += chunkSize) {
    const left  = leftPcm.subarray(i, i + chunkSize);
    const right = rightPcm.subarray(i, i + chunkSize);
    const buf   = numChannels === 2
      ? mp3enc.encodeBuffer(left, right)
      : mp3enc.encodeBuffer(left);
    if (buf.length > 0) mp3Data.push(buf);
    onProgress?.(Math.round((i / total) * 100));
  }

  const end = mp3enc.flush();
  if (end.length > 0) mp3Data.push(end);

  return new Blob(mp3Data, { type: "audio/mpeg" });
}

// ── Composant ─────────────────────────────────────────────────────────────────

export function RecorderWidget({ onRecorded, onReset }: RecorderWidgetProps) {
  const [state,        setState]        = useState<RecorderState>("idle");
  const [errorMsg,     setErrorMsg]     = useState("");
  const [elapsed,      setElapsed]      = useState(0);
  const [blobUrl,      setBlobUrl]      = useState<string | null>(null);
  const [playing,      setPlaying]      = useState(false);
  const [playProgress, setPlayProgress] = useState(0);
  const [playDuration, setPlayDuration] = useState(0); // durée réelle via AudioContext
  const [validated,    setValidated]    = useState(false);
  const [encProgress,  setEncProgress]  = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef        = useRef<MediaStream | null>(null);
  const chunksRef        = useRef<Blob[]>([]);
  const timerRef         = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxTimerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioRef         = useRef<HTMLAudioElement | null>(null);
  const rawBlobRef       = useRef<Blob | null>(null);

  useEffect(() => {
    return () => {
      stopTimers();
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      audioRef.current?.pause();
    };
  }, []);

  // Monte le player quand blobUrl est prêt (après onstop + getRealDuration)
  useEffect(() => {
    if (!blobUrl) return;
    const audio = new Audio(blobUrl);
    audioRef.current = audio;
    // On N'utilise PAS loadedmetadata pour la durée : webm/ogg streamé → Infinity
    // La durée est déjà dans playDuration, fixée via getRealDuration() dans onstop
    audio.addEventListener("timeupdate", () => setPlayProgress(audio.currentTime));
    audio.addEventListener("ended",      () => { setPlaying(false); setPlayProgress(0); });
    return () => { audio.pause(); audio.src = ""; };
  }, [blobUrl]);

  function stopTimers() {
    if (timerRef.current)   { clearInterval(timerRef.current);  timerRef.current   = null; }
    if (maxTimerRef.current) { clearTimeout(maxTimerRef.current); maxTimerRef.current = null; }
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  async function startRecording() {
    setState("requesting");
    setErrorMsg("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")
          ? "audio/ogg;codecs=opus"
          : "";

      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mr;
      chunksRef.current        = [];

      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };

      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const rawBlob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        rawBlobRef.current = rawBlob;

        // ← Clé du fix Infinity:NaN : lire la durée via AudioContext avant d'afficher le player
        const realDuration = await getRealDuration(rawBlob);
        setPlayDuration(realDuration);

        const previewUrl = URL.createObjectURL(rawBlob);
        setBlobUrl(previewUrl);
        setState("recorded");
      };

      mr.start(100);
      setState("recording");
      setElapsed(0);

      // Chrono secondes
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);

      // Arrêt automatique à 2 min
      maxTimerRef.current = setTimeout(() => {
        stopTimers();
        mediaRecorderRef.current?.stop();
      }, MAX_DURATION_SEC * 1000);

    } catch (err: any) {
      setState("error");
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setErrorMsg("Permission micro refusée. Autorisez l'accès au micro dans votre navigateur.");
      } else if (err.name === "NotFoundError") {
        setErrorMsg("Aucun micro détecté sur cet appareil.");
      } else {
        setErrorMsg("Impossible d'accéder au micro. Vérifiez votre connexion HTTPS.");
      }
    }
  }

  function stopRecording() {
    stopTimers();
    mediaRecorderRef.current?.stop();
  }

  function resetAll() {
    stopTimers();
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    audioRef.current?.pause();
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setBlobUrl(null);
    rawBlobRef.current = null;
    setState("idle");
    setElapsed(0);
    setPlaying(false);
    setPlayProgress(0);
    setPlayDuration(0);
    setValidated(false);
    setEncProgress(0);
    setErrorMsg("");
    onReset?.();
  }

  function togglePlay() {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else         { a.play();  setPlaying(true);  }
  }

  async function validate() {
    if (!rawBlobRef.current) return;
    setState("encoding");
    setEncProgress(0);

    let finalBlob: Blob;
    let filename: string;

    try {
      finalBlob = await encodeMp3(rawBlobRef.current, setEncProgress);
      filename  = `enregistrement_${Date.now()}.mp3`;
    } catch (encErr) {
      console.warn("Encodage MP3 échoué, fallback :", encErr);
      finalBlob = rawBlobRef.current;
      const ext = finalBlob.type.includes("ogg") ? ".ogg" : ".webm";
      filename  = `enregistrement_${Date.now()}${ext}`;
    }

    const file = new File([finalBlob], filename, { type: finalBlob.type });
    setValidated(true);
    setState("recorded");
    onRecorded(file, playDuration || elapsed);
  }

  const limitPct  = Math.min((elapsed / MAX_DURATION_SEC) * 100, 100);
  const nearLimit = elapsed >= MAX_DURATION_SEC - 20;

  // ── Rendu ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">

      {/* idle */}
      {state === "idle" && (
        <div className="flex flex-col items-center gap-4 py-8">
          <button
            type="button"
            onClick={startRecording}
            className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 active:scale-95 transition shadow-sm"
          >
            <Mic size={26} />
          </button>
          <p className="text-sm text-slate-500">Cliquez pour démarrer l'enregistrement</p>
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <AlertCircle size={11} /> Durée maximale : 2 minutes
          </p>
        </div>
      )}

      {/* requesting */}
      {state === "requesting" && (
        <div className="flex flex-col items-center gap-3 py-8">
          <Loader2 size={28} className="animate-spin text-slate-400" />
          <p className="text-sm text-slate-500">Demande d'accès au micro…</p>
        </div>
      )}

      {/* recording */}
      {state === "recording" && (
        <div className="flex flex-col items-center gap-5 py-6">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-20 h-20 rounded-full bg-red-100 animate-ping opacity-40" />
            <div className="absolute w-16 h-16 rounded-full bg-red-100 animate-pulse" />
            <div className="relative w-12 h-12 rounded-full bg-red-500 flex items-center justify-center">
              <div className="w-4 h-4 rounded-sm bg-white" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xl font-mono font-medium text-slate-800 tabular-nums">
              {fmt(elapsed)}
            </span>
            <span className="text-sm text-slate-400">/ {fmt(MAX_DURATION_SEC)}</span>
          </div>

          {/* Barre de progression 2 min */}
          <div className="w-full max-w-xs flex flex-col gap-1">
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-1.5 rounded-full transition-all duration-1000 ${
                  nearLimit ? "bg-red-500" : "bg-emerald-500"
                }`}
                style={{ width: `${limitPct}%` }}
              />
            </div>
            {nearLimit && (
              <p className="text-xs text-red-500 text-center animate-pulse">
                Arrêt automatique dans {MAX_DURATION_SEC - elapsed}s
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={stopRecording}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 active:scale-95 transition"
          >
            <Square size={14} fill="white" />
            Arrêter l'enregistrement
          </button>
        </div>
      )}

      {/* encoding */}
      {state === "encoding" && (
        <div className="flex flex-col items-center gap-4 py-8">
          <Loader2 size={28} className="animate-spin text-emerald-500" />
          <p className="text-sm font-medium text-slate-700">Conversion en MP3…</p>
          <div className="w-full max-w-xs bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-2 bg-emerald-500 rounded-full transition-all duration-200"
              style={{ width: `${encProgress}%` }}
            />
          </div>
          <p className="text-xs text-slate-400">{encProgress}%</p>
        </div>
      )}

      {/* recorded */}
      {state === "recorded" && blobUrl && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <Mic size={14} className="text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-emerald-800">Enregistrement terminé</p>
              <p className="text-xs text-emerald-600">
                Durée : {fmt(playDuration || elapsed)}
                {validated ? " · ✓ Converti en MP3" : " · Rééécoutez avant de valider"}
              </p>
            </div>
          </div>

          {/* Player */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <button
              type="button"
              onClick={togglePlay}
              className="flex-shrink-0 w-9 h-9 rounded-full bg-sky-600 text-white flex items-center justify-center hover:bg-sky-700 transition"
            >
              {playing ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <div className="flex-1 flex flex-col gap-1">
              <input
                type="range"
                min={0}
                max={playDuration || 1}
                step={0.1}
                value={playProgress}
                onChange={e => {
                  const t = Number(e.target.value);
                  if (audioRef.current) audioRef.current.currentTime = t;
                  setPlayProgress(t);
                }}
                className="w-full h-1.5 accent-sky-600 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-400 tabular-nums">
                <span>{fmt(playProgress)}</span>
                <span>{fmt(playDuration || elapsed)}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={resetAll}
              disabled={validated}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <RotateCcw size={14} />
              Recommencer
            </button>
            <button
              type="button"
              onClick={validate}
              disabled={validated}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <Check size={14} />
              {validated ? "MP3 prêt ✓" : "Valider cet enregistrement"}
            </button>
          </div>
        </div>
      )}

      {/* error */}
      {state === "error" && (
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
            <Mic size={20} className="text-red-500" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-red-700 mb-1">Accès au micro impossible</p>
            <p className="text-xs text-slate-500 max-w-xs">{errorMsg}</p>
          </div>
          <button
            type="button"
            onClick={resetAll}
            className="px-4 py-2 rounded-lg text-sm text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition"
          >
            Réessayer
          </button>
        </div>
      )}

    </div>
  );
}