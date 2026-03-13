import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Loader2, Upload, Music, Play, Pause, X, FileAudio } from "lucide-react";
import { alertesApi } from "@/services/alertes.api";
import {  alerteTypesApi } from "@/services/alertetypes.api";
import { categorieAlertesApi } from "@/services/categoriealertes.api";
import {  sousCategorieAlertesApi } from "@/services/souscategorieAlerte.api";
import { alerteAudiosApi } from "@/services/alerteaudio.api";
import {  AlerteAudio } from "@/types/alerteAudio";
import "@/styles/sirene-form.css";
import "@/styles/alerte-audio.css";

export interface AlerteAudioFormData {
  name: string;
  description: string;
  mobileId: string;
  duration: string;
  sousCategorieAlerteId: number;
  // cascade
  alerteId: number;
  alerteTypeId: number;
  categorieAlerteId: number;
}

interface Props {
  initialData?: Partial<AlerteAudioFormData> & { id?: number; existingAudio?: string; originalFilename?: string };
  onSubmit: (data: AlerteAudioFormData, file?: File) => Promise<void>;
  loading: boolean;
  error?: string;
}

export function AlerteAudioForm({ initialData, onSubmit, loading, error }: Props) {
  const isEdit   = !!initialData?.id;
  const navigate = useNavigate();

  const [form, setForm] = useState<AlerteAudioFormData>({
    name:                  initialData?.name ?? "",
    description:           initialData?.description ?? "",
    mobileId:              initialData?.mobileId ?? "",
    duration:              initialData?.duration ?? "",
    sousCategorieAlerteId: initialData?.sousCategorieAlerteId ?? 0,
    alerteId:              initialData?.alerteId ?? 0,
    alerteTypeId:          initialData?.alerteTypeId ?? 0,
    categorieAlerteId:     initialData?.categorieAlerteId ?? 0,
  });

  useEffect(() => {
    if (initialData?.id) {
      setForm({
        name:                  initialData.name ?? "",
        description:           initialData.description ?? "",
        mobileId:              initialData.mobileId ?? "",
        duration:              initialData.duration ?? "",
        sousCategorieAlerteId: initialData.sousCategorieAlerteId ?? 0,
        alerteId:              initialData.alerteId ?? 0,
        alerteTypeId:          initialData.alerteTypeId ?? 0,
        categorieAlerteId:     initialData.categorieAlerteId ?? 0,
      });
    }
  }, [initialData?.id]);

  // Fichier sélectionné
  const [file, setFile]       = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Player preview
  const [playing, setPlaying]     = useState(false);
  const [progress, setProgress]   = useState(0);
  const [audioDur, setAudioDur]   = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const previewUrl = useMemo(() => file ? URL.createObjectURL(file) : null, [file]);
  const existingUrl = initialData?.existingAudio ? alerteAudiosApi.audioUrl(initialData.existingAudio) : null;
  const playerUrl = previewUrl ?? (isEdit ? existingUrl : null);

  // Cascade données
  const {data:rawAlertes}    = useQuery({queryKey:["alertes"],        queryFn:()=>alertesApi.getAll()});
  const {data:rawTypes}      = useQuery({queryKey:["alerte-types"],   queryFn:()=>alerteTypesApi.getAll()});
  const {data:rawCategories} = useQuery({queryKey:["categorie-alertes"], queryFn:()=>categorieAlertesApi.getAll()});
  const {data:rawSousCats}   = useQuery({queryKey:["sous-categorie-alertes"], queryFn:()=>sousCategorieAlertesApi.getAll()});
  // Sous-catégories déjà liées à un audio
  const {data:rawUsedIds}    = useQuery({queryKey:["alerte-audios-used-ids"], queryFn:()=>alerteAudiosApi.getUsedSousCategorieIds()});

  const alertes      = useMemo(()=>{ const r=rawAlertes;    return Array.isArray(r)?r:(r as any)?.response??[]; },[rawAlertes]);
  const allTypes     = useMemo(()=>{ const r=rawTypes;      return Array.isArray(r)?r:(r as any)?.response??[]; },[rawTypes]);
  const allCategories= useMemo(()=>{ const r=rawCategories; return Array.isArray(r)?r:(r as any)?.response??[]; },[rawCategories]);
  const allSousCats  = useMemo(()=>{ const r=rawSousCats;   return Array.isArray(r)?r:(r as any)?.response??[]; },[rawSousCats]);
  // En édition, exclure la propre sous-catégorie de l'audio actuel
  const usedIds: number[] = useMemo(()=>{
    const ids = Array.isArray(rawUsedIds) ? rawUsedIds : (rawUsedIds as any)?.response ?? [];
    return isEdit ? ids.filter((id: number) => id !== initialData?.sousCategorieAlerteId) : ids;
  },[rawUsedIds, isEdit, initialData?.sousCategorieAlerteId]);

  const filteredTypes    = useMemo(()=>form.alerteId     ? allTypes.filter((t:any)=>Number(t.alerteId)===form.alerteId)          : allTypes,     [allTypes,form.alerteId]);
  const filteredCats     = useMemo(()=>form.alerteTypeId ? allCategories.filter((c:any)=>Number(c.alerteTypeId)===form.alerteTypeId) : allCategories,[allCategories,form.alerteTypeId]);
  const filteredSousCats = useMemo(()=>form.categorieAlerteId ? allSousCats.filter((s:any)=>Number(s.categorieAlerteId)===form.categorieAlerteId) : allSousCats,[allSousCats,form.categorieAlerteId]);

  // Lecture audio
  useEffect(() => {
    if (!playerUrl) return;
    const audio = new Audio(playerUrl);
    audioRef.current = audio;
    audio.addEventListener("timeupdate", () => setProgress(audio.currentTime));
    audio.addEventListener("loadedmetadata", () => setAudioDur(audio.duration));
    audio.addEventListener("ended", () => setPlaying(false));
    return () => { audio.pause(); audio.src = ""; };
  }, [playerUrl]);

  function togglePlay() {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else         { a.play();  setPlaying(true);  }
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Number(e.target.value);
    setProgress(Number(e.target.value));
  }

  function fmt(s: number) {
    const m = Math.floor(s/60), sec = Math.floor(s%60);
    return `${m}:${sec.toString().padStart(2,"0")}`;
  }

  // Sélection fichier
  function handleFile(f: File) {
    const allowed = [".mp3",".wav",".ogg",".aac",".m4a",".opus"];
    const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
    if (!allowed.includes(ext)) { setFileError(`Format non supporté (acceptés : ${allowed.join(", ")})`); return; }
    setFileError("");
    setFile(f);
    if (playing && audioRef.current) { audioRef.current.pause(); setPlaying(false); }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isEdit && !file) { setFileError("Le fichier audio est obligatoire"); return; }
    await onSubmit(form, file ?? undefined);
  }

  const isValid = form.mobileId.trim() && form.sousCategorieAlerteId > 0 && (isEdit || !!file);

  return (
    <div className="sirene-form-page">
      <div className="sirene-page-header">
        <button className="btn-back" onClick={()=>navigate("/alerte-audios")}><ChevronLeft size={16}/> Retour à la liste</button>
        <h1 className="sirene-title">{isEdit ? "Modifier l'audio" : "Nouvel audio d'alerte"}</h1>
        <p className="sirene-subtitle">{isEdit ? "Modifiez les informations" : "Uploadez un fichier audio et remplissez le formulaire"}</p>
      </div>

      <form onSubmit={handleSubmit} className="sirene-form-layout">

        {/* ── Upload ── */}
        <div className="sirene-form-card">
          <div className="sirene-section-title"><FileAudio size={13}/> Fichier audio {!isEdit && <span className="required">*</span>}</div>

          <div
            className={`audio-dropzone${file ? " has-file" : ""}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
          >
            <input ref={fileInputRef} type="file" accept=".mp3,.wav,.ogg,.aac,.m4a,.opus" style={{display:"none"}}
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

            {file ? (
              <div className="audio-file-info">
                <Music size={20} className="audio-file-icon"/>
                <div>
                  <p className="audio-filename">{file.name}</p>
                  <p className="audio-filesize">{(file.size/1024/1024).toFixed(2)} Mo</p>
                </div>
                <button type="button" className="audio-remove-file" onClick={e=>{e.stopPropagation();setFile(null);setPlaying(false);}}>
                  <X size={14}/>
                </button>
              </div>
            ) : isEdit && initialData?.originalFilename ? (
              <div className="audio-file-info">
                <Music size={20} className="audio-file-icon"/>
                <div>
                  <p className="audio-filename">{initialData.originalFilename}</p>
                  <p className="audio-filesize" style={{color:"#94a3b8"}}>Fichier actuel — cliquez pour remplacer</p>
                </div>
              </div>
            ) : (
              <div className="audio-dropzone-placeholder">
                <Upload size={28} style={{color:"#94a3b8",marginBottom:8}}/>
                <p>Glissez un fichier audio ou <span style={{color:"#152a8a",fontWeight:600}}>cliquez pour choisir</span></p>
                <p style={{fontSize:"0.74rem",color:"#94a3b8",marginTop:4}}>MP3, WAV, OGG, AAC, M4A, OPUS</p>
              </div>
            )}
          </div>
          {fileError && <span className="field-error">{fileError}</span>}

          {/* Player */}
          {playerUrl && (
            <div className="audio-player">
              <button type="button" className="player-play-btn" onClick={togglePlay}>
                {playing ? <Pause size={16}/> : <Play size={16}/>}
              </button>
              <span className="player-time">{fmt(progress)}</span>
              <input type="range" className="player-seek" min={0} max={audioDur||100} step={0.1}
                value={progress} onChange={handleSeek}/>
              <span className="player-time">{fmt(audioDur)}</span>
            </div>
          )}
        </div>

        {/* ── Informations ── */}
        <div className="sirene-form-card">
          <div className="sirene-section-title">Informations</div>
          <div className="sirene-fields-grid">
            <div className="sirene-field">
              <label>Nom de l'audio</label>
              <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Ex: Sirène niveau 2"/>
            </div>
            <div className="sirene-field">
              <label>Mobile ID <span className="required">*</span></label>
              <input required value={form.mobileId} onChange={e=>setForm(f=>({...f,mobileId:e.target.value}))} placeholder="Ex: audio_001_inondation"/>
            </div>
            <div className="sirene-field">
              <label>Durée (secondes)</label>
              <input type="number" min={0} step={0.1} value={form.duration} onChange={e=>setForm(f=>({...f,duration:e.target.value}))} placeholder="Ex: 30.5"/>
            </div>
            <div className="sirene-field" style={{gridColumn:"1/-1"}}>
              <label>Description</label>
              <textarea rows={2} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Description de l'audio…" style={{resize:"vertical"}}/>
            </div>
          </div>
        </div>

        {/* ── Hiérarchie cascade ── */}
        <div className="sirene-form-card">
          <div className="sirene-section-title">Hiérarchie (cascade)</div>
          <div className="sirene-fields-grid">
            <div className="sirene-field">
              <label>Alerte</label>
              <select value={form.alerteId||""} onChange={e=>{const v=Number(e.target.value);setForm(f=>({...f,alerteId:v,alerteTypeId:0,categorieAlerteId:0,sousCategorieAlerteId:0}));}}>
                <option value="">— Toutes les alertes —</option>
                {alertes.map((a:any)=><option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="sirene-field">
              <label>Type d'alerte</label>
              <select value={form.alerteTypeId||""} disabled={!form.alerteId} onChange={e=>{const v=Number(e.target.value);setForm(f=>({...f,alerteTypeId:v,categorieAlerteId:0,sousCategorieAlerteId:0}));}}>
                <option value="">{!form.alerteId?"Choisir d'abord une alerte":"— Tous les types —"}</option>
                {filteredTypes.map((t:any)=><option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="sirene-field">
              <label>Catégorie</label>
              <select value={form.categorieAlerteId||""} disabled={!form.alerteTypeId} onChange={e=>{const v=Number(e.target.value);setForm(f=>({...f,categorieAlerteId:v,sousCategorieAlerteId:0}));}}>
                <option value="">{!form.alerteTypeId?"Choisir d'abord un type":"— Toutes les catégories —"}</option>
                {filteredCats.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="sirene-field">
              <label>Sous-catégorie <span className="required">*</span></label>
              <select required value={form.sousCategorieAlerteId||""} disabled={!form.categorieAlerteId} onChange={e=>setForm(f=>({...f,sousCategorieAlerteId:Number(e.target.value)}))}>
                <option value={0}>{!form.categorieAlerteId?"Choisir d'abord une catégorie":"— Choisir une sous-catégorie —"}</option>
                {filteredSousCats.map((s:any)=>{
                  const isUsed = usedIds.includes(s.id);
                  return <option key={s.id} value={s.id} disabled={isUsed}>{s.name}{isUsed ? " (déjà utilisé)" : ""}</option>;
                })}
              </select>
            </div>
          </div>
        </div>

        {error && <div className="form-error">{error}</div>}
        <div className="sirene-form-actions">
          <button type="button" className="btn-cancel" onClick={()=>navigate("/alerte-audios")}>Annuler</button>
          <button type="submit" className="btn-primary" disabled={loading || !isValid}>
            {loading && <Loader2 size={14} className="spin"/>}
            {isEdit ? "Enregistrer" : "Créer l'audio"}
          </button>
        </div>
      </form>
    </div>
  );
}