import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { typeAlerteBngrcApi } from "@/services/typeAlerteBngrc.api";
import { categorieAlerteBngrcApi } from "@/services/categorieAlerteBngrc.api";
import { audioAlerteBngrcApi } from "@/services/audioAlerteBngrc.api";
import { provincesApi } from "@/services/province.api";
import { regionsApi } from "@/services/region.api";
import { districtsApi } from "@/services/districts.api";
import { villagesApi } from "@/services/village.api";
import { communesApi } from "@/services/commune.api";
import { fokontanyApi } from "@/services/fokontany.api";
import { sendAlerteBngrcApi } from "@/services/sendAlerteBngrc.api";
import { ZonesStep } from "@/components/zone/ZoneItem";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle, ChevronRight, ChevronLeft, Send, Loader2, AlertTriangle, Music, Zap} from "lucide-react";
import { STEPS } from "@/utils/send-alerte/constants";
import { toMadagascarTime,getTypeIconComponent }from "@/utils/send-alerte/typeHelpers";
import { StepperBar } from "@/components/send-alerte/StepperBar";
import { OptionCard } from "@/components/send-alerte/OptionCard";
import { CatAudioCard } from "@/components/send-alerte/CatAudioCard";
import { MiniPlayer } from "@/components/send-alerte/MiniPlayer";

// ═══════════════════════════════════════════════════════════════════════════════
// Page principale
// ═══════════════════════════════════════════════════════════════════════════════

