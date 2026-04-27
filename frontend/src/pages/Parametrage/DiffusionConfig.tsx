import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, Calendar, Globe, MapPin, Plus, Trash2, Loader2, AlertCircle, CheckCircle2, Settings2, X, Search, ChevronLeft, ChevronRight, } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { diffusionConfigApi } from "@/services/diffusionlog.api";
import { regionsApi } from "@/services/region.api";
import type { Region } from "@/types/region";

// ── Types ─────────────────────────────────────────────────────────────────────

interface DiffusionConfig {
  id?: number;
  regionId: number | null;
  label: string;
  sendHour: number;
  sendMinute: number;
  sendDays: number[] | null;
  isActive: boolean;
}

// ── Constantes ────────────────────────────────────────────────────────────────

const JOURS = [
  { label: "Dim", value: 0 },
  { label: "Lun", value: 1 },
  { label: "Mar", value: 2 },
  { label: "Mer", value: 3 },
  { label: "Jeu", value: 4 },
  { label: "Ven", value: 5 },
  { label: "Sam", value: 6 },
];

const ITEMS_PER_PAGE = 6;

function formatHeure(h: number, m: number) {
  return `${String(h).padStart(2, "0")}h${String(m).padStart(2, "0")}`;
}

function formatJours(days: number[] | null) {
  if (!days || days.length === 0 || days.length === 7) return "Tous les jours";
  if (JSON.stringify([...days].sort()) === JSON.stringify([1, 2, 3, 4, 5])) return "Lun – Ven";
  return days.map(d => JOURS[d].label).join(", ");
}

const DEFAULT_CONFIG = (): DiffusionConfig => ({
  regionId: null,
  label: "",
  sendHour: 3,
  sendMinute: 0,
  sendDays: null,
  isActive: true,
});

// ── Modale suppression ────────────────────────────────────────────────────────

