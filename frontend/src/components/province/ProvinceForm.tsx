import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ChevronLeft } from "lucide-react";
import "@/styles/page.css";
import "@/styles/utilisateurs.css";

export interface ProvinceFormData {
  name: string;
}

interface ProvinceFormProps {
  initialData?: Partial<ProvinceFormData> & { id?: number };
  onSubmit: (data: ProvinceFormData) => Promise<void>;
  loading: boolean;
  error?: string;
}

export function ProvinceForm({ initialData, onSubmit, loading, error }: ProvinceFormProps) {
  const isEdit   = !!initialData?.id;
  const navigate = useNavigate();

  const [form, setForm] = useState<ProvinceFormData>({
    name: initialData?.name ?? "",
  });

  // Sync si initialData change (cas édition async)
  useEffect(() => {
    if (initialData) {
      setForm({ name: initialData.name ?? "" });
    }
  }, [initialData?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ name: form.name.trim() });
  };

  return (
    <div className="form-page">

      {/* Header */}
      <div className="form-page-header">
        <button className="btn-back" onClick={() => navigate("/provinces")}>
          <ChevronLeft size={16} />
          Retour à la liste
        </button>
        <h1 className="page-title">
          {isEdit ? "Modifier la province" : "Nouvelle province"}
        </h1>
        <p className="page-subtitle">
          {isEdit
            ? "Modifiez les informations de la province"
            : "Ajoutez une nouvelle province"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="form-card" style={{ maxWidth: 480 }}>

        <div className="form-section">
          <div className="form-section-title">Informations</div>
          <div className="form-field">
            <label>Nom de la province <span className="required">*</span></label>
            <input
              type="text"
              placeholder="ex: Analamanga"
              value={form.name}
              required
              autoFocus
              onChange={e => setForm({ name: e.target.value })}
            />
          </div>
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="form-actions">
          <button
            type="button"
            className="btn-cancel"
            onClick={() => navigate("/provinces")}
          >
            Annuler
          </button>
          <button type="submit" className="btn-primary" disabled={loading || !form.name.trim()}>
            {loading && <Loader2 size={14} className="spin" />}
            {isEdit ? "Enregistrer" : "Créer la province"}
          </button>
        </div>
      </form>
    </div>
  );
}