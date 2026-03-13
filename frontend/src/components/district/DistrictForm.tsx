import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ChevronLeft } from "lucide-react";
import { provincesApi } from "@/services/province.api";
import { regionsApi }   from "@/services/region.api";
import type { Province } from "@/types/province";
import type { Region }   from "@/types/region";
import "@/styles/page.css";
import "@/styles/utilisateurs.css";

export interface districtFormData {
  name:     string;
  regionId: number;
}

interface DistrictFormProps {
  initialData?: Partial<districtFormData> & { id?: number; provinceId?: number };
  onSubmit: (data: districtFormData) => Promise<void>;
  loading: boolean;
  error?: string;
}

export function DistrictForm({ initialData, onSubmit, loading, error }: DistrictFormProps) {
  const isEdit   = !!initialData?.id;
  const navigate = useNavigate();

  // Province sert uniquement à filtrer les régions — pas envoyée au backend
  const [selectedProvinceId, setSelectedProvinceId] = useState<number>(
    initialData?.provinceId ?? 0
  );

  const [form, setForm] = useState<districtFormData>({
    name:     initialData?.name     ?? "",
    regionId: initialData?.regionId ?? 0,
  });

  // Sync si initialData change (cas édition async)
  useEffect(() => {
    if (initialData) {
      setForm({
        name:     initialData.name     ?? "",
        regionId: initialData.regionId ?? 0,
      });
      if (initialData.provinceId) {
        setSelectedProvinceId(initialData.provinceId);
      }
    }
  }, [initialData?.id]);

  // ── Charger les provinces ──
  const { data: rawProvinces, isLoading: provincesLoading } = useQuery({
    queryKey: ["provinces"],
    queryFn:  () => provincesApi.getAll(),
  });
  const provinces: Province[] = Array.isArray(rawProvinces)
    ? rawProvinces
    : (rawProvinces as any)?.data ?? (rawProvinces as any)?.response ?? [];

  // ── Charger toutes les régions ──
  const { data: rawRegions, isLoading: regionsLoading } = useQuery({
    queryKey: ["regions"],
    queryFn:  () => regionsApi.getAll(),
  });
  const allRegions: Region[] = Array.isArray(rawRegions)
    ? rawRegions
    : (rawRegions as any)?.data ?? (rawRegions as any)?.response ?? [];

  // ── Filtrer les régions selon la province choisie ──
  const filteredRegions = selectedProvinceId
    ? allRegions.filter(r => {
        const pid = (r as any).province?.id ?? (r as any).provinceId;
        return Number(pid) === Number(selectedProvinceId);
      })
    : allRegions;

  const set = <K extends keyof districtFormData>(k: K, v: districtFormData[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  // Quand on change de province → reset région
  const handleProvinceChange = (id: number) => {
    setSelectedProvinceId(id);
    set("regionId", 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ name: form.name.trim(), regionId: Number(form.regionId) });
  };

  const isValid = form.name.trim() && form.regionId > 0;

  return (
    <div className="form-page">

      {/* Header */}
      <div className="form-page-header">
        <button className="btn-back" onClick={() => navigate("/district")}>
          <ChevronLeft size={16} />
          Retour à la liste
        </button>
        <h1 className="page-title">
          {isEdit ? "Modifier le district" : "Nouveau district"}
        </h1>
        <p className="page-subtitle">
          {isEdit
            ? "Modifiez les informations du district"
            : "Ajoutez un nouveau district"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="form-card" style={{ maxWidth: 520 }}>

        <div className="form-section">
          <div className="form-section-title">Informations</div>

          <div className="form-field">
            <label>Nom du district <span className="required">*</span></label>
            <input
              type="text"
              placeholder="ex: Ambohidratrimo"
              value={form.name}
              required
              autoFocus
              onChange={e => set("name", e.target.value)}
            />
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">Localisation</div>

          {/* Province — filtre uniquement, pas envoyé au backend */}
          <div className="form-field">
            <label>Province</label>
            <select
              value={selectedProvinceId || ""}
              disabled={provincesLoading}
              onChange={e => handleProvinceChange(Number(e.target.value))}
            >
              <option value="">
                {provincesLoading ? "Chargement…" : "— Toutes les provinces —"}
              </option>
              {provinces.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {selectedProvinceId === 0 && (
              <span style={{ fontSize: "0.72rem", color: "var(--p-text-3)", marginTop: 3 }}>
                Choisissez une province pour filtrer les régions
              </span>
            )}
          </div>

          {/* Région — filtrée selon province */}
          <div className="form-field">
            <label>Région <span className="required">*</span></label>
            <select
              value={form.regionId || ""}
              required
              disabled={regionsLoading}
              onChange={e => set("regionId", Number(e.target.value))}
            >
              <option value="">
                {regionsLoading
                  ? "Chargement…"
                  : selectedProvinceId
                    ? "— Choisir une région —"
                    : "— Choisir une région —"}
              </option>
              {filteredRegions.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="form-actions">
          <button
            type="button"
            className="btn-cancel"
            onClick={() => navigate("/district")}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading || !isValid}
          >
            {loading && <Loader2 size={14} className="spin" />}
            {isEdit ? "Enregistrer" : "Créer le district"}
          </button>
        </div>
      </form>
    </div>
  );
}