import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { villagesApi } from "@/services/village.api";
import type { Village } from "@/types/village";
import { Search, Plus, Pencil, Trash2,Loader2, ChevronLeft, ChevronRight, Home, TriangleAlert,} from "lucide-react";
import {AlertDialog,AlertDialogAction,AlertDialogCancel,AlertDialogContent,AlertDialogDescription,AlertDialogFooter,AlertDialogHeader,AlertDialogTitle,} from "@/components/ui/alert-dialog";
import "@/styles/page.css";
import "@/styles/utilisateurs.css";
import { CanDo } from "@/components/Cando";

const ITEMS_PER_PAGE = 10;

export default function VillageList() {
  const navigate = useNavigate();
  const qc       = useQueryClient();

  const [search,     setSearch]     = useState("");
  const [page,       setPage]       = useState(1);
  const [delVillage, setDelVillage] = useState<Village | null>(null);
  const [delError,   setDelError]   = useState("");

  const { data: raw, isLoading } = useQuery({
    queryKey: ["villages"],
    queryFn:  () => villagesApi.getAll(),
  });

  const villages: Village[] = Array.isArray(raw)
    ? raw
    : (raw as any)?.data ?? (raw as any)?.response ?? [];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return villages.filter(v =>
      v.name.toLowerCase().includes(q) ||
      (v as any).district?.name?.toLowerCase().includes(q) ||
      (v as any).region?.name?.toLowerCase().includes(q) ||
      (v as any).province?.name?.toLowerCase().includes(q)
    );
  }, [villages, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated  = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const deleteMut = useMutation({
    mutationFn: (id: number) => villagesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["villages"] });
      setDelError("");
      // Fermer le dialog après un court délai pour que l'user voit la liste rechargée
      setTimeout(() => setDelVillage(null), 300);
    },
    onError: (err: any) => {
      setDelError(
        err?.response?.data?.message || err?.message || "Erreur lors de la suppression"
      );
    },
  });

  function openDelete(v: Village) {
    setDelError("");
    deleteMut.reset();
    setDelVillage(v);
  }

  function closeDelete() {
    if (deleteMut.isPending) return; // empêcher fermeture pendant chargement
    setDelVillage(null);
    setDelError("");
    deleteMut.reset();
  }

  return (
    <AppLayout>
      <div className="page-wrap">

        <div className="page-header">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Villages</h1>
            <p className="page-subtitle">
              {villages.length} village{villages.length > 1 ? "s" : ""} enregistré{villages.length > 1 ? "s" : ""}
            </p>
          </div>
          <CanDo permission="villages:create">
            <button className="btn-primary" onClick={() => navigate("/villages/create")}>
              <Plus size={15} /> Nouveau village
            </button>
          </CanDo>
        </div>

        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Liste des villages</span>
            <div className="search-wrap">
              <Search size={14} className="search-icon" />
              <input
                className="search-input"
                placeholder="Nom, district, région, province…"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            {isLoading ? (
              <div className="empty-state">
                <Loader2 size={24} className="spin" /><p>Chargement…</p>
              </div>
            ) : paginated.length === 0 ? (
              <div className="empty-state">
                <Home size={28} /><p>Aucun village trouvé</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Village</th>
                    <th>Province</th>
                    <th>Région</th>
                    <th>District</th>
                    <th>Commune</th>
                    <th>Fokontany</th>
                    <th>Coordonnées GPS</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(v => (
                    <tr key={v.id}>
                      <td>
                        <div className="user-cell">
                          <div className="role-avatar"><Home size={14} /></div>
                          <span className="user-cell-name">{v.name}</span>
                        </div>
                      </td>
                      <td>
                        {(v as any).province?.name
                          ? <span className="perm-tag">{(v as any).province.name}</span>
                          : <span style={{ color: "var(--p-text-3)" }}>—</span>}
                      </td>
                      <td>
                        {(v as any).region?.name
                          ? <span className="perm-tag">{(v as any).region.name}</span>
                          : <span style={{ color: "var(--p-text-3)" }}>—</span>}
                      </td>
                      <td>
                        {(v as any).district?.name
                          ? <span className="perm-tag">{(v as any).district.name}</span>
                          : <span style={{ color: "var(--p-text-3)" }}>—</span>}
                      </td>
                      <td>
                        {(v as any).commune?.name
                          ? <span className="perm-tag">{(v as any).commune.name}</span>
                          : <span style={{ color: "var(--p-text-3)" }}>—</span>}
                      </td>
                      <td>
                        {(v as any).fokontany?.name
                          ? <span className="perm-tag">{(v as any).fokontany.name}</span>
                          : <span style={{ color: "var(--p-text-3)" }}>—</span>}
                      </td>
                      <td>
                        {v.latitude && v.longitude ? (
                          <span className="cell-imei">
                            {parseFloat(v.latitude).toFixed(4)}, {parseFloat(v.longitude).toFixed(4)}
                          </span>
                        ) : (
                          <span style={{ color: "var(--p-text-3)" }}>—</span>
                        )}
                      </td>
                      <td>
                        <div className="action-btns">
                          <CanDo permission="villages:update">
                            <button className="action-btn edit" title="Modifier"
                              onClick={() => navigate(`/villages/${v.id}/edit`)}>
                              <Pencil size={14} />
                            </button>
                          </CanDo>
                          <CanDo permission="villages:delete">
                            <button className="action-btn delete" title="Supprimer"
                              onClick={() => openDelete(v)}>
                              <Trash2 size={14} />
                            </button>
                          </CanDo>
                          <button onClick={() => navigate(`/villages/${v.id}/weather`)}>⚡</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {!isLoading && filtered.length > ITEMS_PER_PAGE && (
            <div className="pagination">
              <span className="pagination-info">
                {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} sur {filtered.length}
              </span>
              <div className="pagination-controls">
                <button className="page-btn" disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft size={15} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | "...")[]>((acc, p, i, arr) => {
                    if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                    acc.push(p); return acc;
                  }, [])
                  .map((p, i) => p === "..." ? (
                    <span key={`d${i}`} className="page-dots">…</span>
                  ) : (
                    <button key={p}
                      className={`page-btn${page === p ? " active" : ""}`}
                      onClick={() => setPage(p as number)}>{p}
                    </button>
                  ))}
                <button className="page-btn" disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}>
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Dialog confirmation suppression ── */}
      <AlertDialog open={!!delVillage} onOpenChange={v => { if (!v) closeDelete(); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <TriangleAlert size={18} className="text-red-500" />
              Supprimer le village
            </AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer{" "}
              <strong className="text-foreground">« {delVillage?.name} »</strong> ?
              <br />Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Message d'erreur si suppression échoue */}
          {delError && (
            <div style={{
              background: "#fef2f2", border: "1px solid #fecaca",
              color: "#dc2626", borderRadius: 8, padding: "10px 14px",
              fontSize: "0.83rem", display: "flex", alignItems: "center", gap: 8,
            }}>
              <TriangleAlert size={14} />
              {delError}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMut.isPending} onClick={closeDelete}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMut.isPending}
              onClick={() => delVillage && deleteMut.mutate(delVillage.id)}
              style={{ background: "#dc2626" }}
              className="hover:bg-red-700"
            >
              {deleteMut.isPending
                ? <><Loader2 size={14} className="animate-spin" style={{ marginRight: 6 }} />Suppression…</>
                : "Supprimer"
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </AppLayout>
  );
}