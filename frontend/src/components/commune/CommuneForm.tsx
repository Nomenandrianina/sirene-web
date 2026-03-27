import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ChevronLeft } from "lucide-react";
import { provincesApi } from "@/services/province.api";
import { regionsApi }   from "@/services/region.api";
import { districtsApi } from "@/services/districts.api";
import type { Province } from "@/types/province";
import type { Region }   from "@/types/region";
import type { District } from "@/types/district";

export interface CommuneFormData {
  name:       string;
  provinceId: number; // pour la cascade UI — non envoyé à l'API
  regionId:   number; // pour la cascade UI — non envoyé à l'API
  districtId: number;
}

interface CommuneFormProps {
  initialData?: Partial<CommuneFormData> & { id?: number };
  onSubmit:     (data: Pick<CommuneFormData, "name" | "districtId">) => Promise<void>;
  loading:      boolean;
  error?:       string;
}

// ── Petit composant champ réutilisable ──────────────────────────────────────
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

// ───────────────────────────────────────────────────────────────────────────

export function CommuneForm({ initialData, onSubmit, loading, error }: CommuneFormProps) {
  const isEdit   = !!initialData?.id;
  const navigate = useNavigate();

  const [form, setForm] = useState<CommuneFormData>({
    name:       initialData?.name       ?? "",
    provinceId: initialData?.provinceId ?? 0,
    regionId:   initialData?.regionId   ?? 0,
    districtId: initialData?.districtId ?? 0,
  });

  // Sync quand initialData arrive (édition async)
  useEffect(() => {
    if (initialData?.id) {
      setForm({
        name:       initialData.name       ?? "",
        provinceId: initialData.provinceId ?? 0,
        regionId:   initialData.regionId   ?? 0,
        districtId: initialData.districtId ?? 0,
      });
    }
  }, [initialData?.id]);

  const set = <K extends keyof CommuneFormData>(k: K, v: CommuneFormData[K]) =>
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

  // ── Cascade ────────────────────────────────────────────────────────────────
  const filteredRegions = form.provinceId
    ? allRegions.filter(r => Number((r as any).province?.id ?? (r as any).provinceId) === Number(form.provinceId))
    : allRegions;

  const filteredDistricts = form.regionId
    ? allDistricts.filter(d => Number((d as any).region?.id ?? (d as any).regionId) === Number(form.regionId))
    : allDistricts;

  const handleProvinceChange = (id: number) =>
    setForm(f => ({ ...f, provinceId: id, regionId: 0, districtId: 0 }));

  const handleRegionChange = (id: number) =>
    setForm(f => ({ ...f, regionId: id, districtId: 0 }));

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ name: form.name.trim(), districtId: Number(form.districtId) });
  };

  const isValid = form.name.trim() && form.districtId > 0;

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <button
          onClick={() => navigate("/communes")}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition mb-3"
        >
          <ChevronLeft size={15} /> Retour à la liste
        </button>
        <h1 className="text-xl font-semibold text-slate-900">
          {isEdit ? "Modifier la commune" : "Nouvelle commune"}
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {isEdit ? "Modifiez les informations de la commune" : "Renseignez les informations de la nouvelle commune"}
        </p>
      </div>

      {/* ── Contenu ── */}
      <form onSubmit={handleSubmit} className="max-w-lg mx-auto px-6 py-8 flex flex-col gap-5">

        {/* Carte — Informations */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
            Informations
          </h2>

          <Field label="Nom de la commune" required>
            <input
              type="text"
              placeholder="ex: Commune d'Ambohimanga"
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

          <Field label="Province" required>
            <select
              value={form.provinceId || ""}
              required
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
              required
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
              required
              disabled={!form.regionId}
              onChange={e => set("districtId", Number(e.target.value))}
              className={selectCls}
            >
              <option value="">
                {!form.regionId ? "Choisir d'abord une région" : "— Choisir un district —"}
              </option>
              {filteredDistricts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
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
            onClick={() => navigate("/communes")}
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
            {isEdit ? "Enregistrer" : "Créer la commune"}
          </button>
        </div>

      </form>
    </div>
  );
}