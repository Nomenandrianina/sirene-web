import { useState, useEffect } from "react";
import { useNavigate }         from "react-router-dom";
import { ChevronLeft, Loader2 } from "lucide-react";
import "@/styles/sirene-form.css";

export interface AlerteBngrcFormData {
  name:        string;
  description: string;
}

interface Props {
  initialData?: Partial<AlerteBngrcFormData> & { id?: number };
  onSubmit:     (data: AlerteBngrcFormData) => Promise<void>;
  loading:      boolean;
  error?:       string;
}

export function AlerteBngrcForm({ initialData, onSubmit, loading, error }: Props) {
  const isEdit   = !!initialData?.id;
  const navigate = useNavigate();

  const [form, setForm] = useState<AlerteBngrcFormData>({
    name:        initialData?.name        ?? "",
    description: initialData?.description ?? "",
  });

  useEffect(() => {
    if (initialData?.id) {
      setForm({
        name:        initialData.name        ?? "",
        description: initialData.description ?? "",
      });
    }
  }, [initialData?.id]);

  const set = (field: keyof AlerteBngrcFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }));

  return (
    <div className="sirene-form-page">
      <div className="sirene-page-header">
        <button className="btn-back" onClick={() => navigate("/alerte-bngrc")}>
          <ChevronLeft size={16} /> Retour à la liste
        </button>
        <h1 className="sirene-title">{isEdit ? "Modifier l'alerte BNGRC" : "Nouvelle alerte BNGRC"}</h1>
        <p className="sirene-subtitle">
          {isEdit ? "Modifiez les informations" : "Remplissez le formulaire pour créer une alerte BNGRC"}
        </p>
      </div>

      <form
        onSubmit={async e => { e.preventDefault(); await onSubmit(form); }}
        className="sirene-form-layout"
      >
        <div className="sirene-form-card">
          <div className="sirene-section-title">Informations</div>

          <div className="sirene-field">
            <label>Nom <span className="required">*</span></label>
            <input
              required
              autoFocus
              value={form.name}
              onChange={set("name")}
              placeholder="Ex: Catastrophe naturelle"
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
          <button type="button" className="btn-cancel" onClick={() => navigate("/alerte-bngrc")}>
            Annuler
          </button>
          <button type="submit" className="btn-primary" disabled={loading || !form.name.trim()}>
            {loading && <Loader2 size={14} className="spin" />}
            {isEdit ? "Enregistrer" : "Créer"}
          </button>
        </div>
      </form>
    </div>
  );
}