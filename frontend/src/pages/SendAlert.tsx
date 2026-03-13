import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { alertesApi,  } from "@/services/alertes.api";
import {  alerteTypesApi } from "@/services/alertetypes.api";
import {  sousCategorieAlertesApi } from "@/services/souscategorieAlerte.api";
import {  categorieAlertesApi } from "@/services/categoriealertes.api";
import { alerteAudiosApi } from "@/services/alerteaudio.api";
import { provincesApi } from "@/services/province.api";
import { regionsApi }   from "@/services/region.api";
import { districtsApi } from "@/services/districts.api";
import { sendAlerteApi, SendAlertePayload } from "@/services/sendalerte.api";
import {
  CheckCircle, ChevronRight, ChevronLeft, Send, Loader2,
  AlertTriangle, Radio, Play, Pause, Music, Clock, Zap,
} from "lucide-react";
import "@/styles/send-alerte.css";

// ── IDs des alertes à exclure (alerte automatique) ───────────────────
const EXCLUDED_ALERTE_NAMES = ["alerte automatique"];

const STEPS = [
  { id: 0, label: "Alerte",         desc: "Choisissez le type de catastrophe ou communication" },
  { id: 1, label: "Type",           desc: "Sélectionnez le type spécifique" },
  { id: 2, label: "Catégorie",      desc: "Sélectionnez la catégorie d'alerte" },
  { id: 3, label: "Sous-catégorie", desc: "Choisissez le message audio à envoyer" },
  { id: 4, label: "Zones",          desc: "Sélectionnez les zones géographiques cibles" },
  { id: 5, label: "Planification",  desc: "Définissez l'heure d'envoi" },
  { id: 6, label: "Confirmation",   desc: "Vérifiez et confirmez l'envoi" },
];

const SCHEDULE_OPTIONS = [
  { value: "now",  label: "Maintenant",    hours: 0  },
  { value: "1h",   label: "Dans 1 heure",  hours: 1  },
  { value: "2h",   label: "Dans 2 heures", hours: 2  },
  { value: "3h",   label: "Dans 3 heures", hours: 3  },
  { value: "6h",   label: "Dans 6 heures", hours: 6  },
  { value: "12h",  label: "Dans 12 heures",hours: 12 },
  { value: "24h",  label: "Dans 24 heures",hours: 24 },
];

function MiniPlayer({ url }: { url: string }) {
  const [playing, setPlaying] = useState(false);
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

  function toggle(e: React.MouseEvent) {
    e.stopPropagation();
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else         { a.play();  setPlaying(true);  }
  }

  function fmt(s: number) {
    const m = Math.floor(s/60), sec = Math.floor(s%60);
    return `${m}:${sec.toString().padStart(2,"0")}`;
  }

  return (
    <div className="sa-mini-player" onClick={e => e.stopPropagation()}>
      <button className="sa-play-btn" onClick={toggle}>
        {playing ? <Pause size={12}/> : <Play size={12}/>}
      </button>
      <input type="range" className="sa-seek" min={0} max={duration||1} step={0.1}
        value={progress} onChange={e => { if (audioRef.current) audioRef.current.currentTime = +e.target.value; setProgress(+e.target.value); }}/>
      <span className="sa-time">{fmt(progress)} / {fmt(duration)}</span>
    </div>
  );
}

function OptionCard({ selected, onClick, title, subtitle, icon: Icon, badge, disabled }: any) {
  return (
    <button
      className={`sa-option-card${selected ? " selected" : ""}${disabled ? " disabled" : ""}`}
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      {Icon && <Icon size={20} className="sa-option-icon"/>}
      <div className="sa-option-text">
        <span className="sa-option-title">{title}</span>
        {subtitle && <span className="sa-option-subtitle">{subtitle}</span>}
      </div>
      {badge && <span className="sa-option-badge">{badge}</span>}
      {selected && <CheckCircle size={16} className="sa-option-check"/>}
    </button>
  );
}

