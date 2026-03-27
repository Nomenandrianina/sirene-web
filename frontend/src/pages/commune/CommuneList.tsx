import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2, Loader2, ChevronRight, AlertCircle } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { communesApi } from "@/services/commune.api";
import { provincesApi } from "@/services/province.api";
import { regionsApi }   from "@/services/region.api";
import { districtsApi } from "@/services/districts.api";
import type { Commune }  from "@/types/commune";
import type { Province } from "@/types/province";
import type { Region }   from "@/types/region";
import type { District } from "@/types/district";
import { CanDo } from "@/components/Cando";

// ── Modale de confirmation suppression ──────────────────────────────────────
function DeleteModal({commune, onConfirm, onCancel, loading,}: {
    commune: Commune; onConfirm: () => void; onCancel:  () => void; loading:   boolean;}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mx-auto mb-4">
          <AlertCircle size={22} className="text-red-500" />
        </div>
        <h3 className="text-center text-base font-semibold text-slate-900 mb-1">
          Supprimer la commune
        </h3>
        <p className="text-center text-sm text-slate-500 mb-6">
          Voulez-vous vraiment supprimer <span className="font-medium text-slate-800">«&nbsp;{commune.name}&nbsp;»</span> ?
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

// ── Composant principal ──────────────────────────────────────────────────────
export default function CommuneList() {
  const navigate = useNavigate();
  const qc       = useQueryClient();

  const [search,     setSearch]     = useState("");
  const [filterProv, setFilterProv] = useState(0);
  const [filterReg,  setFilterReg]  = useState(0);
  const [filterDist, setFilterDist] = useState(0);
  const [toDelete,   setToDelete]   = useState<Commune | null>(null);
  const [deleteError, setDeleteError] = useState("");

  // ── Données ────────────────────────────────────────────────────────────────
  const { data: rawCommunes, isLoading } = useQuery({
    queryKey: ["communes"],
    queryFn:  communesApi.getAll,
  });
  const communes: Commune[] = Array.isArray(rawCommunes)
    ? rawCommunes : (rawCommunes as any)?.data ?? [];

  const { data: rawProvinces } = useQuery({ queryKey: ["provinces"], queryFn: provincesApi.getAll });
  const provinces: Province[] = Array.isArray(rawProvinces) ? rawProvinces : (rawProvinces as any)?.data ?? [];

  const { data: rawRegions } = useQuery({ queryKey: ["regions"], queryFn: regionsApi.getAll });
  const allRegions: Region[] = Array.isArray(rawRegions) ? rawRegions : (rawRegions as any)?.data ?? [];

  const { data: rawDistricts } = useQuery({ queryKey: ["districts"], queryFn: districtsApi.getAll });
  const allDistricts: District[] = Array.isArray(rawDistricts) ? rawDistricts : (rawDistricts as any)?.data ?? [];

  // ── Cascade filtres ────────────────────────────────────────────────────────
  const filteredRegions = filterProv
    ? allRegions.filter(r => Number((r as any).province?.id ?? (r as any).provinceId) === filterProv)
    : allRegions;

  const filteredDistricts = filterReg
    ? allDistricts.filter(d => Number((d as any).region?.id ?? (d as any).regionId) === filterReg)
    : allDistricts;

  const handleProvChange = (id: number) => { setFilterProv(id); setFilterReg(0); setFilterDist(0); };
  const handleRegChange  = (id: number) => { setFilterReg(id);  setFilterDist(0); };

  // ── Filtrage local ─────────────────────────────────────────────────────────
  const filtered = communes.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchDist   = filterDist ? Number((c as any).district?.id ?? c.districtId) === filterDist : true;
    const matchReg    = filterReg  ? Number((c as any).district?.region?.id) === filterReg : true;
    const matchProv   = filterProv ? Number((c as any).district?.region?.province?.id) === filterProv : true;
    return matchSearch && matchDist && matchReg && matchProv;
  });

  // ── Suppression ────────────────────────────────────────────────────────────
  const deleteMut = useMutation({
    mutationFn: (id: number) => communesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["communes"] });
      setToDelete(null);
      setDeleteError("");
    },
    onError: (err: any) =>
      setDeleteError(err?.response?.data?.message || err.message || "Erreur lors de la suppression"),
  });

  const selectCls =
    "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 " +
    "focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition";

  // ── Rendu ──────────────────────────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="min-h-screen bg-slate-50">

        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Communes</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {communes.length} commune{communes.length !== 1 ? "s" : ""} au total
              </p>
            </div>
            <CanDo permission="communes:create">
                <button
                onClick={() => navigate("/communes/create")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 transition">
                <Plus size={15} /> Nouvelle commune
                </button>
            </CanDo>
          </div>
        </div>

        <div className="px-6 py-6 flex flex-col gap-4 max-w-6xl mx-auto">

          {/* Barre de recherche + filtres */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex flex-wrap gap-3">

              {/* Recherche */}
              <div className="relative flex-1 min-w-48">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher une commune…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                />
              </div>

              {/* Filtre Province */}
              <select value={filterProv || ""} onChange={e => handleProvChange(Number(e.target.value))} className={selectCls}>
                <option value="">Toutes les provinces</option>
                {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>

              {/* Filtre Région */}
              <select
                value={filterReg || ""}
                disabled={!filterProv}
                onChange={e => handleRegChange(Number(e.target.value))}
                className={selectCls}
              >
                <option value="">{!filterProv ? "Province d'abord" : "Toutes les régions"}</option>
                {filteredRegions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>

              {/* Filtre District */}
              <select
                value={filterDist || ""}
                disabled={!filterReg}
                onChange={e => setFilterDist(Number(e.target.value))}
                className={selectCls}
              >
                <option value="">{!filterReg ? "Région d'abord" : "Tous les districts"}</option>
                {filteredDistricts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>

              {/* Reset filtres */}
              {(search || filterProv || filterReg || filterDist) && (
                <button
                  onClick={() => { setSearch(""); setFilterProv(0); setFilterReg(0); setFilterDist(0); }}
                  className="px-3 py-2 rounded-lg text-sm text-slate-500 bg-slate-100 hover:bg-slate-200 transition"
                >
                  Réinitialiser
                </button>
              )}
            </div>
          </div>

          {/* Tableau */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
                <Loader2 size={22} className="animate-spin" />
                <span className="text-sm">Chargement…</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-400">
                <Search size={32} strokeWidth={1.5} />
                <p className="text-sm font-medium">Aucune commune trouvée</p>
                {(search || filterProv || filterReg || filterDist) && (
                  <p className="text-xs">Essayez de modifier vos filtres</p>
                )}
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Commune</th>
                    <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">District</th>
                    <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider hidden md:table-cell">Région</th>
                    <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider hidden lg:table-cell">Province</th>
                    <th className="px-5 py-3 w-24" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(commune => {
                    const district = (commune as any).district;
                    const region   = district?.region;
                    const province = region?.province;
                    return (
                      <tr key={commune.id} className="hover:bg-slate-50 transition group">
                        {/* Nom */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-sky-50 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-semibold text-sky-600">
                                {commune.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="font-medium text-slate-800">{commune.name}</span>
                          </div>
                        </td>

                        {/* District */}
                        <td className="px-5 py-3.5">
                          {district ? (
                            <div className="flex items-center gap-1.5 text-slate-600">
                              <ChevronRight size={13} className="text-slate-300" />
                              {district.name}
                            </div>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>

                        {/* Région */}
                        <td className="px-5 py-3.5 hidden md:table-cell text-slate-500">
                          {region?.name ?? <span className="text-slate-300">—</span>}
                        </td>

                        {/* Province */}
                        <td className="px-5 py-3.5 hidden lg:table-cell">
                          {province ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                              {province.name}
                            </span>
                          ) : <span className="text-slate-300">—</span>}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                            <CanDo permission="communes:update">
                                <button
                                onClick={() => navigate(`/communes/${commune.id}/edit`)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition"
                                title="Modifier"
                                >
                                <Pencil size={14} />
                                </button>
                            </CanDo>
                            <CanDo permission="communes:delete">
                                <button
                                onClick={() => { setToDelete(commune); setDeleteError(""); }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
                                title="Supprimer"
                                >
                                <Trash2 size={14} />
                                </button>
                            </CanDo>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Footer compteur */}
            {!isLoading && filtered.length > 0 && (
              <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-400">
                {filtered.length === communes.length
                  ? `${communes.length} commune${communes.length !== 1 ? "s" : ""}`
                  : `${filtered.length} résultat${filtered.length !== 1 ? "s" : ""} sur ${communes.length}`}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modale suppression */}
      {toDelete && (
        <DeleteModal
          commune={toDelete}
          onConfirm={() => deleteMut.mutate(toDelete.id)}
          onCancel={() => { setToDelete(null); setDeleteError(""); }}
          loading={deleteMut.isPending}
        />
      )}

      {/* Erreur suppression (toast simple) */}
      {deleteError && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-red-600 text-white text-sm px-4 py-3 rounded-xl shadow-lg">
          <AlertCircle size={15} />
          {deleteError}
        </div>
      )}
    </AppLayout>
  );
}