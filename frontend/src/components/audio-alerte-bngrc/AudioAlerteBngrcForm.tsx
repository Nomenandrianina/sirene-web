import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate }                           from "react-router-dom";
import { useQuery }                              from "@tanstack/react-query";
import { ChevronLeft, Loader2, Play, Pause, Music, X, Radio } from "lucide-react";
import { alerteBngrcApi} from "@/services/alertebngrc.api";
import { typeAlerteBngrcApi} from "@/services/typeAlerteBngrc.api";
import { categorieAlerteBngrcApi} from "@/services/categorieAlerteBngrc.api";
import { audioAlerteBngrcApi } from "@/services/audioAlerteBngrc.api";
import { sirenesApi} from "@/services/sirene.api";
import "@/styles/sirene-form.css";

// ── Mini lecteur audio ────────────────────────────────────────────────────────
function MiniPlayer({ url }: { url: string }) {
  const [playing,  setPlaying]  = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const a = new Audio(url);
    audioRef.current = a;
    a.addEventListener("timeupdate",     () => setProgress(a.currentTime));
    a.addEventListener("loadedmetadata", () => setDuration(a.duration));
    a.addEventListener("ended",          () => setPlaying(false));
    return () => { a.pause(); a.src = ""; };
  }, [url]);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="sa-mini-player" style={{ marginTop: 8 }}>
      <button className="sa-play-btn" type="button"
        onClick={() => {
          const a = audioRef.current;
          if (!a) return;
          if (playing) { a.pause(); setPlaying(false); }
          else         { a.play();  setPlaying(true); }
        }}>
        {playing ? <Pause size={12} /> : <Play size={12} />}
      </button>
      <input type="range" className="sa-seek" min={0} max={duration || 1} step={1}
        value={progress}
        onChange={e => {
          if (audioRef.current) audioRef.current.currentTime = +e.target.value;
          setProgress(+e.target.value);
        }} />
      <span className="sa-time">{fmt(progress)} / {fmt(duration)}</span>
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────
export interface AudioAlerteBngrcFormData {
  name?:                  string;
  description?:           string;
  mobileId:               string;
  categorieAlerteBngrcId: number | "";
  alerteBngrcId?:         number | "";
  typeAlerteBngrcId?:     number | "";
  sireneIds:              number[];
  file?:                  File | null;
}

interface Props {
  initialData?: Partial<AudioAlerteBngrcFormData> & {
    id?:            number;
    audio?:         string;   // chemin existant pour lecture
    originalFilename?: string;
  };
  onSubmit: (formData: FormData) => Promise<void>;
  loading:  boolean;
  error?:   string;
}

