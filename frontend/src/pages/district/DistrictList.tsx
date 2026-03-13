import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { districtsApi } from "@/services/districts.api";
import type { District } from "@/types/district";
import { Search, Plus, Pencil, Trash2, X, Loader2, ChevronLeft, ChevronRight, Map,} from "lucide-react";
import "@/styles/page.css";
import "@/styles/utilisateurs.css";

const ITEMS_PER_PAGE = 10;

function ConfirmModal({ name, onClose, onConfirm, loading }: {
  name: string; onClose: () => void; onConfirm: () => void; loading: boolean;
}) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Supprimer le district</h2>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <p className="confirm-text">
            Voulez-vous vraiment supprimer le district <strong>{name}</strong> ?
            Cette action est irréversible.
          </p>
          <div className="modal-footer">
            <button className="btn-cancel" onClick={onClose}>Annuler</button>
            <button className="btn-danger" onClick={onConfirm} disabled={loading}>
              {loading && <Loader2 size={14} className="spin" />}
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DistrictList() {
  const navigate = useNavigate();
  const qc       = useQueryClient();

  const [search,   setSearch]   = useState("");
  const [page,     setPage]     = useState(1);
  const [delDistrict, setDelDistrict] = useState<District | null>(null);
  const [delError,  setDelError]  = useState("");

  const { data: raw, isLoading } = useQuery({
    queryKey: ["districts"],
    queryFn:  () => districtsApi.getAll(),
  });

  const regions: District[] = Array.isArray(raw)
    ? raw
    : (raw as any)?.data ?? (raw as any)?.response ?? [];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return regions.filter(r =>
      r.name.toLowerCase().includes(q) ||
      (r as any).region?.name?.toLowerCase().includes(q)
    );
  }, [regions, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated  = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const deleteMut = useMutation({
    mutationFn: (id: number) => districtsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["regions"] });
      setDelDistrict(null);
      setDelError("");
    },
    onError: (err: any) => setDelError(err.message || "Erreur suppression"),
  });

  return (
    <AppLayout>
      <div className="page-wrap">

        <div className="page-header">
          <div>
            <h1 className="page-title">Régions</h1>
            <p className="page-subtitle">
              {regions.length} région{regions.length > 1 ? "s" : ""} enregistrée{regions.length > 1 ? "s" : ""}
            </p>
          </div>
          <button className="btn-primary" onClick={() => navigate("/districts/create")}>
            <Plus size={15} /> Nouvelle district
          </button>
        </div>

        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Liste des districts</span>
            <div className="search-wrap">
              <Search size={14} className="search-icon" />
              <input
                className="search-input"
                placeholder="Nom de région ou province…"
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
                <Map size={28} /><p>Aucun district trouvé</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nom</th>
                    <th>Région</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((r, i) => (
                    <tr key={r.id}>
                      <td className="cell-gps">
                        {(page - 1) * ITEMS_PER_PAGE + i + 1}
                      </td>
                      <td>
                        <div className="user-cell">
                          <div className="role-avatar">
                            <Map size={14} />
                          </div>
                          <span className="user-cell-name">{r.name}</span>
                        </div>
                      </td>
                      <td>
                        {(r as any).region?.name ? (
                          <span className="perm-tag">{(r as any).region.name}</span>
                        ) : (
                          <span style={{ color: "var(--p-text-3)" }}>—</span>
                        )}
                      </td>
                      <td>
                        <div className="action-btns">
                          <button
                            className="action-btn edit"
                            title="Modifier"
                            onClick={() => navigate(`/regions/${r.id}/edit`)}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            className="action-btn delete"
                            title="Supprimer"
                            onClick={() => { setDelError(""); setDelDistrict(r); }}
                          >
                            <Trash2 size={14} />
                          </button>
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

          {delError && (
            <p style={{ color: "#dc2626", fontSize: "0.8rem", padding: "0.5rem 1rem" }}>
              {delError}
            </p>
          )}
        </div>
      </div>

      {delDistrict && (
        <ConfirmModal
          name={delDistrict.name}
          onClose={() => setDelDistrict(null)}
          onConfirm={() => deleteMut.mutate(delDistrict.id)}
          loading={deleteMut.isPending}
        />
      )}
    </AppLayout>
  );
}