function DeleteModal({
  config, onConfirm, onCancel, loading,
}: {
  config: DiffusionConfig;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const label = config.label || (config.regionId === null ? "Config globale" : `Région #${config.regionId}`);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mx-auto mb-4">
          <AlertCircle size={22} className="text-red-500" />
        </div>
        <h3 className="text-center text-base font-semibold text-slate-900 mb-1">
          Supprimer la configuration
        </h3>
        <p className="text-center text-sm text-slate-500 mb-6">
          Voulez-vous vraiment supprimer{" "}
          <span className="font-medium text-slate-800">«&nbsp;{label}&nbsp;»</span> ?
          Cette action est irréversible.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 transition"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 transition"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Time input field ──────────────────────────────────────────────────────────
// Saisie libre (clavier) + flèches +1/-1, sans saut

function TimeSpinner({
  value,
  max,
  onChange,
  label,
}: {
  value: number;
  max: number;
  onChange: (v: number) => void;
  label: string;
}) {
  function clamp(v: number) {
    const n = Number(v);
    if (isNaN(n)) return value;
    return Math.max(0, Math.min(max, n));
  }

  return (
    <div className="flex flex-col items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 min-w-[56px]">
      <button
        type="button"
        className="text-slate-400 hover:text-sky-600 transition leading-none select-none"
        onClick={() => onChange((value + 1) % (max + 1))}
      >
        ▲
      </button>
      <input
        type="number"
        min={0}
        max={max}
        value={value}
        onChange={e => onChange(clamp(Number(e.target.value)))}
        onBlur={e => onChange(clamp(Number(e.target.value)))}
        className="w-10 text-center text-base font-semibold text-slate-800 tabular-nums
          bg-transparent border-none outline-none
          [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <span className="text-[10px] text-slate-400 leading-none">{label}</span>
      <button
        type="button"
        className="text-slate-400 hover:text-sky-600 transition leading-none select-none"
        onClick={() => onChange((value - 1 + max + 1) % (max + 1))}
      >
        ▼
      </button>
    </div>
  );
}

// ── Formulaire édition ────────────────────────────────────────────────────────

function ConfigForm({
  form, regions, showRegionPicker, onChange,
}: {
  form: DiffusionConfig;
  regions: Region[];
  showRegionPicker: boolean;
  onChange: (f: DiffusionConfig) => void;
}) {
  function toggleDay(day: number) {
    const current = form.sendDays ?? [];
    const next = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day].sort((a, b) => a - b);
    onChange({ ...form, sendDays: next.length === 0 ? null : next });
  }

  const selectCls =
    "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 " +
    "focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition w-full";

  return (
    <div className="flex flex-col gap-4 pt-4 border-t border-slate-100 mt-4">

      {/* Région */}
      {showRegionPicker && (
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider">
            <MapPin size={12} /> Région
          </label>
          <select
            className={selectCls}
            value={form.regionId ?? ""}
            onChange={e => {
              const rid = e.target.value === "" ? null : Number(e.target.value);
              const reg = regions.find(r => r.id === rid);
              onChange({ ...form, regionId: rid, label: reg?.name ?? "Global" });
            }}
          >
            <option value="">Globale (fallback toutes régions)</option>
            {regions.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Heure d'envoi — saisie libre + flèches +1/-1 */}
      <div className="flex flex-col gap-1.5">
        <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider">
          <Clock size={12} /> Heure d'envoi
        </label>
        <div className="flex items-center gap-3">
          <TimeSpinner
            value={form.sendHour}
            max={23}
            label="h"
            onChange={v => onChange({ ...form, sendHour: v })}
          />
          <span className="text-xl text-slate-400 font-semibold mb-4">:</span>
          <TimeSpinner
            value={form.sendMinute}
            max={59}
            label="min"
            onChange={v => onChange({ ...form, sendMinute: v })}
          />
          <span className="text-xs text-slate-400 ml-1 leading-relaxed">
            Envoi la veille pour J+1<br />(fuseau Antananarivo)
          </span>
        </div>
      </div>

      {/* Jours d'envoi */}
      <div className="flex flex-col gap-1.5">
        <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider">
          <Calendar size={12} /> Jours d'envoi
        </label>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => onChange({ ...form, sendDays: null })}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
              !form.sendDays || form.sendDays.length === 0
                ? "bg-sky-600 text-white border-sky-600"
                : "bg-white text-slate-600 border-slate-200 hover:border-sky-300 hover:text-sky-600"
            }`}
          >
            Tous
          </button>
          {JOURS.map(j => (
            <button
              key={j.value}
              type="button"
              onClick={() => toggleDay(j.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                form.sendDays?.includes(j.value)
                  ? "bg-sky-600 text-white border-sky-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-sky-300 hover:text-sky-600"
              }`}
            >
              {j.label}
            </button>
          ))}
        </div>
      </div>

      {/* Toggle actif */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          Config active
        </label>
        <button
          type="button"
          onClick={() => onChange({ ...form, isActive: !form.isActive })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            form.isActive ? "bg-sky-600" : "bg-slate-200"
          }`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            form.isActive ? "translate-x-6" : "translate-x-1"
          }`} />
        </button>
      </div>
    </div>
  );
}

// ── Carte config ──────────────────────────────────────────────────────────────

