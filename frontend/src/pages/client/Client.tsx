import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { customersApi } from "@/services";
import type { Customer } from "@/types/customer";
import {
  Search, Plus, Pencil, Trash2, X, Loader2,
  ChevronLeft, ChevronRight, Building2, Zap, Minus,
} from "lucide-react";
import "@/styles/page.css";
import "@/styles/utilisateurs.css";

const ITEMS_PER_PAGE = 8;

// ── Badge priorité ────────────────────────────────────────────────────
function PriorityBadge({ priority }: { priority: "urgent" | "normal" }) {
  if (priority === "urgent") {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        background: "#fef2f2", color: "#b91c1c",
        border: "1px solid #fecaca",
        borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600,
      }}>
        <Zap size={10} /> Haute
      </span>
    );
  }
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: "#f8fafc", color: "#64748b",
      border: "1px solid #e2e8f0",
      borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 500,
    }}>
      <Minus size={10} /> Normal
    </span>
  );
}

// ── Sélecteur priorité dans le modal ─────────────────────────────────
function PrioritySelector({ value, onChange }: {
  value: "urgent" | "normal";
  onChange: (v: "urgent" | "normal") => void;
}) {
  const options = [
    {
      value: "normal" as const,
      label: "Normal",
      desc: "Ordre standard de diffusion",
      icon: <Minus size={14} />,
      bg: "#f8fafc", color: "#475569",
      border: "#e2e8f0", selectedBorder: "#475569",
    },
    {
      value: "urgent" as const,
      label: "Haute",
      desc: "Diffusé en priorité sur les sirènes",
      icon: <Zap size={14} />,
      bg: "#fef2f2", color: "#b91c1c",
      border: "#fecaca", selectedBorder: "#ef4444",
    },
  ];

  return (
    <div style={{ display: "flex", gap: 10 }}>
      {options.map(opt => (
        <button key={opt.value} type="button"
          onClick={() => onChange(opt.value)}
          style={{
            flex: 1, display: "flex", alignItems: "center", gap: 10,
            padding: "10px 14px", borderRadius: 10, cursor: "pointer",
            border: `1.5px solid ${value === opt.value ? opt.selectedBorder : opt.border}`,
            background: value === opt.value ? opt.bg : "#fff",
            transition: "all 0.15s", textAlign: "left",
          }}>
          <span style={{ color: opt.color, flexShrink: 0 }}>{opt.icon}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: opt.color }}>{opt.label}</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>{opt.desc}</div>
          </div>
          {value === opt.value && (
            <span style={{
              marginLeft: "auto", width: 8, height: 8,
              borderRadius: "50%", background: opt.selectedBorder, flexShrink: 0,
            }} />
          )}
        </button>
      ))}
    </div>
  );
}

// ── Modal création / édition ──────────────────────────────────────────
function ClientModal({ client, onClose, onSave, loading, error }: {
  client?: Customer | null;
  onClose: () => void;
  onSave: (data: any, id?: number) => Promise<void>;
  loading: boolean;
  error: string;
}) {
  const isEdit = !!client;
  const [form, setForm] = useState({
    name:        client?.name        ?? "",
    company:     client?.company     ?? "",
    description: client?.description ?? "",
    adresse:     client?.adresse     ?? "",
    priority:    (client?.priority   ?? "normal") as "urgent" | "normal",
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? "Modifier le client" : "Nouveau client"}</h2>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <form className="modal-body" onSubmit={async e => {
          e.preventDefault();
          await onSave({
            name:        form.name,
            company:     form.company     || undefined,
            description: form.description || undefined,
            adresse:     form.adresse     || undefined,
            priority:    form.priority,
          }, client?.id);
        }}>
          <div className="form-row">
            <div className="form-field">
              <label>Nom <span className="required">*</span></label>
              <input type="text" placeholder="Nom du client" value={form.name} required
                onChange={e => set("name", e.target.value)} />
            </div>
            <div className="form-field">
              <label>Entreprise</label>
              <input type="text" placeholder="Nom de l'entreprise" value={form.company}
                onChange={e => set("company", e.target.value)} />
            </div>
          </div>
          <div className="form-field">
            <label>Adresse</label>
            <input type="text" placeholder="Adresse complète" value={form.adresse}
              onChange={e => set("adresse", e.target.value)} />
          </div>
          <div className="form-field">
            <label>Description</label>
            <input type="text" placeholder="Notes ou description…" value={form.description}
              onChange={e => set("description", e.target.value)} />
          </div>

          {/* ── Priorité de diffusion ── */}
          <div className="form-field">
            <label>
              Priorité de diffusion
              <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 6, fontWeight: 400 }}>
                — détermine l'ordre de lecture sur les sirènes
              </span>
            </label>
            <PrioritySelector
              value={form.priority}
              onChange={v => setForm(f => ({ ...f, priority: v }))}
            />
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
          <h2 className="modal-title">Supprimer le client</h2>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <p className="confirm-text">
            Supprimer <strong>{name}</strong> ? Les utilisateurs liés perdront leur client.
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

