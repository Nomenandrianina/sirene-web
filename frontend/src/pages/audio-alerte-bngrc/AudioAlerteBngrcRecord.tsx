import { useState, useMemo }                              from "react";
import { useNavigate }                                     from "react-router-dom";
import { useQuery, useMutation, useQueryClient }           from "@tanstack/react-query";
import { AppLayout }                                       from "@/components/AppLayout";
import { RecorderWidget }                                  from "@/components/alerteaudio/Recorderwidget";
import { ChevronLeft, Loader2, Mic, Check }                from "lucide-react";
import { alerteBngrcApi }                                  from "@/services/alertebngrc.api";
import { typeAlerteBngrcApi }                              from "@/services/typeAlerteBngrc.api";
import { categorieAlerteBngrcApi }                         from "@/services/categorieAlerteBngrc.api";
import { audioAlerteBngrcApi }                             from "@/services/audioAlerteBngrc.api";

// ── Helpers ───────────────────────────────────────────────────────────────────

function toArr(raw: any): any[] {
  return Array.isArray(raw) ? raw : raw?.data ?? raw?.response ?? [];
}

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 " +
  "placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 " +
  "focus:border-transparent disabled:bg-slate-50 disabled:text-slate-400 " +
  "disabled:cursor-not-allowed transition";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
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

// ── Page principale ───────────────────────────────────────────────────────────

