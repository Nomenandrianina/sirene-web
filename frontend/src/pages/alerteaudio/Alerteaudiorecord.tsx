import { useState, useMemo } from "react";
import { useNavigate }       from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout }   from "@/components/AppLayout";
import { RecorderWidget } from "@/components/alerteaudio/Recorderwidget";
import { ChevronLeft, Loader2, Mic, Check } from "lucide-react";
import { alertesApi }              from "@/services/alertes.api";
import { alerteTypesApi }          from "@/services/alertetypes.api";
import { categorieAlertesApi }     from "@/services/categoriealertes.api";
import { sousCategorieAlertesApi } from "@/services/souscategorieAlerte.api";
import { alerteAudiosApi }         from "@/services/alerteaudio.api";
import { sirenesApi }              from "@/services/sirene.api";
import {
  isSousCatBlocked,
  getSousCatConflictLabel
} from "@/utils/alerteAudioRules";

// ── Helpers ───────────────────────────────────────────────────────────────────


function toArr(raw: any): any[] {
  return Array.isArray(raw) ? raw : raw?.data ?? raw?.response ?? [];
}

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 " +
  "placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 " +
  "focus:border-transparent disabled:bg-slate-50 disabled:text-slate-400 " +
  "disabled:cursor-not-allowed transition";

function Field({ label, required, children }: {
  label: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-700">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function SectionCard({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</div>
      {children}
    </div>
  );
}

// ── Sirène checkbox card ──────────────────────────────────────────────────────
// Composant isolé pour éviter le double-toggle label+onChange

