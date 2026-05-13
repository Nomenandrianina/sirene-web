import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { typeAlerteBngrcApi } from "@/services/typeAlerteBngrc.api";
import { Search, Plus, Pencil, Trash2, Loader2, ChevronLeft, ChevronRight, Wind, AlertTriangle, } from "lucide-react";
import { CanDo } from "@/components/Cando";
import "@/styles/page.css";
import "@/styles/utilisateurs.css";
 
const PER_PAGE = 10;


interface DeleteDialogProps {
    open: boolean; itemName: string; loading: boolean; error: string;
    onConfirm: () => void; onCancel: () => void;
  }
  
function TypeAlerteBngrcDeleteDialog({ open, itemName, loading, error, onConfirm, onCancel }: DeleteDialogProps) {
if (!open) return null;
return (
    <div className="modal-overlay" onClick={onCancel}>
    <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-icon modal-icon--danger"><AlertTriangle size={22} /></div>
        <h3 className="modal-title">Supprimer l'aléa</h3>
        <p className="modal-body">
        Voulez-vous supprimer <strong>« {itemName} »</strong> ?
        <br />
        <span className="modal-warn">Toutes les catégories associées seront également supprimées.</span>
        </p>
        {error && <div className="form-error">{error}</div>}
        <div className="modal-actions">
        <button className="btn-cancel" onClick={onCancel} disabled={loading}>Annuler</button>
        <button className="btn-danger" onClick={onConfirm} disabled={loading}>
            {loading && <Loader2 size={14} className="spin" />} Supprimer
        </button>
        </div>
    </div>
    </div>
);
}



export default function TypeAlerteBngrcList() {
  const navigate   = useNavigate();
  const qc         = useQueryClient();
  const [search,   setSearch]   = useState("");
  const [page,     setPage]     = useState(1);
  const [delItem,  setDelItem]  = useState<{ id: number; name: string } | null>(null);
  const [delError, setDelError] = useState("");
 
  const { data: raw, isLoading } = useQuery({
    queryKey: ["type-alerte-bngrc"],
    queryFn:  () => typeAlerteBngrcApi.getAll(),
  });
  const items: any[] = Array.isArray(raw) ? raw : (raw as any)?.response ?? [];
 
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((a: any) => a.name.toLowerCase().includes(q));
  }, [items, search]);
 
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
 
  const deleteMut = useMutation({
    mutationFn: (id: number) => typeAlerteBngrcApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["type-alerte-bngrc"] });
      setDelError("");
      setTimeout(() => setDelItem(null), 300);
    },
    onError: (e: any) =>
      setDelError(e?.response?.data?.message || e?.message || "Erreur suppression"),
  });
 
  return (
    <AppLayout>
      <div className="page-wrap">
        <div className="page-header">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Types d'alerte BNGRC (Aléas)</h1>
            <p className="page-subtitle">
              {items.length} aléa{items.length > 1 ? "s" : ""} enregistré{items.length > 1 ? "s" : ""}
            </p>
          </div>
          <CanDo permission="typealertebngrc:create">
            <button className="btn-primary" onClick={() => navigate("/typealertebngrc/create")}>
              <Plus size={15} /> Nouvel aléa
            </button>
          </CanDo>
        </div>
 
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Liste des aléas</span>
            <div className="search-wrap">
              <Search size={14} className="search-icon" />
              <input
                className="search-input"
                placeholder="Rechercher…"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
          </div>
 
          <div style={{ overflowX: "auto" }}>
            {isLoading ? (
              <div className="empty-state"><Loader2 size={24} className="spin" /><p>Chargement…</p></div>
            ) : paginated.length === 0 ? (
              <div className="empty-state"><Wind size={28} /><p>Aucun aléa trouvé</p></div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Alerte parente</th>
                    <th>Description</th>
                    <th>Catégories</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((a: any) => (
                    <tr key={a.id}>
                      <td>
                        <div className="user-cell">
                          <div className="role-avatar"><Wind size={14} /></div>
                          <span className="user-cell-name">{a.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className="perm-tag">{a.alerte?.name ?? `#${a.alerteBngrcId}`}</span>
                      </td>
                      <td>
                        <span style={{ color: "var(--p-text-3)", fontSize: 13 }}>
                          {a.description || "—"}
                        </span>
                      </td>
                      <td>
                        <span className="perm-tag">
                          {a.categories?.length ?? 0} catégorie{(a.categories?.length ?? 0) > 1 ? "s" : ""}
                        </span>
                      </td>
                      <td>
                        <div className="action-btns">
                          <CanDo permission="typealertebngrc:update">
                            <button
                              className="action-btn edit"
                              onClick={() => navigate(`/typealertebngrc/${a.id}/edit`)}
                            >
                              <Pencil size={14} />
                            </button>
                          </CanDo>
                          <CanDo permission="typealertebngrc:delete">
                            <button
                              className="action-btn delete"
                              onClick={() => { setDelError(""); setDelItem({ id: a.id, name: a.name }); }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </CanDo>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
 
          {!isLoading && filtered.length > PER_PAGE && (
            <div className="pagination">
              <span className="pagination-info">
                {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} sur {filtered.length}
              </span>
              <div className="pagination-controls">
                <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
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
                      >{p}</button>
                    )
                  )}
                <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
 
      {delItem && (
        <TypeAlerteBngrcDeleteDialog
          open={!!delItem}
          itemName={delItem.name}
          loading={deleteMut.isPending}
          error={delError}
          onConfirm={() => delItem && deleteMut.mutate(delItem.id)}
          onCancel={() => { setDelItem(null); setDelError(""); deleteMut.reset(); }}
        />
      )}
    </AppLayout>
  );
}