export default function SendAlerte() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [alerteId,         setAlerteId]         = useState<number|null>(null);
  const [alerteTypeId,     setAlerteTypeId]      = useState<number|null>(null);
  const [categorieId,      setCategorieId]       = useState<number|null>(null);
  const [sousCategorieId,  setSousCategorieId]   = useState<number|null>(null);
  const [selectedProvinces,setSelectedProvinces] = useState<number[]>([]);
  const [selectedRegions,  setSelectedRegions]   = useState<number[]>([]);
  const [selectedDistricts,setSelectedDistricts] = useState<number[]>([]);
  const [schedule,         setSchedule]          = useState("now");
  const [success,          setSuccess]           = useState<any>(null);

  const toArr = (r: any) => Array.isArray(r) ? r : r?.response ?? [];

  // ── Données ──────────────────────────────────────────────────────────
  const { data: rawAlertes }   = useQuery({ queryKey: ["alertes"],                 queryFn: () => alertesApi.getAll() });
  const { data: rawTypes }     = useQuery({ queryKey: ["alerte-types"],            queryFn: () => alerteTypesApi.getAll(), enabled: !!alerteId });
  const { data: rawCats }      = useQuery({ queryKey: ["categorie-alertes"],       queryFn: () => categorieAlertesApi.getAll(), enabled: !!alerteTypeId });
  const { data: rawSousCats }  = useQuery({ queryKey: ["sous-categorie-alertes"],  queryFn: () => sousCategorieAlertesApi.getAll(), enabled: !!categorieId });
  const { data: rawAudios }    = useQuery({ queryKey: ["alerte-audios"],           queryFn: () => alerteAudiosApi.getAll() });
  const { data: rawProvinces } = useQuery({ queryKey: ["provinces"],               queryFn: () => provincesApi.getAll() });
  const { data: rawRegions }   = useQuery({ queryKey: ["regions"],                 queryFn: () => regionsApi.getAll() });
  const { data: rawDistricts } = useQuery({ queryKey: ["districts"],               queryFn: () => districtsApi.getAll() });

  const alertes   = useMemo(() => toArr(rawAlertes).filter((a: any) => !EXCLUDED_ALERTE_NAMES.includes(a.name.toLowerCase())), [rawAlertes]);
  const allTypes  = useMemo(() => toArr(rawTypes),    [rawTypes]);
  const allCats   = useMemo(() => toArr(rawCats),     [rawCats]);
  const allSousCats = useMemo(() => toArr(rawSousCats), [rawSousCats]);
  const allAudios   = useMemo(() => toArr(rawAudios),   [rawAudios]);
  const provinces   = useMemo(() => toArr(rawProvinces),[rawProvinces]);
  const allRegions  = useMemo(() => toArr(rawRegions),  [rawRegions]);
  const allDistricts= useMemo(() => toArr(rawDistricts),[rawDistricts]);

  const types     = useMemo(() => alerteId    ? allTypes.filter((t: any) => Number(t.alerteId) === alerteId)       : [], [allTypes, alerteId]);
  const cats      = useMemo(() => alerteTypeId? allCats.filter((c: any) => Number(c.alerteTypeId) === alerteTypeId): [], [allCats, alerteTypeId]);
  const sousCats  = useMemo(() => categorieId ? allSousCats.filter((s: any) => Number(s.categorieAlerteId) === categorieId) : [], [allSousCats, categorieId]);

  const filteredRegions   = useMemo(() => selectedProvinces.length ? allRegions.filter((r: any) => selectedProvinces.includes(Number(r.provinceId ?? r.province_id))) : allRegions, [allRegions, selectedProvinces]);
  const filteredDistricts = useMemo(() => selectedRegions.length   ? allDistricts.filter((d: any) => selectedRegions.includes(Number(d.regionId ?? d.region_id))) : allDistricts, [allDistricts, selectedRegions]);

  // Aperçu sirènes
  const { data: previewData, isFetching: previewLoading } = useQuery({
    queryKey: ["sirene-preview", selectedProvinces, selectedRegions, selectedDistricts],
    queryFn:  () => sendAlerteApi.preview(selectedProvinces, selectedRegions, selectedDistricts),
    enabled:  step === 4 || step === 6,
  });

  // Audio lié à la sous-catégorie choisie
  const linkedAudio = useMemo(() => sousCategorieId ? allAudios.find((a: any) => Number(a.sousCategorieAlerteId) === sousCategorieId) : null, [allAudios, sousCategorieId]);

  // Sélections nommées pour la confirmation
  const selAlerte     = alertes.find((a: any) => a.id === alerteId);
  const selType       = types.find((t: any) => t.id === alerteTypeId);
  const selCat        = cats.find((c: any) => c.id === categorieId);
  const selSousCat    = sousCats.find((s: any) => s.id === sousCategorieId);
  const selSchedule   = SCHEDULE_OPTIONS.find(o => o.value === schedule);

  // ── Mutation envoi ────────────────────────────────────────────────────
  const sendMut = useMutation({
    mutationFn: (payload: SendAlertePayload) => sendAlerteApi.send(payload),
    onSuccess: (result) => setSuccess(result),
    onError: () => {},
  });

  function buildPayload(): SendAlertePayload {
    const scheduledDate = schedule !== "now"
      ? new Date(Date.now() + SCHEDULE_OPTIONS.find(o => o.value === schedule)!.hours * 3600000).toISOString()
      : undefined;
    return {
      alerteId:              alerteId!,
      alerteTypeId:          alerteTypeId!,
      categorieAlerteId:     categorieId!,
      sousCategorieAlerteId: sousCategorieId!,
      provinceIds:           selectedProvinces,
      regionIds:             selectedRegions,
      districtIds:           selectedDistricts,
      sendingTimeAfterAlerte: scheduledDate,
    };
  }

  function canNext() {
    switch (step) {
      case 0: return !!alerteId;
      case 1: return !!alerteTypeId;
      case 2: return !!categorieId;
      case 3: return !!sousCategorieId;
      case 4: return (selectedProvinces.length + selectedRegions.length + selectedDistricts.length) > 0;
      case 5: return !!schedule;
      default: return true;
    }
  }

  function toggle(arr: number[], setArr: any, id: number) {
    setArr((p: number[]) => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  }

  function resetAndGo() {
    setStep(0); setAlerteId(null); setAlerteTypeId(null); setCategorieId(null);
    setSousCategorieId(null); setSelectedProvinces([]); setSelectedRegions([]);
    setSelectedDistricts([]); setSchedule("now"); setSuccess(null);
  }

  const sireneCount = (previewData as any)?.sireneCount ?? 0;
  const sirenePrev  = (previewData as any)?.sirenes ?? [];

  // ── Écran succès ──────────────────────────────────────────────────────
  if (success) {
    return (
      <AppLayout>
        <div className="sa-success-page">
          <div className="sa-success-card">
            <div className="sa-success-icon"><CheckCircle size={48}/></div>
            <h2>Alerte envoyée avec succès</h2>
            <p>L'opération s'est déroulée correctement.</p>
            <div className="sa-success-stats">
              <div><span>{success.created}</span><label>Notifications créées</label></div>
              <div><span>{success.sent}</span><label>SMS envoyés</label></div>
              <div><span>{success.planned}</span><label>Planifiés</label></div>
            </div>
            <div className="sa-success-actions">
              <button className="btn-cancel" onClick={() => navigate("/notifications")}>Voir les notifications</button>
              <button className="btn-primary" onClick={resetAndGo}>Nouvelle alerte</button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="sa-page">
        <div className="sa-header">
          <h1>Envoyer une alerte</h1>
          <p>Configurez et envoyez une alerte aux sirènes ciblées</p>
        </div>

        {/* Stepper */}
        <div className="sa-stepper">
          {STEPS.map((s, i) => (
            <div key={s.id} className={`sa-step${i === step ? " active" : ""}${i < step ? " done" : ""}`}>
              <div className="sa-step-dot">
                {i < step ? <CheckCircle size={14}/> : <span>{i+1}</span>}
              </div>
              <span className="sa-step-label">{s.label}</span>
              {i < STEPS.length - 1 && <div className="sa-step-line"/>}
            </div>
          ))}
        </div>

        {/* Contenu */}
        <div className="sa-card">
          <div className="sa-card-header">
            <h2>{STEPS[step].label}</h2>
            <p>{STEPS[step].desc}</p>
          </div>
          <div className="sa-card-body">

            {/* STEP 0 — Alerte */}
            {step === 0 && (
              <div className="sa-options-grid">
                {alertes.map((a: any) => (
                  <OptionCard key={a.id} selected={alerteId === a.id} title={a.name}
                    icon={AlertTriangle}
                    onClick={() => { setAlerteId(a.id); setAlerteTypeId(null); setCategorieId(null); setSousCategorieId(null); }}
                  />
                ))}
              </div>
            )}

            {/* STEP 1 — Type */}
            {step === 1 && (
              <div className="sa-options-grid">
                {types.map((t: any) => (
                  <OptionCard key={t.id} selected={alerteTypeId === t.id} title={t.name}
                    onClick={() => { setAlerteTypeId(t.id); setCategorieId(null); setSousCategorieId(null); }}
                  />
                ))}
              </div>
            )}

            {/* STEP 2 — Catégorie */}
            {step === 2 && (
              <div className="sa-options-grid sa-options-grid--single">
                {cats.map((c: any) => (
                  <OptionCard key={c.id} selected={categorieId === c.id} title={c.name}
                    onClick={() => { setCategorieId(c.id); setSousCategorieId(null); }}
                  />
                ))}
              </div>
            )}

            {/* STEP 3 — Sous-catégorie + audio */}
            {step === 3 && (
              <div className="sa-options-grid">
                {sousCats.map((s: any) => {
                  const audio = allAudios.find((a: any) => Number(a.sousCategorieAlerteId) === s.id);
                  const isSelected = sousCategorieId === s.id;
                  return (
                    <div key={s.id} className={`sa-sous-cat-card${isSelected ? " selected" : ""}`}
                      onClick={() => setSousCategorieId(s.id)}>
                      <div className="sa-sous-cat-header">
                        <div className="sa-sous-cat-info">
                          <Music size={15} className="sa-sous-cat-icon"/>
                          <div>
                            <span className="sa-option-title">{s.name}</span>
                            {audio
                              ? <span className="sa-audio-name">{audio.name || audio.originalFilename}</span>
                              : <span className="sa-no-audio">Aucun audio associé</span>}
                          </div>
                        </div>
                        {isSelected && <CheckCircle size={16} className="sa-option-check"/>}
                      </div>
                      {audio && isSelected && (
                        <MiniPlayer url={alerteAudiosApi.audioUrl(audio.audio)}/>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* STEP 4 — Zones */}
            {step === 4 && (
              <div className="sa-zones">
                <div className="sa-zone-group">
                  <h4>Provinces</h4>
                  <div className="sa-checkboxes">
                    {provinces.map((p: any) => (
                      <label key={p.id} className={`sa-checkbox${selectedProvinces.includes(p.id) ? " checked" : ""}`}>
                        <input type="checkbox" checked={selectedProvinces.includes(p.id)} onChange={() => toggle(selectedProvinces, setSelectedProvinces, p.id)}/>
                        {p.name}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="sa-zone-group">
                  <h4>Régions {selectedProvinces.length > 0 && <span className="sa-zone-filter-hint">(filtrées par province)</span>}</h4>
                  <div className="sa-checkboxes">
                    {filteredRegions.map((r: any) => (
                      <label key={r.id} className={`sa-checkbox${selectedRegions.includes(r.id) ? " checked" : ""}`}>
                        <input type="checkbox" checked={selectedRegions.includes(r.id)} onChange={() => toggle(selectedRegions, setSelectedRegions, r.id)}/>
                        {r.name}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="sa-zone-group">
                  <h4>Districts {selectedRegions.length > 0 && <span className="sa-zone-filter-hint">(filtrés par région)</span>}</h4>
                  <div className="sa-checkboxes">
                    {filteredDistricts.map((d: any) => (
                      <label key={d.id} className={`sa-checkbox${selectedDistricts.includes(d.id) ? " checked" : ""}`}>
                        <input type="checkbox" checked={selectedDistricts.includes(d.id)} onChange={() => toggle(selectedDistricts, setSelectedDistricts, d.id)}/>
                        {d.name}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Aperçu sirènes */}
                <div className="sa-sirene-preview">
                  <div className="sa-sirene-preview-header">
                    <Radio size={14}/>
                    {previewLoading ? <span>Calcul en cours…</span>
                      : <span><strong>{sireneCount}</strong> sirène{sireneCount > 1 ? "s" : ""} active{sireneCount > 1 ? "s" : ""} dans les zones sélectionnées</span>}
                  </div>
                  {sirenePrev.length > 0 && (
                    <div className="sa-sirene-list">
                      {sirenePrev.slice(0, 8).map((s: any) => (
                        <span key={s.id} className="sa-sirene-chip">{s.imei}{s.village?.name ? ` — ${s.village.name}` : ""}</span>
                      ))}
                      {sirenePrev.length > 8 && <span className="sa-sirene-chip sa-sirene-more">+{sirenePrev.length - 8} autres</span>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 5 — Planification */}
            {step === 5 && (
              <div className="sa-schedule">
                {SCHEDULE_OPTIONS.map(opt => (
                  <button key={opt.value} type="button"
                    className={`sa-schedule-card${schedule === opt.value ? " selected" : ""}`}
                    onClick={() => setSchedule(opt.value)}>
                    {opt.value === "now" ? <Zap size={16}/> : <Clock size={16}/>}
                    <span>{opt.label}</span>
                    {schedule === opt.value && <CheckCircle size={14} className="sa-option-check"/>}
                  </button>
                ))}
              </div>
            )}

            {/* STEP 6 — Confirmation */}
            {step === 6 && (
              <div className="sa-confirm">
                <div className="sa-confirm-grid">
                  {[
                    ["Alerte",         selAlerte?.name],
                    ["Type",           selType?.name],
                    ["Catégorie",      selCat?.name],
                    ["Sous-catégorie", selSousCat?.name],
                    ["Zones",          `${selectedProvinces.length} prov. · ${selectedRegions.length} rég. · ${selectedDistricts.length} dist.`],
                    ["Planification",  selSchedule?.label],
                    ["Sirènes ciblées", previewLoading ? "…" : `${sireneCount} sirène${sireneCount>1?"s":""}`],
                  ].map(([label, value]) => (
                    <div key={label as string} className="sa-confirm-item">
                      <span className="sa-confirm-label">{label}</span>
                      <span className="sa-confirm-value">{value || "—"}</span>
                    </div>
                  ))}
                </div>

                {linkedAudio && (
                  <div className="sa-confirm-audio">
                    <Music size={14}/>
                    <span>Audio : <strong>{linkedAudio.name || linkedAudio.originalFilename}</strong> — mobileId : <code>{linkedAudio.mobileId}</code></span>
                    <MiniPlayer url={alerteAudiosApi.audioUrl(linkedAudio.audio)}/>
                  </div>
                )}

                <div className="sa-confirm-warning">
                  <AlertTriangle size={15}/>
                  <span>
                    {schedule === "now"
                      ? `${sireneCount} SMS vont être envoyés immédiatement via Orange Madagascar.`
                      : `${sireneCount} SMS seront envoyés ${selSchedule?.label?.toLowerCase()}.`}
                  </span>
                </div>

                {sendMut.isError && (
                  <div className="form-error">{(sendMut.error as any)?.message || "Erreur lors de l'envoi"}</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="sa-nav">
          <button className="btn-cancel" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
            <ChevronLeft size={15}/> Précédent
          </button>
          {step < STEPS.length - 1 ? (
            <button className="btn-primary" onClick={() => setStep(s => s + 1)} disabled={!canNext()}>
              Suivant <ChevronRight size={15}/>
            </button>
          ) : (
            <button className="btn-send" onClick={() => sendMut.mutate(buildPayload())} disabled={sendMut.isPending || sireneCount === 0}>
              {sendMut.isPending ? <><Loader2 size={15} className="spin"/> Envoi en cours…</> : <><Send size={15}/> Envoyer l'alerte</>}
            </button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}