import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sirenesApi } from "@/services/sirene.api";
import { Sirene } from "@/types/sirene";
import { AppLayout } from "@/components/AppLayout";
import {
  Search, Plus, Edit2, Trash2, Wifi, WifiOff,
  ChevronLeft, ChevronRight, Loader2, Navigation,
} from "lucide-react";
import { CanDo } from "@/components/Cando";
import { useRole } from "@/hooks/useRole";
import Swal from "sweetalert2";

// ── Toast SweetAlert2 (succès/erreur discret en haut à droite) ──
const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
});

const PER_PAGE = 10;

export default function SireneList() {
  const navigate    = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page,   setPage]   = useState(1);
  const { isSuperAdmin } = useRole();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const { data: sirenes = [], isLoading } = useQuery({
    queryKey: ["sirenes"],
    queryFn:  () => sirenesApi.getAll(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => sirenesApi.remove(id),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ["sirenes"] }),
  });

  // ── Mutation activer/désactiver en masse ──
  const bulkStatusMutation = useMutation({
    mutationFn: async (isActive: 0 | 1) => {
      await Promise.all(
        Array.from(selectedIds).map(id => sirenesApi.update(id, { isActive }))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sirenes"] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["sirenes"] });
    },
  });

  // ── Confirmation + exécution : suppression ──
  async function handleDelete(s: Sirene) {
    const result = await Swal.fire({
      title: "Supprimer cette sirène ?",
      text: `${s.name ?? s.imei ?? "Sirène #" + s.id} sera définitivement supprimée.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Supprimer",
      cancelButtonText: "Annuler",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#94a3b8",
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;

    try {
      await deleteMutation.mutateAsync(s.id);
      toast.fire({ icon: "success", title: "Sirène supprimée avec succès" });
    } catch {
      toast.fire({ icon: "error", title: "Échec de la suppression" });
    }
  }

  // ── Confirmation + exécution : activer/désactiver en masse ──
  async function handleBulkStatus(isActive: 0 | 1) {
    const count = selectedIds.size;
    const label = isActive ? "activer" : "désactiver";

    const result = await Swal.fire({
      title: isActive ? "Activer les sirènes sélectionnées ?" : "Désactiver les sirènes sélectionnées ?",
      text: `Cette action va ${label} ${count} sirène${count > 1 ? "s" : ""}.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: isActive ? "Activer" : "Désactiver",
      cancelButtonText: "Annuler",
      confirmButtonColor: isActive ? "#16a34a" : "#dc2626",
      cancelButtonColor: "#94a3b8",
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;

    try {
      await bulkStatusMutation.mutateAsync(isActive);
      setSelectedIds(new Set());
      toast.fire({
        icon: "success",
        title: isActive
          ? `${count} sirène${count > 1 ? "s" : ""} activée${count > 1 ? "s" : ""}`
          : `${count} sirène${count > 1 ? "s" : ""} désactivée${count > 1 ? "s" : ""}`,
      });
    } catch {
      toast.fire({ icon: "error", title: "Échec de la mise à jour du statut" });
    }
  }

  // Filtrage étendu à toutes les colonnes
  const filtered = sirenes.filter((s: Sirene) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return [
      s.imei,
      s.name,
      s.village?.name,
      s.village?.district?.name,
      s.phoneNumberBrain,
      s.phoneNumberRelai,
      s.communicationType,
      s.latitude,
      s.longitude,
      ...(s.customers?.map(c => c.name) ?? []),
    ].some(v => v?.toString().toLowerCase().includes(q));
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function goToMap(s: Sirene) {
    navigate(`/map?id=${s.id}`);
  }

  const allPaginatedSelected = paginated.length > 0 && paginated.every(s => selectedIds.has(s.id));

  function toggleSelectAll() {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allPaginatedSelected) paginated.forEach(s => next.delete(s.id));
      else paginated.forEach(s => next.add(s.id));
      return next;
    });
  }

  function toggleSelect(id: number) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // Nombre de colonnes visibles (pour colSpan de la ligne vide)
  const colCount = 6 + (isSuperAdmin ? 4 : 0); // checkbox + imei + clients + type comm + actions = 5, mais checkbox compté séparément
  // Base visible pour tous : Référence, District, Village, Statut, Coordonnées = 5
  // + isSuperAdmin : checkbox, IMEI, Clients, Type communication, Actions = 5
  const totalCols = 5 + (isSuperAdmin ? 5 : 0);

  return (
    <AppLayout>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Sirènes</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {sirenes.length} sirène{sirenes.length > 1 ? "s" : ""} enregistrée{sirenes.length > 1 ? "s" : ""}
            </p>
          </div>
          <CanDo permission="sirenes:create">
            <button
              onClick={() => navigate("/sirenes/create")}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-blue-950 hover:bg-blue-900 shadow-sm transition"
            >
              <Plus size={16} /> Nouvelle sirène
            </button>
          </CanDo>
        </div>

        {/* ── Barre de recherche ── */}
        <div className="mb-4">
          <div className="flex items-center gap-2 max-w-md w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-sky-500 focus-within:border-transparent transition">
            <Search size={15} className="text-slate-400 flex-shrink-0" />
            <input
              placeholder="Rechercher par référence, IMEI, district, village, client…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none bg-transparent"
            />
          </div>
        </div>

        {/* ── Barre d'actions groupées ── */}
        {isSuperAdmin && selectedIds.size > 0 && (
          <div className="flex items-center gap-3 px-4 py-2.5 mb-3 rounded-lg border border-sky-200 bg-sky-50 text-sm font-medium text-sky-800">
            <span>
              {selectedIds.size} sirène{selectedIds.size > 1 ? "s" : ""} sélectionnée{selectedIds.size > 1 ? "s" : ""}
            </span>

            <button
              type="button"
              disabled={bulkStatusMutation.isPending}
              onClick={() => handleBulkStatus(1)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <Wifi size={13} /> Activer
            </button>

            <button
              type="button"
              disabled={bulkStatusMutation.isPending}
              onClick={() => handleBulkStatus(0)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <WifiOff size={13} /> Désactiver
            </button>

            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="ml-auto text-xs font-normal text-slate-400 hover:text-slate-600 transition"
            >
              Annuler la sélection
            </button>
          </div>
        )}

        {/* ── Table ── */}
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400">
            <Loader2 size={22} className="animate-spin" /> Chargement…
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 shadow-sm overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-blue-950 text-white">
                    {isSuperAdmin && (
                      <th className="w-10 px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={allPaginatedSelected}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded border-slate-300 text-sky-500 focus:ring-sky-400 cursor-pointer"
                        />
                      </th>
                    )}
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Référence</th>
                    {isSuperAdmin && <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap">IMEI</th>}
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap">District</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Village</th>
                    {isSuperAdmin && <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Clients</th>}
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Statut</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Coordonnées</th>
                    {isSuperAdmin && <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Type communication</th>}
                    {isSuperAdmin && <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={totalCols} className="px-4 py-10 text-center text-sm text-slate-400">
                        Aucune sirène trouvée
                      </td>
                    </tr>
                  ) : paginated.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50 transition">
                      {isSuperAdmin && (
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(s.id)}
                            onChange={() => toggleSelect(s.id)}
                            className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                          />
                        </td>
                      )}

                      <td className="px-4 py-3">
                        <span className="inline-block font-mono text-xs bg-slate-100 text-slate-700 rounded px-2 py-1">
                          {s.name ?? "—"}
                        </span>
                      </td>

                      {isSuperAdmin && (
                        <td className="px-4 py-3">
                          <span className="inline-block font-mono text-xs bg-slate-100 text-slate-700 rounded px-2 py-1">
                            {s.imei ?? "—"}
                          </span>
                        </td>
                      )}

                      <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{s.village?.district?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{s.village?.name ?? "—"}</td>

                      {isSuperAdmin && (
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {s.customers?.length
                              ? s.customers.map(c => (
                                  <span
                                    key={c.id}
                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-50 text-purple-700"
                                  >
                                    {c.name}
                                  </span>
                                ))
                              : <span className="text-slate-300">—</span>
                            }
                          </div>
                        </td>
                      )}

                      <td className="px-4 py-3">
                        {s.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                            <Wifi size={12} /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600">
                            <WifiOff size={12} /> Inactive
                          </span>
                        )}
                      </td>

                      {/* ── Coordonnées : bouton cliquable → carte ── */}
                      <td className="px-4 py-3">
                        {s.latitude && s.longitude ? (
                          <button
                            title="Voir sur la carte"
                            onClick={() => goToMap(s)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-blue-200 bg-blue-50 text-blue-700 text-[11px] font-mono font-medium hover:bg-blue-100 hover:border-blue-300 hover:-translate-y-px active:translate-y-0 transition whitespace-nowrap"
                          >
                            <Navigation size={11} />
                            <span>
                              {parseFloat(s.latitude).toFixed(4)}, {parseFloat(s.longitude).toFixed(4)}
                            </span>
                          </button>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {isSuperAdmin && (
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                            {s.communicationType ?? "—"}
                          </span>
                        </td>
                      )}

                      {isSuperAdmin && (
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <CanDo permission="sirenes:update">
                              <button
                                title="Modifier"
                                onClick={() => navigate(`/sirenes/${s.id}/edit`)}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 bg-white text-sky-600 hover:bg-sky-50 hover:border-sky-300 transition"
                              >
                                <Edit2 size={14} />
                              </button>
                            </CanDo>
                            <CanDo permission="sirenes:delete">
                              <button
                                title="Supprimer"
                                onClick={() => handleDelete(s)}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 bg-white text-red-500 hover:bg-red-50 hover:border-red-300 transition"
                              >
                                <Trash2 size={14} />
                              </button>
                            </CanDo>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-5">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-slate-600 font-medium">{page} / {totalPages}</span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

      </div>
    </AppLayout>
  );
}