export default function AudioAlerteBngrcRecord() {
  const navigate = useNavigate();
  const qc       = useQueryClient();

  // ── Enregistrement ────────────────────────────────────────────────────────
  const [recordedFile,     setRecordedFile]     = useState<File | null>(null);
  const [recordedDuration, setRecordedDuration] = useState<number>(0);

  // ── Formulaire ────────────────────────────────────────────────────────────
  const [name,          setName]          = useState("");
  const [description,   setDescription]   = useState("");
  const [alerteBngrcId, setAlerteBngrcId] = useState(0);
  const [typeId,        setTypeId]        = useState(0);
  const [categorieId,   setCategorieId]   = useState(0);
  const [error,         setError]         = useState("");

  // ── Données ───────────────────────────────────────────────────────────────
  const { data: rawAlertes } = useQuery({ queryKey: ["alerte-bngrc"],            queryFn: () => alerteBngrcApi.getAll() });
  const { data: rawTypes }   = useQuery({ queryKey: ["type-alerte-bngrc"],       queryFn: () => typeAlerteBngrcApi.getAll(), enabled: !!alerteBngrcId });
  const { data: rawCats }    = useQuery({ queryKey: ["categorie-alerte-bngrc"],  queryFn: () => categorieAlerteBngrcApi.getAll(), enabled: !!typeId });

  // ← Catégories déjà associées à un audio existant
  const { data: usedCatIds = [] } = useQuery({
    queryKey: ["audio-alerte-bngrc-used-categories"],
    queryFn:  audioAlerteBngrcApi.getUsedCategorieIds,
  });

  const alertes  = toArr(rawAlertes);
  const allTypes = toArr(rawTypes);
  const allCats  = toArr(rawCats);

  const types = useMemo(() =>
    alerteBngrcId ? allTypes.filter((t: any) => Number(t.alerteBngrcId) === alerteBngrcId) : [],
    [allTypes, alerteBngrcId]);

  const cats = useMemo(() =>
    typeId ? allCats.filter((c: any) => Number(c.typeAlerteBngrcId) === typeId) : [],
    [allCats, typeId]);

  function isCatUsed(catId: number): boolean {
    return (usedCatIds as number[]).includes(catId);
  }

  // ── Soumission ────────────────────────────────────────────────────────────
  const createMut = useMutation({
    mutationFn: () => {
      if (!recordedFile) throw new Error("Aucun enregistrement");
      const fd = new FormData();
      fd.append("audio",                  recordedFile);
      fd.append("categorieAlerteBngrcId", String(categorieId));
      fd.append("sireneIds",              JSON.stringify([]));
      if (name)        fd.append("name",        name);
      if (description) fd.append("description", description);
      fd.append("duration", String(recordedDuration));
      return audioAlerteBngrcApi.create(fd);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["audio-alerte-bngrc"] });
      qc.invalidateQueries({ queryKey: ["audio-alerte-bngrc-used-categories"] });
      navigate("/audio-alerte-bngrc");
    },
    onError: (err: any) =>
      setError(err?.response?.data?.message || err.message || "Erreur lors de la création"),
  });

  function handleRecorded(file: File, duration: number) {
    const MAX = 150;
    if (duration > MAX) {
      setError(`Enregistrement trop long : ${Math.round(duration)}s (max 2 min 30s). Veuillez recommencer.`);
      return;
    }
    setRecordedFile(file);
    setRecordedDuration(duration);
    setError("");
    if (!name) setName(`Enregistrement BNGRC ${new Date().toLocaleString("fr-FR")}`);
  }

  const isValid =
    !!recordedFile &&
    categorieId > 0 &&
    !isCatUsed(categorieId);

  // ── Rendu ─────────────────────────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="min-h-screen bg-slate-50">

        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-4 py-4">
          <button onClick={() => navigate("/audio-alerte-bngrc/create")}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition mb-3">
            <ChevronLeft size={15} /> Choisir le mode
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
              <Mic size={13} className="text-emerald-600" />
            </div>
            <h1 className="text-xl font-semibold text-slate-900">Enregistrement BNGRC — micro</h1>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">Enregistrez, réécoutez, puis soumettez</p>
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
                  <input type="text" placeholder="Ex: Message d'urgence cyclone"
                    value={name} onChange={e => setName(e.target.value)} className={inputCls} />
                </Field>
                <Field label="Description">
                  <textarea placeholder="Description de l'audio…" value={description}
                    onChange={e => setDescription(e.target.value)} rows={2}
                    className={inputCls + " resize-none"} />
                </Field>
              </SectionCard>

              {/* Classification BNGRC */}
              <SectionCard title="Classification BNGRC">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  <Field label="Alerte BNGRC">
                    <select value={alerteBngrcId || ""} className={inputCls}
                      onChange={e => { setAlerteBngrcId(Number(e.target.value)); setTypeId(0); setCategorieId(0); }}>
                      <option value="">— Toutes —</option>
                      {alertes.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </Field>

                  <Field label="Type / Aléa">
                    <select value={typeId || ""} disabled={!alerteBngrcId} className={inputCls}
                      onChange={e => { setTypeId(Number(e.target.value)); setCategorieId(0); }}>
                      <option value="">{!alerteBngrcId ? "Choisir d'abord une alerte" : "— Choisir —"}</option>
                      {types.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </Field>

                  <Field label="Catégorie" required>
                    <select
                      value={categorieId || ""}
                      disabled={!typeId}
                      className={inputCls}
                      onChange={e => setCategorieId(Number(e.target.value))}
                    >
                      <option value="">{!typeId ? "Choisir d'abord un type" : "— Choisir —"}</option>
                      {cats.map((c: any) => {
                        const used = isCatUsed(c.id);
                        return (
                          <option key={c.id} value={c.id} disabled={used}>
                            {c.name}{used ? " (déjà utilisé)" : ""}
                          </option>
                        );
                      })}
                    </select>
                    {categorieId > 0 && isCatUsed(categorieId) && (
                      <p className="text-xs text-red-500 mt-1">
                        ⚠ Cette catégorie possède déjà un audio associé. Veuillez en choisir une autre.
                      </p>
                    )}
                  </Field>
                </div>
              </SectionCard>

              {/* Info sirènes */}
              <SectionCard title="Sirènes">
                <p className="text-sm text-slate-500">
                  🔊 Toutes les sirènes actives seront automatiquement associées à cet audio.
                </p>
              </SectionCard>

              {/* Note superadmin */}
              <div style={{
                padding: "10px 14px", borderRadius: 8,
                background: "#eff6ff", border: "1px solid #bfdbfe",
                fontSize: 12, color: "#1e40af",
              }}>
                ℹ️ Les audios BNGRC sont créés directement avec le statut <strong>approuvé</strong> — aucune validation requise.
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pb-8">
                <button type="button" onClick={() => navigate("/audio-alerte-bngrc/create")}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition">
                  Annuler
                </button>
                <button type="button"
                  onClick={() => { setError(""); createMut.mutate(); }}
                  disabled={createMut.isPending || !isValid}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
                  {createMut.isPending && <Loader2 size={14} className="animate-spin" />}
                  Créer l'audio BNGRC
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </AppLayout>
  );
}