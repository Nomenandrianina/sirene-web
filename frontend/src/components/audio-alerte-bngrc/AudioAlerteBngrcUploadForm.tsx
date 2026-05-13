import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate }                           from "react-router-dom";
import { useQuery }                              from "@tanstack/react-query";
import { ChevronLeft, Loader2, Upload, Music, Play, Pause, X, FileAudio, Search, Check, ChevronDown, Clock, Radio,} from "lucide-react";
import { alerteBngrcApi} from "@/services/alertebngrc.api";
import { typeAlerteBngrcApi} from "@/services/typeAlerteBngrc.api";
import { categorieAlerteBngrcApi} from "@/services/categorieAlerteBngrc.api";
import { audioAlerteBngrcApi } from "@/services/audioAlerteBngrc.api";
import { sirenesApi } from "@/services/sirene.api"; 
import "@/styles/sirene-form.css";
import "@/styles/alerte-audio.css";

export interface AudioAlerteBngrcUploadFormData {
    name:                   string;
    description:            string;
    categorieAlerteBngrcId: number;
    alerteBngrcId:          number;
    typeAlerteBngrcId:      number;
    sireneIds:              number[];
    duration?:              number;
  }
  
  interface Props {
    initialData?: Partial<AudioAlerteBngrcUploadFormData> & {
      id?:               number;
      existingAudio?:    string;
      originalFilename?: string;
      mobileId?:         string;
    };
    onSubmit: (data: AudioAlerteBngrcUploadFormData, file?: File) => Promise<void>;
    loading:  boolean;
    error?:   string;
  }
  
  // ── Helpers ───────────────────────────────────────────────────────────────────
  
  function toArr(raw: any): any[] {
    return Array.isArray(raw) ? raw : raw?.data ?? raw?.response ?? [];
  }
  
  // ── SearchableMultiSelect (sirènes) ───────────────────────────────────────────
  
  function SearchableMultiSelect({
    label, placeholder, items, selected, onChange, disabled,
  }: {
    label:       string;
    placeholder: string;
    items:       { id: number; name: string }[];
    selected:    number[];
    onChange:    (ids: number[]) => void;
    disabled?:   boolean;
  }) {
    const [open,  setOpen]  = useState(false);
    const [query, setQuery] = useState("");
    const ref = useRef<HTMLDivElement>(null);
  
    useEffect(() => {
      const fn = (e: MouseEvent) => {
        if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
      };
      document.addEventListener("mousedown", fn);
      return () => document.removeEventListener("mousedown", fn);
    }, []);
  
    const filtered      = useMemo(() => items.filter(i => i.name.toLowerCase().includes(query.toLowerCase())), [items, query]);
    const selectedItems = useMemo(() => items.filter(i => selected.includes(i.id)), [items, selected]);
  
    return (
      <div ref={ref} className="relative">
        <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">{label}</label>
        <button
          type="button" disabled={disabled}
          onClick={() => !disabled && setOpen(o => !o)}
          className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-sm transition bg-white ${
            disabled ? "bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200"
              : open ? "ring-2 ring-blue-400 border-transparent shadow-sm"
              : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
            {selected.length === 0
              ? <span className="text-slate-400">{placeholder}</span>
              : selectedItems.slice(0, 3).map(item => (
                  <span key={item.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                    {item.name}
                    {!disabled && (
                      <X size={10} className="cursor-pointer"
                        onClick={e => { e.stopPropagation(); onChange(selected.filter(id => id !== item.id)); }} />
                    )}
                  </span>
                ))
            }
            {selected.length > 3 && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                +{selected.length - 3}
              </span>
            )}
          </div>
          <ChevronDown size={14} className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
  
        {open && (
          <div className="absolute z-50 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
            <div className="p-2 border-b border-slate-50 bg-slate-50/50">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={query} onChange={e => setQuery(e.target.value)}
                  placeholder="Rechercher une sirène…"
                  className="w-full pl-9 pr-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-400/20"
                />
              </div>
            </div>
            <div className="max-h-52 overflow-y-auto">
              {filtered.length === 0
                ? <div className="p-4 text-center text-xs text-slate-400">Aucune sirène trouvée</div>
                : filtered.map(item => {
                    const checked = selected.includes(item.id);
                    return (
                      <div key={item.id}
                        onClick={() => onChange(checked ? selected.filter(id => id !== item.id) : [...selected, item.id])}
                        className={`flex items-center gap-3 px-4 py-2.5 text-sm cursor-pointer hover:bg-slate-50 transition ${checked ? "bg-blue-50/50 text-blue-700 font-medium" : "text-slate-600"}`}
                      >
                        <div className={`w-4 h-4 border rounded flex items-center justify-center transition ${checked ? "bg-blue-500 border-blue-500" : "border-slate-300"}`}>
                          {checked && <Check size={10} className="text-white" strokeWidth={3} />}
                        </div>
                        {item.name}
                      </div>
                    );
                  })
              }
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // ── Formulaire principal ───────────────────────────────────────────────────────
  
  export function AudioAlerteBngrcUploadForm({ initialData, onSubmit, loading, error }: Props) {
    const isEdit   = !!initialData?.id;
    const navigate = useNavigate();
  
    const [form, setForm] = useState<AudioAlerteBngrcUploadFormData>({
      name:                   initialData?.name                   ?? "",
      description:            initialData?.description            ?? "",
      categorieAlerteBngrcId: initialData?.categorieAlerteBngrcId ?? 0,
      alerteBngrcId:          initialData?.alerteBngrcId          ?? 0,
      typeAlerteBngrcId:      initialData?.typeAlerteBngrcId      ?? 0,
      sireneIds:              initialData?.sireneIds              ?? [],
    });
  
    useEffect(() => {
      if (initialData?.id) setForm({
        name:                   initialData.name                   ?? "",
        description:            initialData.description            ?? "",
        categorieAlerteBngrcId: initialData.categorieAlerteBngrcId ?? 0,
        alerteBngrcId:          initialData.alerteBngrcId          ?? 0,
        typeAlerteBngrcId:      initialData.typeAlerteBngrcId      ?? 0,
        sireneIds:              initialData.sireneIds              ?? [],
      });
    }, [initialData?.id]);
  
    // ── Fichier & Player ──────────────────────────────────────────────────────
    const [file,      setFile]      = useState<File | null>(null);
    const [fileError, setFileError] = useState("");
    const [playing,   setPlaying]   = useState(false);
    const [progress,  setProgress]  = useState(0);
    const [audioDur,  setAudioDur]  = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const audioRef     = useRef<HTMLAudioElement | null>(null);
  
    const previewUrl  = useMemo(() => file ? URL.createObjectURL(file) : null, [file]);
    const existingUrl = initialData?.existingAudio ? audioAlerteBngrcApi.audioUrl(initialData.existingAudio) : null;
    const playerUrl   = previewUrl ?? (isEdit ? existingUrl : null);
  
    useEffect(() => {
      if (!playerUrl) return;
      const audio = new Audio(playerUrl);
      audioRef.current = audio;
      audio.addEventListener("timeupdate",     () => setProgress(audio.currentTime));
      audio.addEventListener("loadedmetadata", () => setAudioDur(audio.duration));
      audio.addEventListener("ended",          () => setPlaying(false));
      return () => { audio.pause(); audio.src = ""; };
    }, [playerUrl]);
  
    function togglePlay() {
      const a = audioRef.current;
      if (!a) return;
      playing ? a.pause() : a.play();
      setPlaying(!playing);
    }
  
    function fmt(s: number) {
      if (!isFinite(s) || isNaN(s) || s < 0) return "0:00";
      const m = Math.floor(s / 60), sec = Math.floor(s % 60);
      return `${m}:${sec.toString().padStart(2, "0")}`;
    }
  
    function handleFile(f: File) {
      const allowed = [".mp3", ".wav", ".ogg", ".aac", ".m4a", ".opus"];
      const ext     = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
      if (!allowed.includes(ext)) { setFileError(`Format non supporté (acceptés : ${allowed.join(", ")})`); return; }
  
      const url  = URL.createObjectURL(f);
      const temp = new Audio(url);
      temp.addEventListener("loadedmetadata", () => {
        URL.revokeObjectURL(url);
        const MAX = 150;
        if (temp.duration > MAX) { setFileError(`Durée maximale dépassée : ${Math.floor(temp.duration)}s (max 2 min 30s)`); return; }
        setFileError(""); setFile(f);
        setForm(prev => ({ ...prev, duration: temp.duration }));
        if (playing && audioRef.current) { audioRef.current.pause(); setPlaying(false); }
      });
      temp.addEventListener("error", () => { URL.revokeObjectURL(url); setFileError("Impossible de lire ce fichier audio"); });
    }
  
    // ── Données ───────────────────────────────────────────────────────────────
    const { data: rawAlertes } = useQuery({ queryKey: ["alerte-bngrc"],       queryFn: () => alerteBngrcApi.getAll() });
    const { data: rawTypes }   = useQuery({ queryKey: ["type-alerte-bngrc"],  queryFn: () => typeAlerteBngrcApi.getAll() });
    const { data: rawCats }    = useQuery({ queryKey: ["categorie-alerte-bngrc"], queryFn: () => categorieAlerteBngrcApi.getAll() });
    const { data: rawSirenes } = useQuery({ queryKey: ["sirenes"],            queryFn: sirenesApi.getAll });
  
    const alertes    = toArr(rawAlertes);
    const allTypes   = toArr(rawTypes);
    const allCats    = toArr(rawCats);
    // Toutes les sirènes actives — superadmin voit tout
    const sirenes    = useMemo(() => toArr(rawSirenes).filter((s: any) => s.isActive), [rawSirenes]);
  
    const filteredTypes = useMemo(() =>
      form.alerteBngrcId ? allTypes.filter((t: any) => Number(t.alerteBngrcId) === form.alerteBngrcId) : allTypes,
      [allTypes, form.alerteBngrcId]);
  
    const filteredCats = useMemo(() =>
      form.typeAlerteBngrcId ? allCats.filter((c: any) => Number(c.typeAlerteBngrcId) === form.typeAlerteBngrcId) : allCats,
      [allCats, form.typeAlerteBngrcId]);
  
    // ── Soumission ────────────────────────────────────────────────────────────
    async function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      if (!isEdit && !file) { setFileError("Le fichier audio est obligatoire"); return; }
      const payload = isEdit
      ? form
      : { ...form, sireneIds: [] }; 
      
      await onSubmit(payload, file ?? undefined);
    }
  
    const isValid =
    form.categorieAlerteBngrcId > 0 &&
    (isEdit || !!file);
  
    return (
      <div className="sirene-form-page">
        <div className="sirene-page-header">
          <button type="button" className="btn-back" onClick={() => navigate("/audio-alerte-bngrc/create")}>
            <ChevronLeft size={16} /> Choisir le mode
          </button>
          <h1 className="sirene-title">{isEdit ? "Modifier l'audio BNGRC" : "Nouvel audio BNGRC — Upload"}</h1>
          <p className="sirene-subtitle">
            {isEdit ? "Modifiez les informations" : "Importez un fichier et remplissez le formulaire"}
          </p>
        </div>
  
        <form onSubmit={handleSubmit} className="sirene-form-layout">
  
          {/* ── Fichier audio ── */}
          <div className="sirene-form-card">
            <div className="sirene-section-title">
              <FileAudio size={13} /> Fichier audio {!isEdit && <span className="required">*</span>}
            </div>
  
            <div
              className={`audio-dropzone${file ? " has-file" : ""}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            >
              <input ref={fileInputRef} type="file" accept=".mp3,.wav,.ogg,.aac,.m4a,.opus"
                style={{ display: "none" }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
  
              {file ? (
                <div className="audio-file-info">
                  <Music size={20} className="audio-file-icon" />
                  <div>
                    <p className="audio-filename">{file.name}</p>
                    <p className="audio-filesize">{(file.size / 1024 / 1024).toFixed(2)} Mo</p>
                  </div>
                  <button type="button" className="audio-remove-file"
                    onClick={e => { e.stopPropagation(); setFile(null); setPlaying(false); }}>
                    <X size={14} />
                  </button>
                </div>
              ) : isEdit && initialData?.originalFilename ? (
                <div className="audio-file-info">
                  <Music size={20} className="audio-file-icon" />
                  <div>
                    <p className="audio-filename">{initialData.originalFilename}</p>
                    <p className="audio-filesize" style={{ color: "#94a3b8" }}>Fichier actuel — cliquez pour remplacer</p>
                  </div>
                </div>
              ) : (
                <div className="audio-dropzone-placeholder">
                  <Upload size={28} style={{ color: "#94a3b8", marginBottom: 8 }} />
                  <p>Glissez un fichier audio ou <span style={{ color: "#152a8a", fontWeight: 600 }}>cliquez pour choisir</span></p>
                  <p style={{ fontSize: "0.74rem", color: "#94a3b8", marginTop: 4 }}>MP3, WAV, OGG, AAC, M4A, OPUS</p>
                  <p style={{ fontSize: "0.72rem", color: "#f59e0b", marginTop: 6, display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
                    <Clock size={11} /> Durée maximale : 2 min 30s
                  </p>
                </div>
              )}
            </div>
            {fileError && <span className="field-error">{fileError}</span>}
  
            {/* Player */}
            {playerUrl && (
              <div className="audio-player">
                <button type="button" className="player-play-btn" onClick={togglePlay}>
                  {playing ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <span className="player-time">{fmt(progress)}</span>
                <input type="range" className="player-seek" min={0} max={audioDur || 100} step={0.1} value={progress}
                  onChange={e => { if (audioRef.current) audioRef.current.currentTime = Number(e.target.value); setProgress(Number(e.target.value)); }} />
                <span className="player-time">{fmt(audioDur)}</span>
              </div>
            )}
  
            {isEdit && initialData?.mobileId && (
              <div className="audio-mobileid-info">
                <span className="audio-mobileid-label">Mobile ID :</span>
                <code className="audio-mobileid-value">{initialData.mobileId}</code>
              </div>
            )}
          </div>
  
          {/* ── Informations ── */}
          <div className="sirene-form-card">
            <div className="sirene-section-title">Informations</div>
            <div className="sirene-fields-grid">
              <div className="sirene-field">
                <label>Nom de l'audio</label>
                <input value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: Alerte cyclone rouge" />
              </div>
              <div className="sirene-field" style={{ gridColumn: "1/-1" }}>
                <label>Description</label>
                <textarea rows={2} value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Description optionnelle…" style={{ resize: "vertical" }} />
              </div>
            </div>
          </div>
  
          {/* ── Hiérarchie BNGRC (cascade) ── */}
          <div className="sirene-form-card">
            <div className="sirene-section-title">Classification BNGRC</div>
            <div className="sirene-fields-grid">
  
              <div className="sirene-field">
                <label>Alerte BNGRC</label>
                <select value={form.alerteBngrcId || ""}
                  onChange={e => setForm(f => ({
                    ...f,
                    alerteBngrcId:          Number(e.target.value),
                    typeAlerteBngrcId:      0,
                    categorieAlerteBngrcId: 0,
                  }))}>
                  <option value="">— Toutes —</option>
                  {alertes.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
  
              <div className="sirene-field">
                <label>Type / Aléa</label>
                <select disabled={!form.alerteBngrcId} value={form.typeAlerteBngrcId || ""}
                  onChange={e => setForm(f => ({
                    ...f,
                    typeAlerteBngrcId:      Number(e.target.value),
                    categorieAlerteBngrcId: 0,
                  }))}>
                  <option value="">{!form.alerteBngrcId ? "Choisir d'abord une alerte" : "— Choisir —"}</option>
                  {filteredTypes.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
  
              <div className="sirene-field" style={{ gridColumn: "1/-1" }}>
                <label>Catégorie <span className="required">*</span></label>
                <select required disabled={!form.typeAlerteBngrcId} value={form.categorieAlerteBngrcId || ""}
                  onChange={e => setForm(f => ({ ...f, categorieAlerteBngrcId: Number(e.target.value) }))}>
                  <option value="">{!form.typeAlerteBngrcId ? "Choisir d'abord un type" : "— Choisir —"}</option>
                  {filteredCats.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
          </div>
  
          {/* ── Sirènes ── */}
          <div className="sirene-form-card">
            {isEdit ? (
              <>
                <SearchableMultiSelect 
                  label="Sirènes de destination"
                  placeholder="Choisir les sirènes…"
                  items={sirenes}
                  selected={form.sireneIds}
                  onChange={ids => setForm(f => ({ ...f, sireneIds: ids }))}
                  disabled={false}
                />

                {form.sireneIds.length > 0 && (
                  <p className="text-xs text-slate-400 mt-1">
                    <Radio size={10} style={{ marginRight: 4 }} />
                    {form.sireneIds.length} sirène(s)
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-500">
                Toutes les sirènes seront automatiquement associées à cet audio.
              </p>
            )}
          </div>
  
          {/* ── Note superadmin ── */}
          <div style={{
            padding: "10px 14px", borderRadius: 8,
            background: "#eff6ff", border: "1px solid #bfdbfe",
            fontSize: 12, color: "#1e40af",
          }}>
            ℹ️ Les audios BNGRC sont créés directement avec le statut <strong>approuvé</strong> — aucune validation requise.
            Les sirènes associées les téléchargeront lors de leur prochaine synchronisation via <code>/audio-alerte-bngrc/public/sync/:imei</code>.
          </div>
  
          {error && <div className="form-error">{error}</div>}
  
          <div className="sirene-form-actions">
            <button type="button" className="btn-cancel" onClick={() => navigate("/audio-alerte-bngrc/create")}>
              Annuler
            </button>
            <button type="submit" className="btn-primary" disabled={loading || !isValid}>
              {loading && <Loader2 size={14} className="spin" />}
              {isEdit ? "Enregistrer" : "Créer l'audio"}
            </button>
          </div>
        </form>
      </div>
    );
  }
  