function SireneCard({
  sirene,
  checked,
  onToggle,
}: {
  sirene: any;
  checked: boolean;
  onToggle: (id: number) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(sirene.id)}
      className={[
        "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition text-left w-full",
        checked
          ? "bg-sky-50 border-sky-300 text-sky-800 font-medium"
          : "bg-white border-slate-200 text-slate-700 hover:border-slate-300",
      ].join(" ")}
    >
      <span
        className={`w-2 h-2 rounded-full flex-shrink-0 ${
          checked ? "bg-sky-500" : "bg-slate-300"
        }`}
      />
      <span className="truncate">{sirene.name ?? sirene.imei ?? `Sirène #${sirene.id}`}</span>
    </button>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Page principale
// ═════════════════════════════════════════════════════════════════════════════

export default function AlerteAudioRecord() {
  const navigate = useNavigate();
  const qc       = useQueryClient();

  // ── Fichier enregistré ────────────────────────────────────────────────────
  const [recordedFile,     setRecordedFile]     = useState<File | null>(null);
  const [recordedDuration, setRecordedDuration] = useState<number>(0);

  // ── Formulaire ────────────────────────────────────────────────────────────
  const [name,        setName]        = useState("");
  const [description, setDescription] = useState("");
  const [alerteId,     setAlerteId]     = useState(0);
  const [alerteTypeId, setAlerteTypeId] = useState(0);
  const [categorieId,  setCategorieId]  = useState(0);
  const [sousCatId,    setSousCatId]    = useState(0);
  const [sireneIds,    setSireneIds]    = useState<number[]>([]);
  const [error,        setError]        = useState("");

  // ── Données ────────────────────────────────────────────────────────────────
  const { data: rawAlertes }  = useQuery({ queryKey: ["alertes"],                queryFn: alertesApi.getAll });
  const { data: rawTypes }    = useQuery({ queryKey: ["alerte-types"],           queryFn: alerteTypesApi.getAll, enabled: !!alerteId });
  const { data: rawCats }     = useQuery({ queryKey: ["categorie-alertes"],      queryFn: categorieAlertesApi.getAll, enabled: !!alerteTypeId });
  const { data: rawSousCats } = useQuery({ queryKey: ["sous-categorie-alertes"], queryFn: sousCategorieAlertesApi.getAll, enabled: !!alerteTypeId });
  const { data: rawSirenes }  = useQuery({ queryKey: ["sirenes"],               queryFn: sirenesApi.getAll });
  // const { data: rawUsedIds }  = useQuery({ queryKey: ["alerte-audios-used-ids"], queryFn: alerteAudiosApi.getUsedSousCategorieIds });
  const { data: rawCombinations } = useQuery({
    queryKey: ["alerte-audios-used-combinations"],
    queryFn:  alerteAudiosApi.getUsedCombinations,
  });

  const usedCombinations = useMemo(
    () => toArr(rawCombinations),
    [rawCombinations]
  );


  const alertes  = toArr(rawAlertes);
  const allTypes = toArr(rawTypes);
  const allCats  = toArr(rawCats);
  const allSCats = toArr(rawSousCats);
  const sirenes  = toArr(rawSirenes).filter((s: any) => s.isActive);
  // const usedIds: number[] = toArr(rawUsedIds);

  const types    = useMemo(() => alerteId     ? allTypes.filter((t: any) => Number(t.alerteId)          === alerteId)    : [], [allTypes, alerteId]);
  const cats     = useMemo(() => alerteTypeId ? allCats.filter((c: any)  => Number(c.alerteTypeId)      === alerteTypeId) : [], [allCats, alerteTypeId]);
  const sousCats = useMemo(() => categorieId  ? allSCats.filter((s: any) => Number(s.categorieAlerteId) === categorieId) : [], [allSCats, categorieId]);

  // ── Toggle sirène ─────────────────────────────────────────────────────────
  function toggleSirene(id: number) {
    setSireneIds(ids =>
      ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]
    );
  }

  // ── Soumission ────────────────────────────────────────────────────────────
  const createMut = useMutation({
    mutationFn: () => {
      if (!recordedFile) throw new Error("Aucun enregistrement");
      return alerteAudiosApi.create({
        name:                  name || `Enregistrement ${new Date().toLocaleString("fr-FR")}`,
        description,
        sousCategorieAlerteId: sousCatId,
        sireneIds,
        mobileId:  "",
      }, recordedFile);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alerte-audios"] });
      qc.invalidateQueries({ queryKey: ["alerte-audios-used-ids"] });
      navigate("/alerte-audios");
    },
    onError: (err: any) =>
      setError(err?.response?.data?.message || err.message || "Erreur lors de la création"),
  });

  const isValid =  recordedFile && sousCatId > 0 && sireneIds.length > 0 && !isSousCatBlocked(sousCatId, sireneIds, usedCombinations);

  function handleRecorded(file: File, duration: number) {
    setRecordedFile(file);
    setRecordedDuration(duration);
    if (!name) setName(`Enregistrement ${new Date().toLocaleString("fr-FR")}`);
  }

  // ── Rendu ──────────────────────────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="min-h-screen bg-slate-50">

        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-4 py-4">
          <button
            onClick={() => navigate("/alerte-audios/create")}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition mb-3"
          >
            <ChevronLeft size={15} /> Choisir le mode
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
              <Mic size={13} className="text-emerald-600" />
            </div>
            <h1 className="text-xl font-semibold text-slate-900">Enregistrement micro</h1>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Enregistrez, rééécoutez, puis remplissez le formulaire
          </p>
        </div>

        <div className="max-w-2xl mx-auto px-3 py-5 flex flex-col gap-4">

          {/* ── Étape 1 : Enregistrement ── */}
          <SectionCard title={
            <div className="flex items-center justify-between w-full">
              <span><Mic size={13} className="inline mr-1.5" />Enregistrement</span>
              {recordedFile && (
                <span className="flex items-center gap-1 text-emerald-600 font-normal normal-case tracking-normal">
                  <Check size={12} /> Prêt · {Math.round(recordedDuration)}s · MP3
                </span>
              )}
            </div>
          }>
            <RecorderWidget
              onRecorded={handleRecorded}
              onReset={() => { setRecordedFile(null); setRecordedDuration(0); }}
            />
          </SectionCard>

          {/* ── Étape 2 : Formulaire ── */}
          {recordedFile && (
            <>
              {/* Informations */}
              <SectionCard title="Informations">
                <Field label="Nom de l'audio">
                  <input
                    type="text"
                    placeholder="Ex: Message d'urgence inondation"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Description">
                  <textarea
                    placeholder="Description de l'audio…"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={2}
                    className={inputCls + " resize-none"}
                  />
                </Field>
              </SectionCard>

              {/* Hiérarchie cascade */}
              <SectionCard title="Hiérarchie (cascade)">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  <Field label="Alerte">
                    <select
                      value={alerteId || ""}
                      onChange={e => {
                        setAlerteId(Number(e.target.value));
                        setAlerteTypeId(0);
                        setCategorieId(0);
                        setSousCatId(0);
                      }}
                      className={inputCls}
                    >
                      <option value="">— Toutes les alertes —</option>
                      {alertes.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </Field>

                  <Field label="Type d'alerte">
                    <select
                      value={alerteTypeId || ""}
                      disabled={!alerteId}
                      onChange={e => {
                        setAlerteTypeId(Number(e.target.value));
                        setCategorieId(0);
                        setSousCatId(0);
                      }}
                      className={inputCls}
                    >
                      <option value="">{!alerteId ? "Choisir d'abord une alerte" : "— Choisir un type —"}</option>
                      {types.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </Field>

                  <Field label="Catégorie">
                    <select
                      value={categorieId || ""}
                      disabled={!alerteTypeId}
                      onChange={e => {
                        setCategorieId(Number(e.target.value));
                        setSousCatId(0);
                      }}
                      className={inputCls}
                    >
                      <option value="">{!alerteTypeId ? "Choisir d'abord un type" : "— Choisir une catégorie —"}</option>
                      {cats.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </Field>

                  <Field label="Sous-catégorie" required>
                    <select
                      value={sousCatId || ""}
                      required
                      disabled={!categorieId || sireneIds.length === 0}
                      onChange={e => setSousCatId(Number(e.target.value))}
                      className={inputCls}
                    >
                      <option value="">{!categorieId ? "Choisir d'abord une catégorie" : "— Choisir —"}</option>
                      {sousCats.map((s: any) => {
                        const blocked = isSousCatBlocked(
                          s.id,
                          sireneIds,
                          usedCombinations
                        );

                        const conflictLabel = getSousCatConflictLabel(
                          s.id,
                          sireneIds,
                          usedCombinations
                        );

                        return (
                          <option key={s.id} value={s.id} disabled={blocked}>
                            {s.name}{conflictLabel ?? ""}
                          </option>
                        );
                      })}
                    </select>
                  </Field>

                </div>
              </SectionCard>

              {/* Sirènes — boutons natifs, plus de label+checkbox */}
              <SectionCard title="Sirènes de destination *">
                {sirenes.length === 0 ? (
                  <p className="text-sm text-slate-400">Aucune sirène active disponible</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {sirenes.map((s: any) => (
                      <SireneCard
                        key={s.id}
                        sirene={s}
                        checked={sireneIds.includes(s.id)}
                        onToggle={toggleSirene}
                      />
                    ))}
                  </div>
                )}
                {sireneIds.length > 0 && (
                  <p className="text-xs text-slate-400">
                    {sireneIds.length} sirène{sireneIds.length > 1 ? "s" : ""} sélectionnée{sireneIds.length > 1 ? "s" : ""}
                  </p>
                )}
              </SectionCard>

              {/* Erreur */}
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pb-8">
                <button
                  type="button"
                  onClick={() => navigate("/alerte-audios/create")}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => { setError(""); createMut.mutate(); }}
                  disabled={createMut.isPending || !isValid}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {createMut.isPending && <Loader2 size={14} className="animate-spin" />}
                  Créer l'audio{sireneIds.length > 1 ? ` (${sireneIds.length} sirènes)` : ""}
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </AppLayout>
  );
}