// ── Composant ─────────────────────────────────────────────────────────────────
export function AudioAlerteBngrcForm({ initialData, onSubmit, loading, error }: Props) {
  const isEdit   = !!initialData?.id;
  const navigate = useNavigate();

  const [form, setForm] = useState<AudioAlerteBngrcFormData>({
    name:                  initialData?.name                  ?? "",
    description:           initialData?.description           ?? "",
    mobileId:              initialData?.mobileId              ?? "",
    categorieAlerteBngrcId: initialData?.categorieAlerteBngrcId ?? "",
    alerteBngrcId:         initialData?.alerteBngrcId         ?? "",
    typeAlerteBngrcId:     initialData?.typeAlerteBngrcId     ?? "",
    sireneIds:             initialData?.sireneIds             ?? [],
    file:                  null,
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initialData?.audio ? audioAlerteBngrcApi.audioUrl(initialData.audio) : null,
  );

  useEffect(() => {
    if (initialData?.id) {
      setForm({
        name:                  initialData.name                  ?? "",
        description:           initialData.description           ?? "",
        mobileId:              initialData.mobileId              ?? "",
        categorieAlerteBngrcId: initialData.categorieAlerteBngrcId ?? "",
        alerteBngrcId:         initialData.alerteBngrcId         ?? "",
        typeAlerteBngrcId:     initialData.typeAlerteBngrcId     ?? "",
        sireneIds:             initialData.sireneIds             ?? [],
        file:                  null,
      });
    }
  }, [initialData?.id]);

  // ── Données de sélection chaînées ─────────────────────────────────────────
  const { data: rawAlertes } = useQuery({ queryKey: ["alerte-bngrc"],      queryFn: () => alerteBngrcApi.getAll() });
  const { data: rawTypes }   = useQuery({ queryKey: ["type-alerte-bngrc"], queryFn: () => typeAlerteBngrcApi.getAll() });
  const { data: rawCats }    = useQuery({ queryKey: ["categorie-alerte-bngrc"], queryFn: () => categorieAlerteBngrcApi.getAll() });
  const { data: rawSirenes } = useQuery({ queryKey: ["sirenes"],            queryFn: () => sirenesApi.getAll() });

  const alertes  = Array.isArray(rawAlertes) ? rawAlertes : (rawAlertes as any)?.response ?? [];
  const allTypes = Array.isArray(rawTypes)   ? rawTypes   : (rawTypes as any)?.response   ?? [];
  const allCats  = Array.isArray(rawCats)    ? rawCats    : (rawCats as any)?.response    ?? [];
  const sirenes  = Array.isArray(rawSirenes) ? rawSirenes : (rawSirenes as any)?.response ?? [];

  const filteredTypes = useMemo(() =>
    form.alerteBngrcId
      ? allTypes.filter((t: any) => Number(t.alerteBngrcId) === Number(form.alerteBngrcId))
      : allTypes,
    [allTypes, form.alerteBngrcId]);

  const filteredCats = useMemo(() =>
    form.typeAlerteBngrcId
      ? allCats.filter((c: any) => Number(c.typeAlerteBngrcId) === Number(form.typeAlerteBngrcId))
      : allCats,
    [allCats, form.typeAlerteBngrcId]);

  // ── Gestion sirènes ────────────────────────────────────────────────────────
  const [sireneSearch, setSireneSearch] = useState("");
  const filteredSirenes = useMemo(() => {
    const q = sireneSearch.toLowerCase();
    return sirenes.filter((s: any) =>
      s.name?.toLowerCase().includes(q) || s.imei?.toLowerCase().includes(q),
    );
  }, [sirenes, sireneSearch]);

  function toggleSirene(id: number) {
    setForm(f => ({
      ...f,
      sireneIds: f.sireneIds.includes(id)
        ? f.sireneIds.filter(x => x !== id)
        : [...f.sireneIds, id],
    }));
  }

  // ── Fichier audio ──────────────────────────────────────────────────────────
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setForm(prev => ({ ...prev, file: f }));
    if (f) {
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
    }
  }

  // ── Soumission → FormData ──────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    if (form.file)           fd.append("audio",                   form.file);
    if (form.name)           fd.append("name",                    form.name);
    if (form.description)    fd.append("description",             form.description);
    fd.append("mobileId",              form.mobileId);
    fd.append("categorieAlerteBngrcId", String(form.categorieAlerteBngrcId));
    if (isEdit) {
      fd.append("sireneIds", JSON.stringify(form.sireneIds));
    }
    await onSubmit(fd);
  }

  const canSubmit =
    form.mobileId.trim() &&
    form.categorieAlerteBngrcId !== "" &&
    (isEdit || !!form.file);

  const selectedSirenes = sirenes.filter((s: any) => form.sireneIds.includes(s.id));

  return (
    <div className="sirene-form-page">
      <div className="sirene-page-header">
        <button className="btn-back" onClick={() => navigate("/audio-alerte-bngrc")}>
          <ChevronLeft size={16} /> Retour à la liste
        </button>
        <h1 className="sirene-title">
          {isEdit ? "Modifier l'audio BNGRC" : "Nouvel audio BNGRC"}
        </h1>
        <p className="sirene-subtitle">
          {isEdit ? "Modifiez les informations" : "Remplissez le formulaire"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="sirene-form-layout">

        {/* ── Classification ── */}
        <div className="sirene-form-card">
          <div className="sirene-section-title">Classification</div>

          <div className="sirene-field">
            <label>Alerte BNGRC</label>
            <select value={form.alerteBngrcId}
              onChange={e => setForm(f => ({
                ...f,
                alerteBngrcId:         Number(e.target.value) || "",
                typeAlerteBngrcId:     "",
                categorieAlerteBngrcId: "",
              }))}>
              <option value="">— Toutes les alertes —</option>
              {alertes.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          <div className="sirene-field">
            <label>Type / Aléa</label>
            <select value={form.typeAlerteBngrcId}
              onChange={e => setForm(f => ({
                ...f,
                typeAlerteBngrcId:     Number(e.target.value) || "",
                categorieAlerteBngrcId: "",
              }))}>
              <option value="">— Tous les types —</option>
              {filteredTypes.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div className="sirene-field">
            <label>Catégorie BNGRC <span className="required">*</span></label>
            <select required
              value={form.categorieAlerteBngrcId}
              onChange={e => setForm(f => ({ ...f, categorieAlerteBngrcId: Number(e.target.value) || "" }))}>
              <option value="">— Sélectionner une catégorie —</option>
              {filteredCats.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        {/* ── Informations audio ── */}
        <div className="sirene-form-card">
          <div className="sirene-section-title">Informations audio</div>

          <div className="sirene-field">
            <label>Mobile ID <span className="required">*</span></label>
            <input required
              value={form.mobileId}
              onChange={e => setForm(f => ({ ...f, mobileId: e.target.value }))}
              placeholder="Ex: BNGRC_CYCLONE_ROUGE_01"
            />
            <span style={{ fontSize: 11, color: "var(--p-text-3)" }}>
              Identifiant unique envoyé aux sirènes pour déclencher l'audio
            </span>
          </div>

          <div className="sirene-field">
            <label>Nom</label>
            <input
              value={form.name ?? ""}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ex: Alerte cyclone rouge"
            />
          </div>

          <div className="sirene-field">
            <label>Description</label>
            <textarea rows={2}
              value={form.description ?? ""}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Description optionnelle…"
            />
          </div>

          <div className="sirene-field">
            <label>
              Fichier audio {!isEdit && <span className="required">*</span>}
              {isEdit && <span style={{ fontSize: 12, color: "var(--p-text-3)" }}> (laisser vide pour conserver l'actuel)</span>}
            </label>
            <input type="file" accept=".mp3,.wav,.ogg,.m4a,.aac" onChange={handleFile} />
            {initialData?.originalFilename && !form.file && (
              <span style={{ fontSize: 12, color: "var(--p-text-3)" }}>
                <Music size={12} style={{ marginRight: 4 }} />
                Fichier actuel : {initialData.originalFilename}
              </span>
            )}
            {previewUrl && <MiniPlayer url={previewUrl} />}
          </div>
        </div>

        {/* ── Sirènes associées ── */}
        {isEdit && (
          <div className="sirene-form-card">
            <div className="sirene-section-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Sirènes associées</span>
              {selectedSirenes.length > 0 && (
                <button type="button" className="btn-clear-all"
                  onClick={() => setForm(f => ({ ...f, sireneIds: [] }))}>
                  <X size={12} /> Tout désélectionner
                </button>
              )}
            </div>

            {selectedSirenes.length > 0 && (
              <div className="selected-customers-tags">
                {selectedSirenes.map((s: any) => (
                  <span key={s.id} className="customer-tag">
                    <Radio size={11} /> {s.name}
                    <button type="button" className="tag-remove" onClick={() => toggleSirene(s.id)}>
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <input
              style={{ marginBottom: 8, width: "100%", padding: "6px 10px", fontSize: 13, borderRadius: 8, border: "1px solid var(--p-border)" }}
              placeholder="Rechercher une sirène…"
              value={sireneSearch}
              onChange={e => setSireneSearch(e.target.value)}
            />

            <div className="sirene-customers-grid" style={{ maxHeight: 260, overflowY: "auto" }}>
              {filteredSirenes.map((s: any) => (
                <label key={s.id} className={`sirene-customer-chip ${form.sireneIds.includes(s.id) ? "checked" : ""}`}>
                  <input type="checkbox" checked={form.sireneIds.includes(s.id)} onChange={() => toggleSirene(s.id)} />
                  <span className="chip-dot" />
                  <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <span>{s.name}</span>
                    {s.imei && <span style={{ fontSize: 10, color: "var(--p-text-3)" }}>{s.imei}</span>}
                  </div>
                </label>
              ))}
              {filteredSirenes.length === 0 && (
                <p style={{ color: "var(--p-text-3)", fontSize: 13 }}>Aucune sirène trouvée</p>
              )}
            </div>
          </div>
        )}

        {error && <div className="form-error">{error}</div>}

        <div className="sirene-form-actions">
          <button type="button" className="btn-cancel" onClick={() => navigate("/audio-alerte-bngrc")}>Annuler</button>
          <button type="submit" className="btn-primary" disabled={loading || !canSubmit}>
            {loading && <Loader2 size={14} className="spin" />}
            {isEdit ? "Enregistrer" : "Créer l'audio"}
          </button>
        </div>
      </form>
    </div>
  );
}
