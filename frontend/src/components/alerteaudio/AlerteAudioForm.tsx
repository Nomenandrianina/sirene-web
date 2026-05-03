import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft, Loader2, Upload, Music, Play, Pause,
  X, FileAudio, Search, Check, ChevronDown,
} from "lucide-react";
import { alertesApi }              from "@/services/alertes.api";
import { alerteTypesApi }          from "@/services/alertetypes.api";
import { categorieAlertesApi }     from "@/services/categoriealertes.api";
import { sousCategorieAlertesApi } from "@/services/souscategorieAlerte.api";
import { alerteAudiosApi }         from "@/services/alerteaudio.api";
import { sirenesApi }              from "@/services/sirene.api";
import "@/styles/sirene-form.css";
import "@/styles/alerte-audio.css";
import { useRole } from "@/hooks/useRole";
import { customersApi } from "@/services/customers.api"; 
// ── Interfaces ────────────────────────────────────────────────────────────────

export interface AlerteAudioFormData {
  name:                  string;
  description:           string;
  sousCategorieAlerteId: number;
  sireneIds:             number[];
  alerteId:              number;
  alerteTypeId:          number;
  categorieAlerteId:     number;
  mobileId?:             string;
  duration?:             number;
  customerId?:           number | null; 
  newSousCatName?:       string;    
}

interface Props {
  initialData?: Partial<AlerteAudioFormData> & {
    id?:               number;
    existingAudio?:    string;
    originalFilename?: string;
    mobileId?:         string;
    sireneId?:         number; 
    customerId?:       number | null;
  };
  onSubmit: (data: AlerteAudioFormData, file?: File) => Promise<void>;
  loading:  boolean;
  error?:   string;
}

/**
 * Combinaison déjà utilisée — champs identiques à ce que le backend retourne.
 * GET /alerte-audios/used-combinations
 */
interface UsedCombination {
  sousCategorieAlerteId: number; // ← nom exact retourné par le backend
  sireneId:              number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toArr(raw: any): any[] {
  return Array.isArray(raw) ? raw : raw?.data ?? raw?.response ?? [];
}

// ── SearchableMultiSelect ─────────────────────────────────────────────────────

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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered      = useMemo(() =>
    items.filter(i => i.name.toLowerCase().includes(query.toLowerCase())),
    [items, query]
  );
  const selectedItems = useMemo(() =>
    items.filter(i => selected.includes(i.id)),
    [items, selected]
  );

  return (
    <div ref={containerRef} className="relative">
      <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">{label}</label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-sm transition bg-white ${
          disabled
            ? "bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200"
            : open
              ? "ring-2 ring-blue-400 border-transparent shadow-sm"
              : "border-slate-200 hover:border-slate-300"
        }`}
      >
        <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
          {selected.length === 0
            ? <span className="text-slate-400">{placeholder}</span>
            : selectedItems.slice(0, 3).map(item => (
                <span
                  key={item.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-100"
                >
                  {item.name}
                  {!disabled && (
                    <X
                      size={10}
                      className="cursor-pointer"
                      onClick={e => {
                        e.stopPropagation();
                        onChange(selected.filter(id => id !== item.id));
                      }}
                    />
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
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
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
                    <div
                      key={item.id}
                      onClick={() =>
                        onChange(checked
                          ? selected.filter(id => id !== item.id)
                          : [...selected, item.id]
                        )
                      }
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm cursor-pointer hover:bg-slate-50 transition ${
                        checked ? "bg-blue-50/50 text-blue-700 font-medium" : "text-slate-600"
                      }`}
                    >
                      <div className={`w-4 h-4 border rounded flex items-center justify-center transition ${
                        checked ? "bg-blue-500 border-blue-500" : "border-slate-300"
                      }`}>
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

// ── AlerteAudioForm ───────────────────────────────────────────────────────────

