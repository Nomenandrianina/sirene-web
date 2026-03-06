import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { permissionsApi } from "@/services";
import type { Permission } from "@/types/permission";
import {
  Search, Plus, Pencil, Trash2, X, Loader2,
  ChevronLeft, ChevronRight, Lock,
} from "lucide-react";
import "@/styles/page.css";
import "@/styles/utilisateurs.css";

const ITEMS_PER_PAGE = 10;

// ─── Modal ───────────────────────────────────
function PermissionModal({ perm, onClose, onSave, loading, error }: {
  perm?: Permission | null;
  onClose: () => void;
  onSave: (data: { name: string; description?: string }, id?: number) => Promise<void>;
  loading: boolean;
  error: string;
}) {
  const isEdit = !!perm;
  const [name, setName]         = useState(perm?.name ?? "");
  const [description, setDesc]  = useState(perm?.description ?? "");

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? "Modifier la permission" : "Nouvelle permission"}</h2>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <form className="modal-body" onSubmit={async e => {
          e.preventDefault();
          await onSave({ name, description: description || undefined }, perm?.id);
        }}>
          <div className="form-field">
            <label>Nom <span className="required">*</span></label>
            <input type="text" placeholder="ex: user.create" value={name} required
              onChange={e => setName(e.target.value)} />
            <span style={{ fontSize: "0.72rem", color: "var(--p-text-3)", marginTop: 3 }}>
              Convention recommandée : ressource.action (ex: role.delete)
            </span>
          </div>
          <div className="form-field">
            <label>Description</label>
            <input type="text" placeholder="Décrire cette permission…"
              value={description} onChange={e => setDesc(e.target.value)} />
          </div>
          {error && <div className="form-error">{error}</div>}
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading && <Loader2 size={14} className="spin" />}
              {isEdit ? "Enregistrer" : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmModal({ name, onClose, onConfirm, loading }: {
  name: string; onClose: () => void; onConfirm: () => void; loading: boolean;
}) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Supprimer la permission</h2>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <p className="confirm-text">
            Supprimer <strong>{name}</strong> ? Les rôles qui l'utilisent la perdront.
          </p>
          <div className="modal-footer">
            <button className="btn-cancel" onClick={onClose}>Annuler</button>
            <button className="btn-danger" onClick={onConfirm} disabled={loading}>
              {loading && <Loader2 size={14} className="spin" />}Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────
export default function Permissions() {
  const qc = useQueryClient();
  const [search, setSearch]     = useState("");
  const [page, setPage]         = useState(1);
  const [modal, setModal]       = useState<Permission | null | undefined>(undefined);
  const [delPerm, setDelPerm]   = useState<Permission | null>(null);
  const [mutError, setMutError] = useState("");

  const { data: raw, isLoading } = useQuery({
    queryKey: ["permissions"],
    queryFn: () => permissionsApi.getAll(),
  });
  const perms: Permission[] = Array.isArray(raw)
    ? raw : (raw as any)?.data ?? (raw as any)?.response ?? [];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return perms.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    );
  }, [perms, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated  = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const saveMut = useMutation({
    mutationFn: ({ data, id }: { data: any; id?: number }) =>
      id ? permissionsApi.update(id, data) : permissionsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["permissions"] });
      setModal(undefined); setMutError("");
    },
    onError: (err: any) => setMutError(err.message || "Erreur sauvegarde"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => permissionsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["permissions"] });
      setDelPerm(null);
    },
    onError: (err: any) => setMutError(err.message || "Erreur suppression"),
  });

  return (
    <AppLayout>
      <div className="page-wrap">
        <div className="page-header">
          <div>
            <h1 className="page-title">Permissions</h1>
            <p className="page-subtitle">{perms.length} permission{perms.length > 1 ? "s" : ""} définies</p>
          </div>
          <button className="btn-primary" onClick={() => setModal(null)}>
            <Plus size={15} /> Nouvelle permission
          </button>
        </div>

        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Liste des permissions</span>
            <div className="search-wrap">
              <Search size={14} className="search-icon" />
              <input className="search-input" placeholder="Rechercher…"
                value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            {isLoading ? (
              <div className="empty-state"><Loader2 size={24} className="spin" /><p>Chargement…</p></div>
            ) : paginated.length === 0 ? (
              <div className="empty-state"><Lock size={28} /><p>Aucune permission trouvée</p></div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Description</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(p => (
                    <tr key={p.id}>
                      <td><span className="cell-imei">{p.name}</span></td>
                      <td style={{ color: "var(--p-text-2)", fontSize: "0.875rem" }}>
                        {p.description || <span style={{ color: "var(--p-text-3)" }}>—</span>}
                      </td>
                      <td>
                        <div className="action-btns">
                          <button className="action-btn edit" title="Modifier"
                            onClick={() => { setMutError(""); setModal(p); }}>
                            <Pencil size={14} />
                          </button>
                          <button className="action-btn delete" title="Supprimer"
                            onClick={() => setDelPerm(p)}>
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
                <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
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
                    <button key={p} className={`page-btn${page === p ? " active" : ""}`}
                      onClick={() => setPage(p as number)}>{p}</button>
                  ))}
                <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {modal !== undefined && (
        <PermissionModal
          perm={modal}
          onClose={() => { setModal(undefined); setMutError(""); }}
          onSave={async (data, id) => { setMutError(""); await saveMut.mutateAsync({ data, id }); }}
          loading={saveMut.isPending}
          error={mutError}
        />
      )}
      {delPerm && (
        <ConfirmModal name={delPerm.name} onClose={() => setDelPerm(null)}
          onConfirm={() => deleteMut.mutate(delPerm.id)} loading={deleteMut.isPending} />
      )}
    </AppLayout>
  );
}