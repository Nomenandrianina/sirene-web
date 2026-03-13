import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { usersApi, rolesApi } from "@/services";
import type { User } from "@/types/user";
import type { Role } from "@/types/role";
import type { CreateUserDto, UpdateUserDto } from "@/services";
import {
  Search, Plus, Pencil, Trash2, X, Loader2,
  ChevronLeft, ChevronRight, UserCircle2, ShieldCheck, Building2,
} from "lucide-react";
import { UserAvatar } from "@/components/utilisateur/Useravatar";
import "@/styles/page.css";
import "@/styles/utilisateurs.css";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";

// ─── Helpers ────────────────────────────────
const fullName = (u: User) =>
  [u.first_name, u.last_name].filter(Boolean).join(" ") || "—";

const ITEMS_PER_PAGE = 8;

// ─── Modal ──────────────────────────────────
interface ModalProps {
  user?: User | null;
  roles: Role[];
  onClose: () => void;
  onSave: (data: CreateUserDto | UpdateUserDto, id?: number) => Promise<void>;
  loading: boolean;
  error: string;
}

function UserModal({ user, roles, onClose, onSave, loading, error }: ModalProps) {
  const isEdit = !!user;
  const [form, setForm] = useState({
    first_name: user?.first_name ?? "",
    last_name:  user?.last_name  ?? "",
    email:      user?.email      ?? "",
    password:   "",
    role_id:    user?.role_id    ?? (roles[0]?.id ?? 0),
    is_active:  user?.is_active  ?? true,
  });

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      first_name: form.first_name || undefined,
      last_name:  form.last_name  || undefined,
      email:      form.email,
      role_id:    Number(form.role_id),
      is_active:  form.is_active,
    };
    if (!isEdit) payload.password = form.password;
    await onSave(payload, user?.id);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {isEdit ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
          </h2>
          <Button className="modal-close" onClick={onClose}><X size={18} /></Button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-row">
            <div className="form-field">
              <label>Prénom</label>
              <input
                type="text" placeholder="Jean"
                value={form.first_name}
                onChange={e => set("first_name", e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>Nom</label>
              <input
                type="text" placeholder="Dupont"
                value={form.last_name}
                onChange={e => set("last_name", e.target.value)}
              />
            </div>
          </div>

          <div className="form-field">
            <label>Email <span className="required">*</span></label>
            <input
              type="email" placeholder="jean@example.com"
              value={form.email} required
              onChange={e => set("email", e.target.value)}
            />
          </div>

          {!isEdit && (
            <div className="form-field">
              <label>Mot de passe <span className="required">*</span></label>
              <input
                type="password" placeholder="••••••••"
                value={form.password} required={!isEdit}
                onChange={e => set("password", e.target.value)}
              />
            </div>
          )}

          <div className="form-row">
            <div className="form-field">
              <label>Rôle <span className="required">*</span></label>
              <select
                value={form.role_id} required
                onChange={e => set("role_id", Number(e.target.value))}
              >
                <option value="">— Choisir —</option>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            {isEdit && (
              <div className="form-field">
                <label>Statut</label>
                <select
                  value={form.is_active ? "1" : "0"}
                  onChange={e => set("is_active", e.target.value === "1")}
                >
                  <option value="1">Actif</option>
                  <option value="0">Inactif</option>
                </select>
              </div>
            )}
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Annuler
            </button>
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

// ─── Confirm delete ─────────────────────────
function ConfirmModal({
  user, onClose, onConfirm, loading,
}: { user: User; onClose: () => void; onConfirm: () => void; loading: boolean }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Supprimer l'utilisateur</h2>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <p className="confirm-text">
            Voulez-vous vraiment supprimer <strong>{fullName(user)}</strong> ({user.email}) ?
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

// ─── Page principale ─────────────────────────
export default function Utilisateurs() {
  const qc = useQueryClient();
  const [search, setSearch]         = useState("");
  const [page, setPage]             = useState(1);
  const [modalUser, setModalUser]   = useState<User | null | undefined>(undefined);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [mutError, setMutError]     = useState("");
  const navigate = useNavigate();

  const { data: usersRaw, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersApi.getAll(),
  });

  const users: User[] = Array.isArray(usersRaw)
    ? usersRaw
    : (usersRaw as any)?.data ?? (usersRaw as any)?.response ?? [];

  const { data: roles = [] } = useQuery({
    queryKey: ["roles"],
    queryFn: () => rolesApi.getAll(),
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(u =>
      fullName(u).toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role?.name?.toLowerCase().includes(q)
    );
  }, [users, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated  = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleSearch = (v: string) => { setSearch(v); setPage(1); };

  const saveMut = useMutation({
    mutationFn: ({ data, id }: { data: any; id?: number }) =>
      id ? usersApi.update(id, data) : usersApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setModalUser(undefined);
      setMutError("");
    },
    onError: (err: any) => setMutError(err.message || "Erreur lors de la sauvegarde"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => usersApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setDeleteUser(null);
    },
    onError: (err: any) => setMutError(err.message || "Erreur lors de la suppression"),
  });

  const handleSave = async (data: any, id?: number) => {
    setMutError("");
    await saveMut.mutateAsync({ data, id });
  };

  return (
    <AppLayout>
      <div className="page-wrap">

        <div className="page-header">
          <div>
            <h1 className="page-title">Utilisateurs</h1>
            <p className="page-subtitle">
              {users.filter(u => u.is_active).length} actifs sur {users.length}
            </p>
          </div>
          <Link to="/utilisateurs/create">
            <button className="btn-primary">
              <Plus size={15} />
              Nouvel utilisateur
            </button>
          </Link>
        </div>

        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Liste des utilisateurs</span>
            <div className="search-wrap">
              <Search size={14} className="search-icon" />
              <input
                className="search-input"
                placeholder="Nom, email, rôle…"
                value={search}
                onChange={e => handleSearch(e.target.value)}
              />
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            {isLoading ? (
              <div className="empty-state">
                <Loader2 size={24} className="spin" />
                <p>Chargement…</p>
              </div>
            ) : paginated.length === 0 ? (
              <div className="empty-state">
                <UserCircle2 size={28} />
                <p>Aucun utilisateur trouvé</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Utilisateur</th>
                    <th>Email</th>
                    <th>Rôle</th>
                    <th>Client</th>
                    <th>Statut</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(u => (
                    <tr key={u.id}>

                      {/* ── Avatar photo ou initiales ── */}
                      <td>
                        <div className="user-cell">
                          <UserAvatar
                            avatarUrl={(u as any).avatar_url}
                            firstName={u.first_name}
                            lastName={u.last_name}
                            email={u.email}
                            size="sm"
                          />
                          <span className="user-cell-name">{fullName(u)}</span>
                        </div>
                      </td>

                      <td className="cell-phone">{u.email}</td>

                      {/* Rôle */}
                      <td>
                        {u.role ? (
                          <span className="role-chip">
                            <ShieldCheck size={11} />
                            {u.role.name}
                          </span>
                        ) : "—"}
                      </td>

                      {/* Client */}
                      <td>
                        {u.customer ? (
                          <span className="role-chip">
                            <Building2 size={11} />
                            {u.customer.name}
                          </span>
                        ) : "—"}
                      </td>

                      {/* Statut */}
                      <td>
                        <span className={`badge ${u.is_active ? "active" : "inactive"}`}>
                          <span className="badge-dot" />
                          {u.is_active ? "Actif" : "Inactif"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="action-btns">
                          <button
                            className="action-btn edit"
                            title="Modifier"
                            onClick={() => navigate(`/utilisateurs/${u.id}/edit`)}
                          >
                            <Pencil size={14} />
                          </button>
                          {u.role?.name !== "superadmin" && (
                            <button
                              className="action-btn delete"
                              title="Supprimer"
                              onClick={() => setDeleteUser(u)}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
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
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === "..." ? (
                      <span key={`dots-${i}`} className="page-dots">…</span>
                    ) : (
                      <button key={p}
                        className={`page-btn${page === p ? " active" : ""}`}
                        onClick={() => setPage(p as number)}>
                        {p}
                      </button>
                    )
                  )}
                <button className="page-btn" disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}>
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {deleteUser && (
        <ConfirmModal
          user={deleteUser}
          onClose={() => setDeleteUser(null)}
          onConfirm={() => deleteMut.mutate(deleteUser.id)}
          loading={deleteMut.isPending}
        />
      )}
    </AppLayout>
  );
}