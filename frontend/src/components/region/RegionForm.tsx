import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ChevronLeft } from "lucide-react";
import { provincesApi } from "@/services/province.api";
import type { Province } from "@/types/province";
import "@/styles/page.css";
import "@/styles/utilisateurs.css";

export interface RegionFormData {
  name:       string;
  provinceId: number;
}

interface RegionFormProps {
  initialData?: Partial<RegionFormData> & { id?: number };
  onSubmit: (data: RegionFormData) => Promise<void>;
  loading: boolean;
  error?: string;
}

export function RegionForm({ initialData, onSubmit, loading, error }: RegionFormProps) {
  const isEdit   = !!initialData?.id;
  const navigate = useNavigate();

  const [form, setForm] = useState<RegionFormData>({
    name:       initialData?.name       ?? "",
    provinceId: initialData?.provinceId ?? 0,
  });

  // Sync si initialData change (cas édition async)
  useEffect(() => {
    if (initialData) {
      setForm({
        name:       initialData.name       ?? "",
        provinceId: initialData.provinceId ?? 0,
      });
    }
  }, [initialData?.id]);

  // Charger la liste des provinces pour le select
  const { data: raw, isLoading: provincesLoading } = useQuery({
    queryKey: ["provinces"],
    queryFn:  () => provincesApi.getAll(),
  });
  const provinces: Province[] = Array.isArray(raw)
    ? raw
    : (raw as any)?.data ?? (raw as any)?.response ?? [];

  const set = <K extends keyof RegionFormData>(k: K, v: RegionFormData[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ name: form.name.trim(), provinceId: Number(form.provinceId) });
  };

  const isValid = form.name.trim() && form.provinceId > 0;

  return (
    <div className="form-page">

      {/* Header */}
      <div className="form-page-header">
        <button className="btn-back" onClick={() => navigate("/regions")}>
          <ChevronLeft size={16} />
          Retour à la liste
        </button>
        <h1 className="page-title">
          {isEdit ? "Modifier la région" : "Nouvelle région"}
        </h1>
        <p className="page-subtitle">
          {isEdit
            ? "Modifiez les informations de la région"
            : "Ajoutez une nouvelle région"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="form-card" style={{ maxWidth: 520 }}>

        <div className="form-section">
          <div className="form-section-title">Informations</div>

          <div className="form-field">
            <label>Nom de la région <span className="required">*</span></label>
            <input
              type="text"
              placeholder="ex: Itasy"
              value={form.name}
              required
              autoFocus
              onChange={e => set("name", e.target.value)}
            />
          </div>

          <div className="form-field">
            <label>Province <span className="required">*</span></label>
            <select
              value={form.provinceId || ""}
              required
              disabled={provincesLoading}
              onChange={e => set("provinceId", Number(e.target.value))}
            >
              <option value="">
                {provincesLoading ? "Chargement…" : "— Choisir une province —"}
              </option>
              {provinces.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="form-actions">
          <button
            type="button"
            className="btn-cancel"
            onClick={() => navigate("/regions")}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading || !isValid}
          >
            {loading && <Loader2 size={14} className="spin" />}
            {isEdit ? "Enregistrer" : "Créer la région"}
          </button>
        </div>
      </form>
    </div>
  );
}