import { useState, useEffect }       from "react";
import { useNavigate }               from "react-router-dom";
import { useQuery }                  from "@tanstack/react-query";
import { ChevronLeft, Loader2 }      from "lucide-react";
import { alerteBngrcApi }            from "@/services/alertebngrc.api";
import "@/styles/sirene-form.css";

export interface TypeAlerteBngrcFormData {
  name:          string;
  description:   string;
  alerteBngrcId: number | "";
}

interface Props {
  initialData?: Partial<TypeAlerteBngrcFormData> & { id?: number };
  onSubmit:     (data: TypeAlerteBngrcFormData) => Promise<void>;
  loading:      boolean;
  error?:       string;
}

export function TypeAlerteBngrcForm({ initialData, onSubmit, loading, error }: Props) {
  const isEdit   = !!initialData?.id;
  const navigate = useNavigate();

  const [form, setForm] = useState<TypeAlerteBngrcFormData>({
    name:          initialData?.name          ?? "",
    description:   initialData?.description   ?? "",
    alerteBngrcId: initialData?.alerteBngrcId ?? "",
  });

  useEffect(() => {
    if (initialData?.id) {
      setForm({
        name:          initialData.name          ?? "",
        description:   initialData.description   ?? "",
        alerteBngrcId: initialData.alerteBngrcId ?? "",
      });
    }
  }, [initialData?.id]);

  const { data: rawAlertes } = useQuery({
    queryKey: ["alerte-bngrc"],
    queryFn:  () => alerteBngrcApi.getAll(),
  });
  const alertes: any[] = Array.isArray(rawAlertes) ? rawAlertes : (rawAlertes as any)?.response ?? [];

  const set = (field: keyof TypeAlerteBngrcFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }));

  const canSubmit = form.name.trim() && form.alerteBngrcId !== "";

  return (
    <div className="sirene-form-page">
      <div className="sirene-page-header">
        <button className="btn-back" onClick={() => navigate("/type-alerte-bngrc")}>
          <ChevronLeft size={16} /> Retour à la liste
        </button>
        <h1 className="sirene-title">
          {isEdit ? "Modifier le type (aléa)" : "Nouveau type d'alerte (aléa)"}
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
          <div className="sirene-section-title">Informations</div>

          <div className="sirene-field">
            <label>Alerte BNGRC parente <span className="required">*</span></label>
            <select
              required
              value={form.alerteBngrcId}
              onChange={set("alerteBngrcId")}
            >
              <option value="">— Choisir une alerte —</option>
              {alertes.map((a: any) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div className="sirene-field">
            <label>Nom de l'aléa <span className="required">*</span></label>
            <input
              required
              autoFocus
              value={form.name}
              onChange={set("name")}
              placeholder="Ex: Cyclone, Inondation, Sécheresse…"
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
          <button type="button" className="btn-cancel" onClick={() => navigate("/type-alerte-bngrc")}>
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