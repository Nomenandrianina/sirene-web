import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ChevronLeft } from "lucide-react";
import { provincesApi } from "@/services/province.api";
import { regionsApi }   from "@/services/region.api";
import { districtsApi } from "@/services/districts.api";
import { communesApi }  from "@/services/commune.api";
import type { Province } from "@/types/province";
import type { Region }   from "@/types/region";
import type { District } from "@/types/district";
import type { Commune }  from "@/types/commune";

export interface FokontanyFormData {
  name:       string;
  provinceId: number; // cascade UI uniquement
  regionId:   number; // cascade UI uniquement
  districtId: number; // cascade UI uniquement
  communeId:  number;
}

interface FokontanyFormProps {
  initialData?: Partial<FokontanyFormData> & { id?: number };
  onSubmit:     (data: Pick<FokontanyFormData, "name" | "communeId">) => Promise<void>;
  loading:      boolean;
  error?:       string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
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

const selectCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 " +
  "focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent " +
  "disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed transition";

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 " +
  "placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 " +
  "focus:border-transparent transition";

// ─────────────────────────────────────────────────────────────────────────────

export function FokontanyForm({ initialData, onSubmit, loading, error }: FokontanyFormProps) {
  const isEdit   = !!initialData?.id;
  const navigate = useNavigate();

  const [form, setForm] = useState<FokontanyFormData>({
    name:       initialData?.name       ?? "",
    provinceId: initialData?.provinceId ?? 0,
    regionId:   initialData?.regionId   ?? 0,
    districtId: initialData?.districtId ?? 0,
    communeId:  initialData?.communeId  ?? 0,
  });

  // Sync édition async
  useEffect(() => {
    if (initialData?.id) {
      setForm({
        name:       initialData.name       ?? "",
        provinceId: initialData.provinceId ?? 0,
        regionId:   initialData.regionId   ?? 0,
        districtId: initialData.districtId ?? 0,
        communeId:  initialData.communeId  ?? 0,
      });
    }
  }, [initialData?.id]);

  const set = <K extends keyof FokontanyFormData>(k: K, v: FokontanyFormData[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  // ── Données géo ────────────────────────────────────────────────────────────
  const { data: rawProvinces } = useQuery({ queryKey: ["provinces"], queryFn: provincesApi.getAll });
  const provinces: Province[] = Array.isArray(rawProvinces)
    ? rawProvinces : (rawProvinces as any)?.data ?? [];

  const { data: rawRegions } = useQuery({ queryKey: ["regions"], queryFn: regionsApi.getAll });
  const allRegions: Region[] = Array.isArray(rawRegions)
    ? rawRegions : (rawRegions as any)?.data ?? [];

  const { data: rawDistricts } = useQuery({ queryKey: ["districts"], queryFn: districtsApi.getAll });
  const allDistricts: District[] = Array.isArray(rawDistricts)
    ? rawDistricts : (rawDistricts as any)?.data ?? [];

  const { data: rawCommunes } = useQuery({ queryKey: ["communes"], queryFn: communesApi.getAll });
  const allCommunes: Commune[] = Array.isArray(rawCommunes)
    ? rawCommunes : (rawCommunes as any)?.data ?? [];

  // ── Cascade ────────────────────────────────────────────────────────────────
  const filteredRegions = form.provinceId
    ? allRegions.filter(r => Number((r as any).province?.id ?? (r as any).provinceId) === Number(form.provinceId))
    : allRegions;

  const filteredDistricts = form.regionId
    ? allDistricts.filter(d => Number((d as any).region?.id ?? (d as any).regionId) === Number(form.regionId))
    : allDistricts;

  const filteredCommunes = form.districtId
    ? allCommunes.filter(c => Number((c as any).district?.id ?? (c as any).districtId) === Number(form.districtId))
    : allCommunes;

  const handleProvinceChange = (id: number) =>
    setForm(f => ({ ...f, provinceId: id, regionId: 0, districtId: 0, communeId: 0 }));

  const handleRegionChange = (id: number) =>
    setForm(f => ({ ...f, regionId: id, districtId: 0, communeId: 0 }));

  const handleDistrictChange = (id: number) =>
    setForm(f => ({ ...f, districtId: id, communeId: 0 }));

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ name: form.name.trim(), communeId: Number(form.communeId) });
  };

  const isValid = form.name.trim() && form.communeId > 0;

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <button
          onClick={() => navigate("/fokontany")}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition mb-3"
        >
          <ChevronLeft size={15} /> Retour à la liste
        </button>
        <h1 className="text-xl font-semibold text-slate-900">
          {isEdit ? "Modifier le fokontany" : "Nouveau fokontany"}
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {isEdit ? "Modifiez les informations du fokontany" : "Renseignez les informations du nouveau fokontany"}
        </p>
      </div>

      {/* ── Contenu ── */}
      <form onSubmit={handleSubmit} className="max-w-lg mx-auto px-6 py-8 flex flex-col gap-5">

        {/* Carte — Informations */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
            Informations
          </h2>
          <Field label="Nom du fokontany" required>
            <input
              type="text"
              placeholder="ex: Fokontany Ankorondrano"
              value={form.name}
              required
              autoFocus
              onChange={e => set("name", e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>

        {/* Carte — Localisation cascade */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
            Localisation
          </h2>

          {/* Indicateur de hiérarchie */}
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 rounded-lg px-3 py-2">
            <span className={form.provinceId ? "text-slate-700 font-medium" : ""}>Province</span>
            <span>›</span>
            <span className={form.regionId   ? "text-slate-700 font-medium" : ""}>Région</span>
            <span>›</span>
            <span className={form.districtId ? "text-slate-700 font-medium" : ""}>District</span>
            <span>›</span>
            <span className={form.communeId  ? "text-sky-600 font-semibold" : ""}>Commune</span>
          </div>

          <Field label="Province" required>
            <select
              value={form.provinceId || ""}
              onChange={e => handleProvinceChange(Number(e.target.value))}
              className={selectCls}
            >
              <option value="">— Choisir une province —</option>
              {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>

          <Field label="Région" required>
            <select
              value={form.regionId || ""}
              disabled={!form.provinceId}
              onChange={e => handleRegionChange(Number(e.target.value))}
              className={selectCls}
            >
              <option value="">
                {!form.provinceId ? "Choisir d'abord une province" : "— Choisir une région —"}
              </option>
              {filteredRegions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </Field>

          <Field label="District" required>
            <select
              value={form.districtId || ""}
              disabled={!form.regionId}
              onChange={e => handleDistrictChange(Number(e.target.value))}
              className={selectCls}
            >
              <option value="">
                {!form.regionId ? "Choisir d'abord une région" : "— Choisir un district —"}
              </option>
              {filteredDistricts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Field>

          <Field label="Commune" required>
            <select
              value={form.communeId || ""}
              required
              disabled={!form.districtId}
              onChange={e => set("communeId", Number(e.target.value))}
              className={selectCls}
            >
              <option value="">
                {!form.districtId ? "Choisir d'abord un district" : "— Choisir une commune —"}
              </option>
              {filteredCommunes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
        </div>

        {/* Erreur */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={() => navigate("/fokontany")}
            className="px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading || !isValid}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {isEdit ? "Enregistrer" : "Créer le fokontany"}
          </button>
        </div>

      </form>
    </div>
  );
}