function ConfigCard({
  config, regions, onSave, onDelete, isNew = false,
}: {
  config: DiffusionConfig;
  regions: Region[];
  onSave: (c: DiffusionConfig) => Promise<void>;
  onDelete?: () => void;
  isNew?: boolean;
}) {
  const [form, setForm]       = useState<DiffusionConfig>(config);
  const [editing, setEditing] = useState(isNew);
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState(false);

  const isGlobal = form.regionId === null;
  const region   = regions.find(r => r.id === form.regionId);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(form);
      setSuccess(true);
      setEditing(false);
      setTimeout(() => setSuccess(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`bg-white rounded-xl border shadow-sm p-5 transition ${
      isGlobal ? "border-sky-200 ring-1 ring-sky-100" : "border-slate-200"
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isGlobal ? "bg-sky-50" : "bg-emerald-50"
          }`}>
            {isGlobal
              ? <Globe size={16} className="text-sky-600" />
              : <MapPin size={16} className="text-emerald-600" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">
              {isGlobal ? "Configuration globale" : (region?.name ?? `Région #${form.regionId}`)}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {isGlobal
                ? "Fallback — toutes régions sans config dédiée"
                : "Config spécifique à cette région"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {success && <CheckCircle2 size={15} className="text-emerald-500" />}
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition"
              title="Modifier"
            >
              <Settings2 size={14} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
              title="Supprimer"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Résumé */}
      {!editing && (
        <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-sm text-slate-600">
            <Clock size={13} className="text-slate-400" />
            <span className="font-semibold tabular-nums">{formatHeure(form.sendHour, form.sendMinute)}</span>
          </div>
          <div className="w-px h-4 bg-slate-200" />
          <div className="flex items-center gap-1.5 text-sm text-slate-600">
            <Calendar size={13} className="text-slate-400" />
            <span>{formatJours(form.sendDays)}</span>
          </div>
          <div className="w-px h-4 bg-slate-200" />
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            form.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
          }`}>
            {form.isActive ? "● Active" : "○ Inactive"}
          </span>
        </div>
      )}

      {/* Formulaire */}
      {editing && (
        <>
          <ConfigForm
            form={form}
            regions={regions}
            showRegionPicker={isNew}
            onChange={setForm}
          />
          <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-slate-100">
            {!isNew && (
              <button
                onClick={() => { setForm(config); setEditing(false); }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
              >
                Annuler
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 transition"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              {isNew ? "Créer la configuration" : "Enregistrer"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────

function Pagination({
  page, total, perPage, onChange,
}: {
  page: number; total: number; perPage: number; onChange: (p: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-2">
      <span className="text-xs text-slate-400">
        {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} sur {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition"
        >
          <ChevronLeft size={14} />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`w-7 h-7 rounded-lg text-xs font-medium transition ${
              p === page
                ? "bg-sky-600 text-white"
                : "border border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function DiffusionConfigPage() {
  const qc = useQueryClient();
  const [showNewForm, setShowNewForm] = useState(false);
  const [toDelete,    setToDelete]    = useState<DiffusionConfig | null>(null);
  const [deleteError, setDeleteError] = useState("");

  // Recherche + pagination sur les configs par région
  const [search, setSearch] = useState("");
  const [page,   setPage]   = useState(1);

  const { data: rawConfigs = [], isLoading } = useQuery({
    queryKey: ["diffusion-configs"],
    queryFn:  diffusionConfigApi.getAll,
  });
  const configs: DiffusionConfig[] = Array.isArray(rawConfigs) ? rawConfigs : [];

  const { data: rawRegions = [] } = useQuery({
    queryKey: ["regions"],
    queryFn:  regionsApi.getAll,
  });
  const regions: Region[] = Array.isArray(rawRegions) ? rawRegions : (rawRegions as any)?.data ?? [];

  const usedRegionIds   = new Set(configs.map(c => c.regionId).filter(Boolean));
  const availableRegions = regions.filter(r => !usedRegionIds.has(r.id));

  const upsertMut = useMutation({
    mutationFn: (dto: DiffusionConfig) => diffusionConfigApi.upsert(dto),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["diffusion-configs"] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => diffusionConfigApi.delete(id),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ["diffusion-configs"] });
      setToDelete(null);
      setDeleteError("");
    },
    onError: (err: any) =>
      setDeleteError(err?.response?.data?.message || err.message || "Erreur lors de la suppression"),
  });

  async function handleSave(dto: DiffusionConfig) {
    await upsertMut.mutateAsync(dto);
    setShowNewForm(false);
  }

  const globalConfig  = configs.find(c => c.regionId === null);
  const regionConfigs = configs.filter(c => c.regionId !== null);

  // Recherche : filtre par nom de région (résolu via la liste regions)
  const filteredRegionConfigs = useMemo(() => {
    if (!search.trim()) return regionConfigs;
    const q = search.toLowerCase();
    return regionConfigs.filter(cfg => {
      const regionName = regions.find(r => r.id === cfg.regionId)?.name ?? "";
      return (
        regionName.toLowerCase().includes(q) ||
        cfg.label?.toLowerCase().includes(q)
      );
    });
  }, [regionConfigs, regions, search]);

  // Pagination
  const totalPages   = Math.max(1, Math.ceil(filteredRegionConfigs.length / ITEMS_PER_PAGE));
  const paginated    = filteredRegionConfigs.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Reset page quand search change
  function handleSearch(v: string) {
    setSearch(v);
    setPage(1);
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-slate-50">

        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Paramétrage des diffusions</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Configurez l'heure et les jours d'envoi par région
              </p>
            </div>
            <button
              onClick={() => setShowNewForm(true)}
              disabled={showNewForm}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 transition"
            >
              <Plus size={15} /> Nouvelle config
            </button>
          </div>
        </div>

        <div className="px-6 py-6 flex flex-col gap-6 max-w-3xl mx-auto">

          {/* Nouvelle config */}
          {showNewForm && (
            <div className="relative">
              <button
                onClick={() => setShowNewForm(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition z-10"
              >
                <X size={14} />
              </button>
              <ConfigCard
                config={DEFAULT_CONFIG()}
                regions={availableRegions}
                onSave={handleSave}
                isNew
              />
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
              <Loader2 size={22} className="animate-spin" />
              <span className="text-sm">Chargement…</span>
            </div>
          )}

          {!isLoading && (
            <>
              {/* Config globale */}
              <div className="flex flex-col gap-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
                  Configuration globale
                </p>
                {globalConfig ? (
                  <ConfigCard
                    config={globalConfig}
                    regions={regions}
                    onSave={handleSave}
                    onDelete={() => { setToDelete(globalConfig); setDeleteError(""); }}
                  />
                ) : (
                  <div className="bg-white rounded-xl border border-dashed border-slate-300 p-6 text-center">
                    <Globe size={22} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-sm text-slate-400">Aucune configuration globale</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Créez-en une comme fallback pour les régions sans config dédiée
                    </p>
                  </div>
                )}
              </div>

              {/* Configs par région */}
              <div className="flex flex-col gap-3">
                {/* Titre + barre recherche */}
                <div className="flex items-center justify-between gap-3 px-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    Configurations par région
                    <span className="ml-2 font-normal text-slate-300">({filteredRegionConfigs.length})</span>
                  </p>
                  {regionConfigs.length > 0 && (
                    <div className="relative w-52">
                      <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Rechercher une région…"
                        value={search}
                        onChange={e => handleSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700
                          placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                      />
                      {search && (
                        <button
                          onClick={() => handleSearch("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                        >
                          <X size={11} />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {regionConfigs.length === 0 ? (
                  <div className="bg-white rounded-xl border border-dashed border-slate-300 p-6 text-center">
                    <MapPin size={22} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-sm text-slate-400">Aucune config par région</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Ajoutez une config dédiée pour envoyer à une heure différente selon la région
                    </p>
                  </div>
                ) : filteredRegionConfigs.length === 0 ? (
                  <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
                    <Search size={22} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-sm text-slate-400">Aucune région ne correspond à «&nbsp;{search}&nbsp;»</p>
                  </div>
                ) : (
                  <>
                    {paginated.map(cfg => (
                      <ConfigCard
                        key={cfg.id}
                        config={cfg}
                        regions={regions}
                        onSave={handleSave}
                        onDelete={() => { setToDelete(cfg); setDeleteError(""); }}
                      />
                    ))}
                    <Pagination
                      page={page}
                      total={filteredRegionConfigs.length}
                      perPage={ITEMS_PER_PAGE}
                      onChange={setPage}
                    />
                  </>
                )}
              </div>

              {configs.length > 0 && (
                <div className="flex items-start gap-2.5 bg-sky-50 border border-sky-100 rounded-xl px-4 py-3">
                  <AlertCircle size={14} className="text-sky-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-sky-700 leading-relaxed">
                    Les crons sont rechargés automatiquement après chaque modification.
                    L'envoi se fait la veille pour J+1 à l'heure configurée (fuseau Indian/Antananarivo).
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {toDelete && (
        <DeleteModal
          config={toDelete}
          onConfirm={() => toDelete.id !== undefined && deleteMut.mutate(toDelete.id)}
          onCancel={() => { setToDelete(null); setDeleteError(""); }}
          loading={deleteMut.isPending}
        />
      )}

      {deleteError && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-red-600 text-white text-sm px-4 py-3 rounded-xl shadow-lg">
          <AlertCircle size={15} />
          {deleteError}
        </div>
      )}
    </AppLayout>
  );
}