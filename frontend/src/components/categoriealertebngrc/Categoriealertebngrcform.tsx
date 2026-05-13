import { useState, useEffect }            from "react";
import { useNavigate }                    from "react-router-dom";
import { useQuery }                       from "@tanstack/react-query";
import { ChevronLeft, Loader2 }           from "lucide-react";
import { typeAlerteBngrcApi } from "@/services/typeAlerteBngrc.api";
import { alerteBngrcApi, } from "@/services/alertebngrc.api";
import "@/styles/sirene-form.css";

export interface CategorieAlerteBngrcFormData {
  name:               string;
  description:        string;
  alerteBngrcId:      number | "";
  typeAlerteBngrcId:  number | "";
}

interface Props {
  initialData?: Partial<CategorieAlerteBngrcFormData> & { id?: number };
  onSubmit:     (data: CategorieAlerteBngrcFormData) => Promise<void>;
  loading:      boolean;
  error?:       string;
}

export function CategorieAlerteBngrcForm({ initialData, onSubmit, loading, error }: Props) {
  const isEdit   = !!initialData?.id;
  const navigate = useNavigate();

  const [form, setForm] = useState<CategorieAlerteBngrcFormData>({
    name:              initialData?.name              ?? "",
    description:       initialData?.description       ?? "",
    alerteBngrcId:     initialData?.alerteBngrcId     ?? "",
    typeAlerteBngrcId: initialData?.typeAlerteBngrcId ?? "",
  });

  useEffect(() => {
    if (initialData?.id) {
      setForm({
        name:              initialData.name              ?? "",
        description:       initialData.description       ?? "",
        alerteBngrcId:     initialData.alerteBngrcId     ?? "",
        typeAlerteBngrcId: initialData.typeAlerteBngrcId ?? "",
      });
    }
  }, [initialData?.id]);

  // Charger les alertes BNGRC
  const { data: rawAlertes } = useQuery({
    queryKey: ["alerte-bngrc"],
    queryFn:  () => alerteBngrcApi.getAll(),
  });
  const alertes: any[] = Array.isArray(rawAlertes) ? rawAlertes : (rawAlertes as any)?.response ?? [];

  // Charger les types filtrés par alerte sélectionnée
  const { data: rawTypes } = useQuery({
    queryKey: ["type-alerte-bngrc", form.alerteBngrcId],
    queryFn:  () => typeAlerteBngrcApi.getByAlerte(Number(form.alerteBngrcId)),
    enabled:  !!form.alerteBngrcId,
  });
  const types: any[] = Array.isArray(rawTypes) ? rawTypes : (rawTypes as any)?.response ?? [];

  const set = (field: keyof CategorieAlerteBngrcFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm(f => {
        const next = { ...f, [field]: e.target.value };
        // Réinitialiser le type si on change d'alerte
        if (field === "alerteBngrcId") next.typeAlerteBngrcId = "";
        return next;
      });
    };

  const canSubmit = form.name.trim() && form.alerteBngrcId !== "" && form.typeAlerteBngrcId !== "";

  return (
    <div className="sirene-form-page">
      <div className="sirene-page-header">
        <button className="btn-back" onClick={() => navigate("/categorie-alerte-bngrc")}>
          <ChevronLeft size={16} /> Retour à la liste
        </button>
        <h1 className="sirene-title">
          {isEdit ? "Modifier la catégorie" : "Nouvelle catégorie d'alerte BNGRC"}
        </h1>
        <p className="sirene-subtitle">
          {isEdit ? "Modifiez les informations" : "Remplissez le formulaire"}
        </p>
      </div>

      <form
        onSubmit={async e => { e.preventDefault(); await onSubmit(form); }}
        className="sirene-form-layout"
      >
        <div className="sirene-form-card">
          <div className="sirene-section-title">Hiérarchie</div>

          {/* Sélection alerte BNGRC parente */}
          <div className="sirene-field">
            <label>Alerte BNGRC <span className="required">*</span></label>
            <select required value={form.alerteBngrcId} onChange={set("alerteBngrcId")}>
              <option value="">— Choisir une alerte —</option>
              {alertes.map((a: any) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          {/* Sélection type/aléa — dépend de l'alerte */}
          <div className="sirene-field">
            <label>Type (aléa) <span className="required">*</span></label>
            <select
              required
              disabled={!form.alerteBngrcId}
              value={form.typeAlerteBngrcId}
              onChange={set("typeAlerteBngrcId")}
            >
              <option value="">
                {!form.alerteBngrcId ? "Choisir d'abord une alerte" : "— Choisir un type —"}
              </option>
              {types.map((t: any) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="sirene-form-card">
          <div className="sirene-section-title">Informations</div>

          <div className="sirene-field">
            <label>Nom de la catégorie <span className="required">*</span></label>
            <input
              required
              autoFocus
              value={form.name}
              onChange={set("name")}
              placeholder="Ex: Alerte rouge, Évacuation immédiate…"
            />
          </div>

          <div className="sirene-field">
            <label>Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={set("description")}
              placeholder="Description optionnelle…"
            />
          </div>
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="sirene-form-actions">
          <button type="button" className="btn-cancel" onClick={() => navigate("/categorie-alerte-bngrc")}>
            Annuler
          </button>
          <button type="submit" className="btn-primary" disabled={loading || !canSubmit}>
            {loading && <Loader2 size={14} className="spin" />}
            {isEdit ? "Enregistrer" : "Créer"}
          </button>
        </div>
      </form>
    </div>
  );
}