// ── Page ──────────────────────────────────────────────────────────────
export default function Clients() {
  const qc = useQueryClient();
  const [search,    setSearch]    = useState("");
  const [page,      setPage]      = useState(1);
  const [modal,     setModal]     = useState<Customer | null | undefined>(undefined);
  const [delClient, setDelClient] = useState<Customer | null>(null);
  const [mutError,  setMutError]  = useState("");

  const { data: raw, isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: () => customersApi.getAll(),
  });
  const clients: Customer[] = Array.isArray(raw)
    ? raw : (raw as any)?.data ?? (raw as any)?.response ?? [];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return clients.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.company?.toLowerCase().includes(q) ||
      c.adresse?.toLowerCase().includes(q)
    );
  }, [clients, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated  = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const saveMut = useMutation({
    mutationFn: ({ data, id }: { data: any; id?: number }) =>
      id ? customersApi.update(id, data) : customersApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      setModal(undefined); setMutError("");
    },
    onError: (err: any) => setMutError(err.message || "Erreur sauvegarde"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => customersApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      setDelClient(null);
    },
    onError: (err: any) => setMutError(err.message || "Erreur suppression"),
  });

  const avatarLetter = (c: Customer) => c.name[0]?.toUpperCase() ?? "C";

  return (
    <AppLayout>
      <div className="page-wrap">
        <div className="page-header">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Clients</h1>
            <p className="page-subtitle">
              {clients.length} client{clients.length > 1 ? "s" : ""} enregistré{clients.length > 1 ? "s" : ""}
              {clients.filter(c => c.priority === "urgent").length > 0 && (
                <span style={{ marginLeft: 8, color: "#b91c1c", fontSize: "0.8rem" }}>
                  · {clients.filter(c => c.priority === "urgent").length} urgent{clients.filter(c => c.priority === "urgent").length > 1 ? "s" : ""}
                </span>
              )}
            </p>
          </div>
          <button className="btn-primary" onClick={() => setModal(null)}>
            <Plus size={15} /> Nouveau client
          </button>
        </div>

        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Liste des clients</span>
            <div className="search-wrap">
              <Search size={14} className="search-icon" />
              <input className="search-input" placeholder="Nom, entreprise, adresse…"
                value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            {isLoading ? (
              <div className="empty-state"><Loader2 size={24} className="spin" /><p>Chargement…</p></div>
            ) : paginated.length === 0 ? (
              <div className="empty-state"><Building2 size={28} /><p>Aucun client trouvé</p></div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Entreprise</th>
                    <th>Adresse</th>
                    <th>Priorité</th>
                    <th>Créé le</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(c => (
                    <tr key={c.id}>
                      <td>
                        <div className="user-cell">
                          <div className="client-avatar"
                            style={c.priority === "urgent" ? {
                              background: "#fef2f2", color: "#b91c1c", border: "1.5px solid #fecaca",
                            } : undefined}>
                            {avatarLetter(c)}
                          </div>
                          <div>
                            <div className="user-cell-name">{c.name}</div>
                            {c.description && (
                              <div style={{ fontSize: "0.75rem", color: "var(--p-text-3)" }}>{c.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ color: "var(--p-text-2)", fontSize: "0.875rem" }}>
                        {c.company || <span style={{ color: "var(--p-text-3)" }}>—</span>}
                      </td>
                      <td style={{ color: "var(--p-text-2)", fontSize: "0.875rem" }}>
                        {c.adresse || <span style={{ color: "var(--p-text-3)" }}>—</span>}
                      </td>
                      <td>
                        <PriorityBadge priority={c.priority ?? "normal"} />
                      </td>
                      <td className="cell-gps">
                        {new Date(c.createdAt).toLocaleDateString("fr-FR")}
                      </td>
                      <td>
                        <div className="action-btns">
                          <button className="action-btn edit" title="Modifier"
                            onClick={() => { setMutError(""); setModal(c); }}>
                            <Pencil size={14} />
                          </button>
                          <button className="action-btn delete" title="Supprimer"
                            onClick={() => setDelClient(c)}>
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
        <ClientModal
          client={modal}
          onClose={() => { setModal(undefined); setMutError(""); }}
          onSave={async (data, id) => { setMutError(""); await saveMut.mutateAsync({ data, id }); }}
          loading={saveMut.isPending}
          error={mutError}
        />
      )}
      {delClient && (
        <ConfirmModal name={delClient.name} onClose={() => setDelClient(null)}
          onConfirm={() => deleteMut.mutate(delClient.id)} loading={deleteMut.isPending} />
      )}
    </AppLayout>
  );
}