export default function SendAlerteBngrc() {
  const navigate   = useNavigate();
  const { user }   = useAuth();

  const [step,        setStep]        = useState(0);
  const [typeId,      setTypeId]      = useState<number | null>(null);
  const [categorieId, setCategorieId] = useState<number | null>(null);
  const [success,     setSuccess]     = useState<any>(null);

  const [selectedProvinces, setSelectedProvinces] = useState<number[]>([]);
  const [selectedRegions,   setSelectedRegions]   = useState<number[]>([]);
  const [selectedDistricts, setSelectedDistricts] = useState<number[]>([]);
  const [selectedVillages,  setSelectedVillages]  = useState<number[]>([]);
  const [selectedCommunes,  setSelectedCommunes]  = useState<number[]>([]);
  const [selectedFokontany, setSelectedFokontany] = useState<number[]>([]);

  const toArr = (r: any) => Array.isArray(r) ? r : r?.response ?? [];

  const { data: rawTypes }     = useQuery({ queryKey: ["type-alerte-bngrc"],      queryFn: () => typeAlerteBngrcApi.getAll() });
  const { data: rawCats }      = useQuery({ queryKey: ["categorie-alerte-bngrc"], queryFn: () => categorieAlerteBngrcApi.getAll() });
  const { data: rawAudios }    = useQuery({ queryKey: ["audio-alerte-bngrc"],     queryFn: () => audioAlerteBngrcApi.getAll() });
  const { data: rawProvinces } = useQuery({ queryKey: ["provinces"],              queryFn: () => provincesApi.getAll() });
  const { data: rawRegions }   = useQuery({ queryKey: ["regions"],                queryFn: () => regionsApi.getAll() });
  const { data: rawDistricts } = useQuery({ queryKey: ["districts"],              queryFn: () => districtsApi.getAll() });
  const { data: rawVillages }  = useQuery({ queryKey: ["villages"],               queryFn: () => villagesApi.getAll() });
  const { data: rawCommunes }  = useQuery({ queryKey: ["communes"],               queryFn: () => communesApi.getAll() });
  const { data: rawFokontany } = useQuery({ queryKey: ["fokontany"],              queryFn: () => fokontanyApi.getAll() });

  const allTypes     = useMemo(() => toArr(rawTypes),     [rawTypes]);
  const allCats      = useMemo(() => toArr(rawCats),      [rawCats]);
  const allAudios    = useMemo(() => toArr(rawAudios),    [rawAudios]);
  const provinces    = useMemo(() => toArr(rawProvinces), [rawProvinces]);
  const allRegions   = useMemo(() => toArr(rawRegions),   [rawRegions]);
  const allDistricts = useMemo(() => toArr(rawDistricts), [rawDistricts]);
  const allVillages  = useMemo(() => toArr(rawVillages),  [rawVillages]);
  const allCommunes  = useMemo(() => toArr(rawCommunes),  [rawCommunes]);
  const allFokontany = useMemo(() => toArr(rawFokontany), [rawFokontany]);

  const cats = useMemo(() =>
    typeId ? allCats.filter((c: any) => Number(c.typeAlerteBngrcId) === typeId) : [],
    [allCats, typeId]);

  const linkedAudio = useMemo(() =>
    categorieId
      ? allAudios.find((a: any) => Number(a.categorieAlerteBngrcId) === categorieId && a.status === "approved")
      : null,
    [allAudios, categorieId]);

  const { data: previewData, isFetching: previewLoading } = useQuery({
    queryKey: ["sirene-preview-bngrc", selectedProvinces, selectedRegions, selectedDistricts, selectedVillages],
    queryFn:  () => sendAlerteBngrcApi.preview(selectedProvinces, selectedRegions, selectedDistricts, selectedVillages),
    enabled:  step >= 1,
  });
  const sireneCount = (previewData as any)?.sireneCount ?? 0;
  const sirenePrev  = (previewData as any)?.sirenes     ?? [];

  function canNext() {
    switch (step) {
      case 0: return !!typeId;
      case 1: return (selectedProvinces.length + selectedRegions.length + selectedDistricts.length +
                      selectedCommunes.length + selectedFokontany.length + selectedVillages.length) > 0;
      case 2: return !!categorieId && !!linkedAudio;
      default: return true;
    }
  }

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Enter" && canNext() && step < STEPS.length - 1) {
      e.preventDefault(); setStep(s => s + 1);
    }
  }, [step, canNext]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const sendMut = useMutation({
    mutationFn: () => sendAlerteBngrcApi.send({
      categorieAlerteBngrcId: categorieId!,
      provinceIds: selectedProvinces, regionIds: selectedRegions,
      districtIds: selectedDistricts, villageIds: selectedVillages,
      repeatCount: 1, alertPriority: "P1", userId: user?.id,
    }),
    onSuccess: (result) => setSuccess(result),
  });

  function resetAll() {
    setStep(0); setTypeId(null); setCategorieId(null); setSuccess(null);
    setSelectedProvinces([]); setSelectedRegions([]); setSelectedDistricts([]);
    setSelectedVillages([]); setSelectedCommunes([]); setSelectedFokontany([]);
  }

  const zoneSummary = [
    selectedProvinces.length ? `${selectedProvinces.length} prov.`     : null,
    selectedRegions.length   ? `${selectedRegions.length} rég.`        : null,
    selectedDistricts.length ? `${selectedDistricts.length} dist.`     : null,
    selectedCommunes.length  ? `${selectedCommunes.length} comm.`      : null,
    selectedFokontany.length ? `${selectedFokontany.length} fokontany` : null,
    selectedVillages.length  ? `${selectedVillages.length} vill.`      : null,
  ].filter(Boolean).join(" · ") || "—";

  const selectedType      = allTypes.find((t: any) => t.id === typeId);
  const selectedCategorie = cats.find((c: any) => c.id === categorieId);

  // ── Écran succès ────────────────────────────────────────────────────────────
  if (success) return (
    <AppLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white rounded-2xl p-10 text-center max-w-sm shadow-xl">
          <CheckCircle size={52} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Alerte envoyée avec succès</h2>
          <p className="text-sm text-slate-500 mb-6">La diffusion a été déclenchée immédiatement.</p>
          <div className="flex gap-4 justify-center mb-7">
            {[[(success as any).created, "Notifications créées"], [(success as any).sent, "alerte(s) envoyé(s)"]].map(([val, lbl]) => (
              <div key={lbl as string} className="flex flex-col gap-1 items-center">
                <span className="text-3xl font-bold text-[#152a8a]">{val}</span>
                <span className="text-xs text-slate-400">{lbl}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate("/notifications-alerte")}
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium hover:bg-slate-50 transition">
              Voir les notifications
            </button>
            <button onClick={resetAll}
              className="px-4 py-2 rounded-lg bg-[#152a8a] text-white text-sm font-medium hover:bg-indigo-800 transition">
              Nouvelle alerte
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );

  // ── Rendu principal ─────────────────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 pb-10 flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2 flex-wrap">
              Diffusion Alertes
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
                <AlertTriangle size={12} /> Risques et catastrophes
              </span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">Déclenchez une diffusion immédiate vers les sirènes ciblées</p>
          </div>
          <button onClick={() => navigate(-1)}
            className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition whitespace-nowrap">
            ← Retour
          </button>
        </div>

        <div className="bg-white rounded-2xl p-6 pb-7 flex flex-col gap-4
                shadow-[0_8px_40px_rgba(21,42,138,0.12),0_2px_12px_rgba(0,0,0,0.06)]
                border border-slate-100">
                  
        {/* Stepper */}
        <StepperBar step={step} />

        {/* Hint clavier */}
        {canNext() && step < STEPS.length - 1 && (
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 text-xs">
            <kbd className="px-2 py-0.5 rounded bg-white border border-sky-300 font-mono font-semibold text-[11px]">↵ Entrée</kbd>
            Appuyez sur Entrée pour passer à l'étape suivante
          </div>
        )}

        {/* Card principale */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-800">{STEPS[step].label}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{STEPS[step].desc}</p>
          </div>

          <div className="p-6 min-h-[200px]">

            {/* Étape 0 — Aléas */}
            {step === 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {allTypes.map((t: any) => (
                  <OptionCard
                    key={t.id}
                    selected={typeId === t.id}
                    title={t.name}
                    subtitle={t.description}
                    icon={getTypeIconComponent(t.name)} 
                    onClick={() => { setTypeId(t.id); setCategorieId(null); }}
                  />
                ))}
              </div>
            )}

            {/* Étape 1 — Zones */}
            {step === 1 && (
              <ZonesStep
                provinces={provinces} allRegions={allRegions} allDistricts={allDistricts}
                allCommunes={allCommunes} allFokontany={allFokontany} allVillages={allVillages}
                selectedProvinces={selectedProvinces} selectedRegions={selectedRegions}
                selectedDistricts={selectedDistricts} selectedCommunes={selectedCommunes}
                selectedFokontany={selectedFokontany} selectedVillages={selectedVillages}
                setSelectedProvinces={setSelectedProvinces} setSelectedRegions={setSelectedRegions}
                setSelectedDistricts={setSelectedDistricts} setSelectedCommunes={setSelectedCommunes}
                setSelectedFokontany={setSelectedFokontany} setSelectedVillages={setSelectedVillages}
                previewLoading={previewLoading} sireneCount={sireneCount} sirenePrev={sirenePrev}
              />
            )}

            {/* Étape 2 — Catégorie */}
            {step === 2 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {cats.length === 0 && <p className="text-slate-400 text-sm col-span-full">Aucune catégorie pour cet aléa.</p>}
                {cats.map((c: any) => {
                  const audio = allAudios.find(
                    (a: any) => Number(a.categorieAlerteBngrcId) === c.id && a.status === "approved"
                  );
                  return (
                    <CatAudioCard key={c.id} categorie={c} audio={audio}
                      selected={categorieId === c.id} typeName={selectedType?.name ?? ""}
                      onClick={() => setCategorieId(c.id)} />
                  );
                })}
              </div>
            )}

            {/* Étape 3 — Confirmation */}
            {step === 3 && (
              <div className="flex flex-col gap-4">
                {/* Bannière immédiat */}
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm font-medium">
                  <Zap size={16} className="text-green-500 flex-shrink-0" />
                  Envoi immédiat — la diffusion sera déclenchée dès confirmation
                  <span className="ml-auto text-xs text-green-500 font-semibold">
                    {toMadagascarTime(new Date())} (Madagascar)
                  </span>
                </div>

                {/* Grille résumé */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {([
                    ["Aléa (type)",     selectedType?.name],
                    ["Catégorie",       selectedCategorie?.name],
                    ["Audio",           linkedAudio?.name || linkedAudio?.originalFilename],
                    ["Zones",           zoneSummary],
                    ["Sirènes ciblées", previewLoading ? "…" : `${sireneCount} sirène${sireneCount > 1 ? "s" : ""}`],
                    ["Priorité",        "Urgence"],
                  ] as [string, any][]).map(([label, value]) => (
                    <div key={label} className="bg-slate-50 rounded-lg px-4 py-3 flex flex-col gap-1">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
                      <span className="text-sm font-semibold text-slate-800">{value || "—"}</span>
                    </div>
                  ))}
                </div>

                {/* Aperçu audio */}
                {linkedAudio && (
                  <div className="flex flex-col gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
                    <div className="flex items-center gap-2">
                      <Music size={15} />
                      <span>
                        Audio : <strong>{linkedAudio.name || linkedAudio.originalFilename}</strong>
                      </span>
                    </div>
                    <MiniPlayer url={audioAlerteBngrcApi.audioUrl(linkedAudio.audio)} playerBg="bg-blue-100" />
                  </div>
                )}

                {/* Avertissement */}
                <div className="flex items-start gap-2.5 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-700">
                  <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
                  <span>
                    Cette alerte sera diffusée <strong>immédiatement</strong> sur{" "}
                    <strong>{sireneCount} sirène{sireneCount > 1 ? "s" : ""}</strong>{" "}
                    en priorité P1 (urgence). Cette action est irréversible.
                  </span>
                </div>

                {sendMut.isError && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                    {(sendMut.error as any)?.message || "Erreur lors de l'envoi"}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => step === 0 ? navigate(-1) : setStep(s => s - 1)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium hover:bg-slate-50 transition"
          >
            <ChevronLeft size={15} /> {step === 0 ? "Retour" : "Précédent"}
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)} disabled={!canNext()}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#152a8a] text-white text-sm font-semibold hover:bg-indigo-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Suivant <ChevronRight size={15} />
            </button>
          ) : (
            <button
              onClick={() => sendMut.mutate()}
              disabled={sendMut.isPending || sireneCount === 0}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px] justify-center"
            >
              {sendMut.isPending
                ? <><Loader2 size={16} className="animate-spin" /> Envoi en cours…</>
                : <><Send size={16} /> Envoyer l'alerte</>}
            </button>
          )}
        </div>
      </div>
      </div>
    </AppLayout>
  );
}