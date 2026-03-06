import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { rolesApi, permissionsApi } from "@/services";
import type { Role } from "@/types/role";
import type { Permission } from "@/types/permission";
import {
  Search, Plus, Pencil, Trash2, X, Loader2,
  ChevronLeft, ChevronRight, ShieldCheck, Lock,
} from "lucide-react";
import "@/styles/page.css";
import "@/styles/utilisateurs.css";

const ITEMS_PER_PAGE = 8;

// ─── Modal Création / Édition ────────────────
interface RoleModalProps {
  role?: Role | null;
  permissions: Permission[];
  onClose: () => void;
  onSave: (data: { name: string; permission_ids: number[] }, id?: number) => Promise<void>;
  loading: boolean;
  error: string;
}

function RoleModal({ role, permissions, onClose, onSave, loading, error }: RoleModalProps) {
  const isEdit = !!role;
  const [name, setName] = useState(role?.name ?? "");
  const [selected, setSelected] = useState<number[]>(
    role?.permissions?.map(p => p.id) ?? []
  );
  const [search, setSearch] = useState("");

  const togglePerm = (id: number) =>
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const filtered = permissions.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({ name, permission_ids: selected }, role?.id);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {isEdit ? "Modifier le rôle" : "Nouveau rôle"}
          </h2>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* Nom */}
          <div className="form-field">
            <label>Nom du rôle <span className="required">*</span></label>
            <input
              type="text" placeholder="ex: admin, operateur…"
              value={name} required
              onChange={e => setName(e.target.value)}
            />
          </div>

          {/* Permissions */}
          <div className="form-field">
            <label>Permissions ({selected.length} sélectionnée{selected.length > 1 ? "s" : ""})</label>
            <div className="search-wrap" style={{ maxWidth: "100%", marginBottom: 8 }}>
              <Search size={13} className="search-icon" />
              <input
                className="search-input"
                placeholder="Filtrer les permissions…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="perm-grid">
              {filtered.length === 0 ? (
                <p style={{ color: "var(--p-text-3)", fontSize: "0.82rem", padding: "0.5rem" }}>
                  Aucune permission trouvée
                </p>
              ) : filtered.map(p => (
                <label key={p.id} className={`perm-item${selected.includes(p.id) ? " checked" : ""}`}>
                  <input
                    type="checkbox"
                    checked={selected.includes(p.id)}
                    onChange={() => togglePerm(p.id)}
                  />
                  <span className="perm-item-content">
                    <span className="perm-name">{p.name}</span>
                    {p.description && <span className="perm-desc">{p.description}</span>}
                  </span>
                </label>
              ))}
            </div>
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

// ─── Confirm delete ──────────────────────────
function ConfirmModal({ name, onClose, onConfirm, loading }: {
  name: string; onClose: () => void; onConfirm: () => void; loading: boolean;
}) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Supprimer le rôle</h2>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <p className="confirm-text">
            Voulez-vous vraiment supprimer le rôle <strong>{name}</strong> ?
            Les utilisateurs associés perdront ce rôle.
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

// ─── Page principale ─────────────────────────
export default function RoleListe() {
  const qc = useQueryClient();
  const [search, setSearch]       = useState("");
  const [page, setPage]           = useState(1);
  const [modal, setModal]         = useState<Role | null | undefined>(undefined);
  const [deleteRole, setDeleteRole] = useState<Role | null>(null);
  const [mutError, setMutError]   = useState("");

  const { data: rolesRaw, isLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: () => rolesApi.getAll(),
  });
  const roles: Role[] = Array.isArray(rolesRaw)
    ? rolesRaw
    : (rolesRaw as any)?.data ?? (rolesRaw as any)?.response ?? [];

  const { data: permsRaw } = useQuery({
    queryKey: ["permissions"],
    queryFn: () => permissionsApi.getAll(),
  });
  const permissions: Permission[] = Array.isArray(permsRaw)
    ? permsRaw
    : (permsRaw as any)?.data ?? (permsRaw as any)?.response ?? [];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return roles.filter(r => r.name.toLowerCase().includes(q));
  }, [roles, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated  = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const saveMut = useMutation({
    mutationFn: ({ data, id }: { data: any; id?: number }) =>
      id ? rolesApi.update(id, data) : rolesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roles"] });
      setModal(undefined);
      setMutError("");
    },
    onError: (err: any) => setMutError(err.message || "Erreur lors de la sauvegarde"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => rolesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roles"] });
      setDeleteRole(null);
    },
    onError: (err: any) => setMutError(err.message || "Erreur suppression"),
  });

  return (
    <AppLayout>
      <div className="page-wrap">
        <div className="page-header">
          <div>
            <h1 className="page-title">Rôles</h1>
            <p className="page-subtitle">{roles.length} rôle{roles.length > 1 ? "s" : ""} configuré{roles.length > 1 ? "s" : ""}</p>
          </div>
          <button className="btn-primary" onClick={() => setModal(null)}>
            <Plus size={15} /> Nouveau rôle
          </button>
        </div>

        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Liste des rôles</span>
            <div className="search-wrap">
              <Search size={14} className="search-icon" />
              <input className="search-input" placeholder="Rechercher un rôle…"
                value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            {isLoading ? (
              <div className="empty-state"><Loader2 size={24} className="spin" /><p>Chargement…</p></div>
            ) : paginated.length === 0 ? (
              <div className="empty-state"><ShieldCheck size={28} /><p>Aucun rôle trouvé</p></div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nom du rôle</th>
                    <th>Permissions</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(r => (
                    <tr key={r.id}>
                      <td>
                        <div className="user-cell">
                          <div className="role-avatar"><ShieldCheck size={14} /></div>
                          <span className="user-cell-name">{r.name}</span>
                        </div>
                      </td>
                      <td>
                        <div className="perm-tags">
                          {r.permissions?.length > 0 ? (
                            <>
                              {r.permissions.slice(0, 3).map(p => (
                                <span key={p.id} className="perm-tag">{p.name}</span>
                              ))}
                              {r.permissions.length > 3 && (
                                <span className="perm-tag-more">+{r.permissions.length - 3}</span>
                              )}
                            </>
                          ) : (
                            <span style={{ color: "var(--p-text-3)", fontSize: "0.8rem" }}>Aucune permission</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="action-btns">
                          <button className="action-btn edit" title="Modifier"
                            onClick={() => { setMutError(""); setModal(r); }}>
                            <Pencil size={14} />
                          </button>
                          <button className="action-btn delete" title="Supprimer"
                            onClick={() => setDeleteRole(r)}>
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
        <RoleModal
          role={modal}
          permissions={permissions}
          onClose={() => { setModal(undefined); setMutError(""); }}
          onSave={async (data, id) => { setMutError(""); await saveMut.mutateAsync({ data, id }); }}
          loading={saveMut.isPending}
          error={mutError}
        />
      )}

      {deleteRole && (
        <ConfirmModal
          name={deleteRole.name}
          onClose={() => setDeleteRole(null)}
          onConfirm={() => deleteMut.mutate(deleteRole.id)}
          loading={deleteMut.isPending}
        />
      )}
    </AppLayout>
  );
}
