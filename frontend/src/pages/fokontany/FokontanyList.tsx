import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2, Loader2, ChevronRight, AlertCircle, ChevronLeft } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { fokontanyApi } from "@/services/fokontany.api";
import { communesApi }  from "@/services/commune.api";
import { provincesApi } from "@/services/province.api";
import { regionsApi }   from "@/services/region.api";
import { districtsApi } from "@/services/districts.api";
import type { Fokontany } from "@/types/fokontany";
import type { Commune }   from "@/types/commune";
import type { Province }  from "@/types/province";
import type { Region }    from "@/types/region";
import type { District }  from "@/types/district";
import { CanDo } from "@/components/Cando";

// ── Modale de confirmation suppression ──────────────────────────────────────
function DeleteModal({
  fokontany,
  onConfirm,
  onCancel,
  loading,
}: {
  fokontany: Fokontany;
  onConfirm: () => void;
  onCancel:  () => void;
  loading:   boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mx-auto mb-4">
          <AlertCircle size={22} className="text-red-500" />
        </div>
        <h3 className="text-center text-base font-semibold text-slate-900 mb-1">
          Supprimer le fokontany
        </h3>
        <p className="text-center text-sm text-slate-500 mb-6">
          Voulez-vous vraiment supprimer <span className="font-medium text-slate-800">«&nbsp;{fokontany.name}&nbsp;»</span> ?
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
export default function FokontanyList() {
  const navigate = useNavigate();
  const qc       = useQueryClient();

  const [search,      setSearch]      = useState("");
  const [filterProv,  setFilterProv]  = useState(0);
  const [filterReg,   setFilterReg]   = useState(0);
  const [filterDist,  setFilterDist]  = useState(0);
  const [filterComm,  setFilterComm]  = useState(0);
  const [toDelete,    setToDelete]    = useState<Fokontany | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const ITEMS_PER_PAGE = 10;
  const [page, setPage] = useState(1);

  // ── Données ────────────────────────────────────────────────────────────────
  const { data: rawFokontany, isLoading } = useQuery({
    queryKey: ["fokontany"],
    queryFn:  fokontanyApi.getAll,
  });
  const fokontanyList: Fokontany[] = Array.isArray(rawFokontany)
    ? rawFokontany : (rawFokontany as any)?.data ?? [];

  const { data: rawProvinces } = useQuery({ queryKey: ["provinces"], queryFn: provincesApi.getAll });
  const provinces: Province[] = Array.isArray(rawProvinces) ? rawProvinces : (rawProvinces as any)?.data ?? [];

  const { data: rawRegions } = useQuery({ queryKey: ["regions"], queryFn: regionsApi.getAll });
  const allRegions: Region[] = Array.isArray(rawRegions) ? rawRegions : (rawRegions as any)?.data ?? [];

  const { data: rawDistricts } = useQuery({ queryKey: ["districts"], queryFn: districtsApi.getAll });
  const allDistricts: District[] = Array.isArray(rawDistricts) ? rawDistricts : (rawDistricts as any)?.data ?? [];

  const { data: rawCommunes } = useQuery({ queryKey: ["communes"], queryFn: communesApi.getAll });
  const allCommunes: Commune[] = Array.isArray(rawCommunes) ? rawCommunes : (rawCommunes as any)?.data ?? [];

  // ── Cascade filtres ────────────────────────────────────────────────────────
  const filteredRegions = filterProv
    ? allRegions.filter(r => Number((r as any).province?.id ?? (r as any).provinceId) === filterProv)
    : allRegions;

  const filteredDistricts = filterReg
    ? allDistricts.filter(d => Number((d as any).region?.id ?? (d as any).regionId) === filterReg)
    : allDistricts;

  const filteredCommunes = filterDist
    ? allCommunes.filter(c => Number((c as any).district?.id ?? c.districtId) === filterDist)
    : allCommunes;

  const handleProvChange = (id: number) => {
    setFilterProv(id); setFilterReg(0); setFilterDist(0); setFilterComm(0);
  };
  const handleRegChange  = (id: number) => { setFilterReg(id);  setFilterDist(0); setFilterComm(0); };
  const handleDistChange = (id: number) => { setFilterDist(id); setFilterComm(0); };

  // ── Filtrage local ─────────────────────────────────────────────────────────
  const filtered = fokontanyList.filter(f => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase());
    const matchComm   = filterComm ? Number((f as any).commune?.id ?? f.communeId) === filterComm  : true;
    const matchDist   = filterDist ? Number((f as any).commune?.district?.id)       === filterDist  : true;
    const matchReg    = filterReg  ? Number((f as any).commune?.district?.region?.id) === filterReg : true;
    const matchProv   = filterProv ? Number((f as any).commune?.district?.region?.province?.id) === filterProv : true;
    return matchSearch && matchComm && matchDist && matchReg && matchProv;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));

  const paginated = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  // ── Suppression ────────────────────────────────────────────────────────────
  const deleteMut = useMutation({
    mutationFn: (id: number) => fokontanyApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fokontany"] });
      setToDelete(null);
      setDeleteError("");
    },
    onError: (err: any) =>
      setDeleteError(err?.response?.data?.message || err.message || "Erreur lors de la suppression"),
  });

  const hasFilters = !!(search || filterProv || filterReg || filterDist || filterComm);

  const selectCls =
    "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 " +
    "focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent " +
    "disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed transition";

    useEffect(() => {
      setPage(1);
    }, [search, filterProv, filterReg, filterDist]);

  // ── Rendu ──────────────────────────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="min-h-screen bg-slate-50">

        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Fokontany</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {fokontanyList.length} fokontany au total
              </p>
            </div>
            <CanDo permission="fokontany:create">
                <button
                onClick={() => navigate("/fokontany/create")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 transition"
                >
                <Plus size={15} /> Nouveau fokontany
                </button>
            </CanDo>
          </div>
        </div>

        <div className="px-6 py-6 flex flex-col gap-4 max-w-6xl mx-auto">

          {/* Filtres */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex flex-wrap gap-3">

              {/* Recherche */}
              <div className="relative flex-1 min-w-48">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher un fokontany…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                />
              </div>

              {/* Province */}
              <select value={filterProv || ""} onChange={e => handleProvChange(Number(e.target.value))} className={selectCls}>
                <option value="">Toutes les provinces</option>
                {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>

              {/* Région */}
              <select value={filterReg || ""} disabled={!filterProv} onChange={e => handleRegChange(Number(e.target.value))} className={selectCls}>
                <option value="">{!filterProv ? "Province d'abord" : "Toutes les régions"}</option>
                {filteredRegions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>

              {/* District */}
              <select value={filterDist || ""} disabled={!filterReg} onChange={e => handleDistChange(Number(e.target.value))} className={selectCls}>
                <option value="">{!filterReg ? "Région d'abord" : "Tous les districts"}</option>
                {filteredDistricts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>

              {/* Commune */}
              <select value={filterComm || ""} disabled={!filterDist} onChange={e => setFilterComm(Number(e.target.value))} className={selectCls}>
                <option value="">{!filterDist ? "District d'abord" : "Toutes les communes"}</option>
                {filteredCommunes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>

              {/* Reset */}
              {hasFilters && (
                <button
                  onClick={() => { setSearch(""); setFilterProv(0); setFilterReg(0); setFilterDist(0); setFilterComm(0); }}
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
                <p className="text-sm font-medium">Aucun fokontany trouvé</p>
                {hasFilters && <p className="text-xs">Essayez de modifier vos filtres</p>}
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Fokontany</th>
                    <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Commune</th>
                    <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider hidden md:table-cell">District</th>
                    <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider hidden lg:table-cell">Région · Province</th>
                    <th className="px-5 py-3 w-24" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginated.map(foko => {
                    const commune  = (foko as any).commune;
                    const district = commune?.district;
                    const region   = district?.region;
                    const province = region?.province;
                    return (
                      <tr key={foko.id} className="hover:bg-slate-50 transition group">

                        {/* Nom fokontany */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-semibold text-emerald-600">
                                {foko.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="font-medium text-slate-800">{foko.name}</span>
                          </div>
                        </td>

                        {/* Commune */}
                        <td className="px-5 py-3.5">
                          {commune ? (
                            <div className="flex items-center gap-1.5 text-slate-600">
                              <ChevronRight size={13} className="text-slate-300" />
                              {commune.name}
                            </div>
                          ) : <span className="text-slate-300">—</span>}
                        </td>

                        {/* District */}
                        <td className="px-5 py-3.5 hidden md:table-cell text-slate-500">
                          {district?.name ?? <span className="text-slate-300">—</span>}
                        </td>

                        {/* Région · Province */}
                        <td className="px-5 py-3.5 hidden lg:table-cell">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {region && (
                              <span className="text-slate-500">{region.name}</span>
                            )}
                            {province && (
                              <>
                                <span className="text-slate-300">·</span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                  {province.name}
                                </span>
                              </>
                            )}
                            {!region && !province && <span className="text-slate-300">—</span>}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                            <CanDo permission="fokontany:update">
                                <button
                                onClick={() => navigate(`/fokontany/${foko.id}/edit`)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition"
                                title="Modifier"
                                >
                                <Pencil size={14} />
                                </button>
                            </CanDo>
                            <CanDo permission="fokontany:delete">
                                <button
                                onClick={() => { setToDelete(foko); setDeleteError(""); }}
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

            {!isLoading && filtered.length > ITEMS_PER_PAGE && (
              <div className="pagination">
                <span className="pagination-info">
                  {(page - 1) * ITEMS_PER_PAGE + 1}–
                  {Math.min(page * ITEMS_PER_PAGE, filtered.length)} sur {filtered.length}
                </span>

                <div className="pagination-controls">
                  <button
                    className="page-btn"
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    <ChevronLeft size={15} />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .reduce<(number | "...")[]>((acc, p, i, arr) => {
                      if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) =>
                      p === "..." ? (
                        <span key={`d${i}`} className="page-dots">…</span>
                      ) : (
                        <button
                          key={p}
                          className={`page-btn${page === p ? " active" : ""}`}
                          onClick={() => setPage(p as number)}
                        >
                          {p}
                        </button>
                      )
                    )}

                  <button
                    className="page-btn"
                    disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}

            {/* Footer compteur */}
            {!isLoading && filtered.length > 0 && (
              <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-400">
                {filtered.length === fokontanyList.length
                  ? `${fokontanyList.length} fokontany`
                  : `${filtered.length} résultat${filtered.length !== 1 ? "s" : ""} sur ${fokontanyList.length}`}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modale suppression */}
      {toDelete && (
        <DeleteModal
          fokontany={toDelete}
          onConfirm={() => deleteMut.mutate(toDelete.id)}
          onCancel={() => { setToDelete(null); setDeleteError(""); }}
          loading={deleteMut.isPending}
        />
      )}

      {/* Toast erreur suppression */}
      {deleteError && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-red-600 text-white text-sm px-4 py-3 rounded-xl shadow-lg">
          <AlertCircle size={15} />
          {deleteError}
        </div>
      )}
    </AppLayout>
  );
}