export function AlerteAudioForm({ initialData, onSubmit, loading, error }: Props) {
  const isEdit   = !!initialData?.id;
  const navigate = useNavigate();
  const { isSuperAdmin, isClient, customerId: myCustomerId } = useRole();

  const [form, setForm] = useState<AlerteAudioFormData>({
    name:                  initialData?.name                  ?? "",
    description:           initialData?.description           ?? "",
    sousCategorieAlerteId: initialData?.sousCategorieAlerteId ?? 0,
    sireneIds:             initialData?.sireneIds             ?? (initialData?.sireneId ? [initialData.sireneId] : []),
    alerteId:              initialData?.alerteId              ?? 0,
    alerteTypeId:          initialData?.alerteTypeId          ?? 0,
    categorieAlerteId:     initialData?.categorieAlerteId     ?? 0,
    customerId:            initialData?.customerId            ?? null, 
    newSousCatName:  "",

  });

  useEffect(() => {
    if (initialData?.id) {
      setForm({
        name:                  initialData.name                  ?? "",
        description:           initialData.description           ?? "",
        sousCategorieAlerteId: initialData.sousCategorieAlerteId ?? 0,
        sireneIds:             initialData.sireneIds             ?? (initialData.sireneId ? [initialData.sireneId] : []),
        alerteId:              initialData.alerteId              ?? 0,
        alerteTypeId:          initialData.alerteTypeId          ?? 0,
        categorieAlerteId:     initialData.categorieAlerteId     ?? 0,
        customerId:            initialData.customerId            ?? null,
      });
    }
  }, [initialData?.id]);

  // ── Fichier & Player ────────────────────────────────────────────────────────

  const [file,      setFile]      = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [playing,   setPlaying]   = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [audioDur,  setAudioDur]  = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const previewUrl  = useMemo(() => file ? URL.createObjectURL(file) : null, [file]);
  const existingUrl = initialData?.existingAudio ? alerteAudiosApi.audioUrl(initialData.existingAudio) : null;
  const playerUrl   = previewUrl ?? (isEdit ? existingUrl : null);


  


  useEffect(() => {
    if (!playerUrl) return;
    const audio = new Audio(playerUrl);
    audioRef.current = audio;
    audio.addEventListener("timeupdate",      () => setProgress(audio.currentTime));
    audio.addEventListener("loadedmetadata",  () => setAudioDur(audio.duration));
    audio.addEventListener("ended",           () => setPlaying(false));
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
    if (!allowed.includes(ext)) {
      setFileError(`Format non supporté (acceptés : ${allowed.join(", ")})`);
      return;
    }
    setFileError("");
    setFile(f);
    if (playing && audioRef.current) { audioRef.current.pause(); setPlaying(false); }
  }

  // ── Données ─────────────────────────────────────────────────────────────────

  const { data: rawSirenes }      = useQuery({ queryKey: ["sirenes"],                   queryFn: sirenesApi.getAll });
  const { data: rawAlertes }      = useQuery({ queryKey: ["alertes"],                   queryFn: alertesApi.getAll });
  const { data: rawTypes }        = useQuery({ queryKey: ["alerte-types"],              queryFn: alerteTypesApi.getAll });
  const { data: rawCategories }   = useQuery({ queryKey: ["categorie-alertes"],         queryFn: categorieAlertesApi.getAll });
  const { data: rawSousCats }     = useQuery({ queryKey: ["sous-categorie-alertes"],    queryFn: sousCategorieAlertesApi.getAll });

  // ← Nouvel endpoint : retourne [{ sousCategorieId, sireneId }]
  const { data: rawCombinations } = useQuery({
    queryKey: ["alerte-audios-used-combinations"],
    queryFn:  alerteAudiosApi.getUsedCombinations,
  });

  const { data: rawCustomers } = useQuery({
    queryKey: ["customers"],
    queryFn:  customersApi.getAll,
    enabled:  isSuperAdmin,   // ne charge que si superadmin
  });
  const allCustomers = useMemo(() => toArr(rawCustomers), [rawCustomers]);

  const sirenes = useMemo(() =>
    toArr(rawSirenes).filter((s: any) =>
      s.isActive &&
      (
        isSuperAdmin ||
        s.customers?.some((c: any) => c.id === myCustomerId)
      )
    ),
    [rawSirenes, isSuperAdmin, myCustomerId]
  );

  const alertes      = useMemo(() => toArr(rawAlertes),    [rawAlertes]);
  const allTypes     = useMemo(() => toArr(rawTypes),      [rawTypes]);
  const allCats      = useMemo(() => toArr(rawCategories), [rawCategories]);
  const allSousCats  = useMemo(() => toArr(rawSousCats),   [rawSousCats]);

  /**
   * Combinaisons utilisées, en excluant celles de l'audio en cours d'édition
   * (pour ne pas bloquer les champs en mode edit).
   */
  const usedCombinations: UsedCombination[] = useMemo(() => {
    const all = toArr(rawCombinations) as UsedCombination[];
    if (!isEdit || !initialData?.id) return all;
    // En édition : exclure les combinaisons qui appartiennent à CET audio
    // (le backend devrait idéalement renvoyer l'audioId dans chaque combinaison,
    //  sinon on exclut celles qui correspondent à la sous-cat + sirènes initiales)
    const initSousCat   = initialData.sousCategorieAlerteId;
    const initSireneIds = initialData.sireneIds ?? (initialData.sireneId ? [initialData.sireneId] : []);
    return all.filter(c =>
      !(c.sousCategorieAlerteId === initSousCat && initSireneIds.includes(c.sireneId))
    );
  }, [rawCombinations, isEdit, initialData]);

  /**
   * Une sous-catégorie est "bloquée" pour la sélection courante si
   * TOUTES les sirènes sélectionnées ont déjà cette sous-cat utilisée.
   *
   * Si aucune sirène n'est sélectionnée → aucune sous-cat bloquée.
   * Si une seule sirène est sélectionnée et libre pour cette sous-cat → disponible.
   */
  function isSousCatBlocked(sousCatId: number): boolean {
    if (form.sireneIds.length === 0) return false;
    return form.sireneIds.every(sireneId =>
      usedCombinations.some(c => c.sousCategorieAlerteId === sousCatId && c.sireneId === sireneId)
    );
  }

  function getSousCatConflictLabel(sousCatId: number): string | null {
    if (form.sireneIds.length === 0) return null;
    const conflicting = form.sireneIds.filter(sireneId =>
      usedCombinations.some(c => c.sousCategorieAlerteId === sousCatId && c.sireneId === sireneId)
    );
    if (conflicting.length === 0) return null;
    if (conflicting.length === form.sireneIds.length) return " (déjà utilisé pour toutes les sirènes)";
    return ` (déjà utilisé pour ${conflicting.length}/${form.sireneIds.length} sirènes)`;
  }

  const filteredTypes    = useMemo(() =>
    form.alerteId      ? allTypes.filter((t: any) => Number(t.alerteId)          === form.alerteId)      : allTypes,
    [allTypes, form.alerteId]
  );
  const filteredCats     = useMemo(() =>
    form.alerteTypeId  ? allCats.filter((c: any)  => Number(c.alerteTypeId)      === form.alerteTypeId)  : allCats,
    [allCats, form.alerteTypeId]
  );
  const filteredSousCats = useMemo(() =>
    form.categorieAlerteId ? allSousCats.filter((s: any) => Number(s.categorieAlerteId) === form.categorieAlerteId) : allSousCats,
    [allSousCats, form.categorieAlerteId]
  );

  // ── Soumission ───────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isEdit && !file) { setFileError("Le fichier audio est obligatoire"); return; }
    await onSubmit(
      {
        ...form,
        customerId: isSuperAdmin ? form.customerId : myCustomerId,
      },
      file ?? undefined
    );
  }

  const isValid = form.sireneIds.length > 0
    && (isEdit || !!file) && (
      isClient
        ? (form.newSousCatName?.trim().length ?? 0) > 0 && form.categorieAlerteId > 0
        : form.sousCategorieAlerteId > 0 && !isSousCatBlocked(form.sousCategorieAlerteId)
  );
    
  // ── Rendu ────────────────────────────────────────────────────────────────────


  const [customerSearch, setCustomerSearch] = useState("");
  const [customerOpen,   setCustomerOpen]   = useState(false);
  const customerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (customerRef.current && !customerRef.current.contains(e.target as Node))
        setCustomerOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredCustomers = useMemo(() =>
    allCustomers.filter((c: any) =>
      c.name?.toLowerCase().includes(customerSearch.toLowerCase())
    ),
    [allCustomers, customerSearch]
  );

  const selectedCustomer = useMemo(() =>
    allCustomers.find((c: any) => c.id === form.customerId) ?? null,
    [allCustomers, form.customerId]
  );

  return (
    <div className="sirene-form-page">
      <div className="sirene-page-header">
        <button type="button" className="btn-back" onClick={() => navigate("/alerte-audios")}>
          <ChevronLeft size={16} /> Retour à la liste
        </button>
        <h1 className="sirene-title">{isEdit ? "Modifier l'audio" : "Nouvel audio d'alerte"}</h1>
        <p className="sirene-subtitle">
          {isEdit ? "Modifiez les informations" : "Uploadez un fichier audio et remplissez le formulaire"}
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
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp3,.wav,.ogg,.aac,.m4a,.opus"
              style={{ display: "none" }}
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            {file ? (
              <div className="audio-file-info">
                <Music size={20} className="audio-file-icon" />
                <div>
                  <p className="audio-filename">{file.name}</p>
                  <p className="audio-filesize">{(file.size / 1024 / 1024).toFixed(2)} Mo</p>
                </div>
                <button
                  type="button"
                  className="audio-remove-file"
                  onClick={e => { e.stopPropagation(); setFile(null); setPlaying(false); }}
                >
                  <X size={14} />
                </button>
              </div>
            ) : isEdit && initialData?.originalFilename ? (
              <div className="audio-file-info">
                <Music size={20} className="audio-file-icon" />
                <div>
                  <p className="audio-filename">{initialData.originalFilename}</p>
                  <p className="audio-filesize" style={{ color: "#94a3b8" }}>
                    Fichier actuel — cliquez pour remplacer
                  </p>
                </div>
              </div>
            ) : (
              <div className="audio-dropzone-placeholder">
                <Upload size={28} style={{ color: "#94a3b8", marginBottom: 8 }} />
                <p>Glissez un fichier audio ou <span style={{ color: "#152a8a", fontWeight: 600 }}>cliquez pour choisir</span></p>
                <p style={{ fontSize: "0.74rem", color: "#94a3b8", marginTop: 4 }}>MP3, WAV, OGG, AAC, M4A, OPUS</p>
              </div>
            )}
          </div>
          {fileError && <span className="field-error">{fileError}</span>}
          {playerUrl && (
            <div className="audio-player">
              <button type="button" className="player-play-btn" onClick={togglePlay}>
                {playing ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <span className="player-time">{fmt(progress)}</span>
              <input
                type="range"
                className="player-seek"
                min={0}
                max={audioDur || 100}
                step={0.1}
                value={progress}
                onChange={e => {
                  if (audioRef.current) audioRef.current.currentTime = Number(e.target.value);
                  setProgress(Number(e.target.value));
                }}
              />
              <span className="player-time">{fmt(audioDur)}</span>
            </div>
          )}
          {isEdit && initialData?.mobileId && (
            <div className="audio-mobileid-info">
              <span className="audio-mobileid-label">Mobile ID généré :</span>
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
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ex: Sirène niveau 2"
              />
            </div>
            <div className="sirene-field" style={{ gridColumn: "1/-1" }}>
              <label>Description</label>
              <textarea
                rows={2}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Description de l'audio…"
                style={{ resize: "vertical" }}
              />
            </div>
          </div>
        </div>
        
        {/* ── Sirènes ── */}
        <div className="sirene-form-card">
          <SearchableMultiSelect
            label="Sirènes de destination *"
            placeholder="Choisir les sirènes…"
            items={sirenes}
            selected={form.sireneIds}
            onChange={(ids: number[]) => {
              // Quand on change les sirènes, réinitialiser la sous-cat
              // si elle devient bloquée avec la nouvelle sélection
              setForm(f => {
                const nextIds = ids;
                const currentSousCat = f.sousCategorieAlerteId;
                const wouldBeBlocked = currentSousCat > 0 && nextIds.length > 0
                  && nextIds.every(sid =>
                    usedCombinations.some(c => c.sousCategorieAlerteId === currentSousCat && c.sireneId === sid)
                  );
                return {
                  ...f,
                  sireneIds:             nextIds,
                  sousCategorieAlerteId: wouldBeBlocked ? 0 : currentSousCat,
                };
              });
            }}
            disabled={isEdit}
          />
          {form.sireneIds.length > 0 && (
            <p className="text-xs text-slate-400 mt-1">
              {form.sireneIds.length} sirène{form.sireneIds.length > 1 ? "s" : ""} sélectionnée{form.sireneIds.length > 1 ? "s" : ""}
            </p>
          )}
        </div>

        {isSuperAdmin && (
          <div className="sirene-form-card">
          <div className="sirene-section-title">Assigner à un client (optionnel)</div>

          <div ref={customerRef} className="relative">
            <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">
              Client
            </label>

            {/* Champ de recherche */}
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={selectedCustomer ? selectedCustomer.name : customerSearch}
                onFocus={() => { setCustomerOpen(true); setCustomerSearch(""); }}
                onChange={e => {
                  setCustomerSearch(e.target.value);
                  setCustomerOpen(true);
                  if (!e.target.value) setForm(f => ({ ...f, customerId: null }));
                }}
                placeholder="Rechercher un client… (laisser vide = audio global)"
                className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none"
              />
              {form.customerId && (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => { setForm(f => ({ ...f, customerId: null })); setCustomerSearch(""); }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

              {/* Dropdown résultats */}
              {customerOpen && !form.customerId && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                  <div className="max-h-48 overflow-y-auto">
                    {filteredCustomers.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">Aucun client trouvé</div>
                    ) : (
                      filteredCustomers.map((c: any) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setForm(f => ({ ...f, customerId: c.id }));
                            setCustomerSearch(c.name);
                            setCustomerOpen(false);
                          }}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm cursor-pointer hover:bg-slate-50 text-slate-700"
                        >
                          <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold flex items-center justify-center">
                            {c.name?.[0]?.toUpperCase()}
                          </span>
                          {c.name}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              <p className="text-xs text-slate-400 mt-1.5">
                Sans client assigné, l'audio sera disponible pour toutes les sirènes.
              </p>
            </div>
          </div>
        )}



        {/* ── Hiérarchie cascade ── */}
        <div className="sirene-form-card">
          <div className="sirene-section-title">Hiérarchie (cascade)</div>
          <div className="sirene-fields-grid">

            <div className="sirene-field">
              <label>Alerte</label>
              <select
                value={form.alerteId || ""}
                onChange={e => {
                  const v = Number(e.target.value);
                  setForm(f => ({ ...f, alerteId: v, alerteTypeId: 0, categorieAlerteId: 0, sousCategorieAlerteId: 0 }));
                }}
              >
                <option value="">— Toutes les alertes —</option>
                {alertes.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>

            <div className="sirene-field">
              <label>Type d'alerte</label>
              <select
                value={form.alerteTypeId || ""}
                disabled={!form.alerteId}
                onChange={e => {
                  const v = Number(e.target.value);
                  setForm(f => ({ ...f, alerteTypeId: v, categorieAlerteId: 0, sousCategorieAlerteId: 0 }));
                }}
              >
                <option value="">{!form.alerteId ? "Choisir d'abord une alerte" : "— Tous les types —"}</option>
                {filteredTypes.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            <div className="sirene-field">
              <label>Catégorie</label>
              <select
                value={form.categorieAlerteId || ""}
                disabled={!form.alerteTypeId}
                onChange={e => {
                  const v = Number(e.target.value);
                  setForm(f => ({ ...f, categorieAlerteId: v, sousCategorieAlerteId: 0 }));
                }}
              >
                <option value="">{!form.alerteTypeId ? "Choisir d'abord un type" : "— Toutes les catégories —"}</option>
                {filteredCats.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="sirene-field">
              <label>
                Sous-catégorie <span className="required">*</span>
              </label>

              {isClient ? (
                /* Client : saisie libre du nom → backend crée la sous-cat */
                <>
                  <input
                    type="text"
                    required
                    placeholder="Nom de la sous-catégorie…"
                    value={form.newSousCatName ?? ""}
                    disabled={!form.categorieAlerteId}
                    onChange={e => setForm(f => ({ ...f, newSousCatName: e.target.value }))}
                    className="sirene-input" // adapter à votre classe input existante
                  />
                  {!form.categorieAlerteId && (
                    <p className="text-xs text-amber-600 mt-1">
                      ⚠ Choisissez d'abord une catégorie
                    </p>
                  )}
                </>
              ) : (
                /* Superadmin : select existant */
                <>
                  <select
                    required
                    value={form.sousCategorieAlerteId || ""}
                    disabled={!form.categorieAlerteId || form.sireneIds.length === 0}
                    onChange={e => setForm(f => ({ ...f, sousCategorieAlerteId: Number(e.target.value) }))}
                  >
                    <option value="">
                      {!form.categorieAlerteId
                        ? "Choisir d'abord une catégorie"
                        : form.sireneIds.length === 0
                          ? "Choisir d'abord des sirènes"
                          : "— Choisir —"}
                    </option>
                    {filteredSousCats.map((s: any) => {
                      const blocked       = isSousCatBlocked(s.id);
                      const conflictLabel = getSousCatConflictLabel(s.id);
                      return (
                        <option key={s.id} value={s.id} disabled={blocked}>
                          {s.name}{conflictLabel ?? ""}
                        </option>
                      );
                    })}
                  </select>
                  {form.sireneIds.length === 0 && form.categorieAlerteId > 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      ⚠ Sélectionnez d'abord les sirènes pour voir les sous-catégories disponibles
                    </p>
                  )}
                </>
              )}
            </div>

          </div>
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="sirene-form-actions">
          <button type="button" className="btn-cancel" onClick={() => navigate("/alerte-audios")}>
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