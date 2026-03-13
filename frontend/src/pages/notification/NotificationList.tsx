import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { NotificationFilters,NotificationStatus, Notification,} from "@/types/notification";
import {notificationsApi} from "@/services/notification.api";
import { sirenesApi }              from "@/services/sirene.api";
import { sousCategorieAlertesApi } from "@/services/souscategorieAlerte.api";
import { AlerteDeleteDialog }      from "@/components/alerte/Alertedeletedialog";
import {
  Search, Trash2, Loader2, ChevronLeft, ChevronRight,
  Bell, Filter, X, CheckCircle, Clock, XCircle, HelpCircle,
} from "lucide-react";
import "@/styles/page.css";
import "@/styles/utilisateurs.css";
import "@/styles/notification.css";

const STATUS_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  sent:     { label: "Envoyé",    color: "#16a34a", icon: CheckCircle },
  delivery: { label: "Livré",     color: "#0891b2", icon: CheckCircle },
  pending:  { label: "En attente",color: "#d97706", icon: Clock       },
  failed:   { label: "Échoué",    color: "#dc2626", icon: XCircle     },
  unknown:  { label: "Inconnu",   color: "#6b7280", icon: HelpCircle  },
};

function StatusBadge({ status }: { status?: string }) {
  const s = status ? STATUS_LABELS[status] : STATUS_LABELS["unknown"];
  const Icon = s.icon;
  return (
    <span className="notif-status-badge" style={{ color: s.color, borderColor: s.color + "33", background: s.color + "11" }}>
      <Icon size={11} />{s.label}
    </span>
  );
}

function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

const PER_PAGE = 20;

export default function NotificationList() {
  const qc = useQueryClient();

  const [filters, setFilters] = useState<NotificationFilters>({ page: 1, limit: PER_PAGE });
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState("");

  // Valeurs temporaires des filtres
  const [tmpSirene,    setTmpSirene]    = useState("");
  const [tmpStatus,    setTmpStatus]    = useState("");
  const [tmpStart,     setTmpStart]     = useState("");
  const [tmpEnd,       setTmpEnd]       = useState("");
  const [tmpSousCat,   setTmpSousCat]   = useState("");

  const [delItem,  setDelItem]  = useState<{id:number;name:string}|null>(null);
  const [delError, setDelError] = useState("");

  const { data: raw, isLoading } = useQuery({
    queryKey: ["notifications", filters],
    queryFn:  () => notificationsApi.getAll(filters),
  });

  const { data: statsRaw } = useQuery({
    queryKey: ["notifications-stats"],
    queryFn:  () => notificationsApi.getStats(),
  });

  const { data: rawSirenes }   = useQuery({ queryKey: ["sirenes"],                 queryFn: () => sirenesApi.getAll() });
  const { data: rawSousCats }  = useQuery({ queryKey: ["sous-categorie-alertes"],  queryFn: () => sousCategorieAlertesApi.getAll() });

  const result    = (raw as any)?.data         ? raw as any : { data: Array.isArray(raw) ? raw : [], total: 0, page: 1, lastPage: 1 };
  const items: Notification[] = result.data;
  const stats     = statsRaw as any;
  const sirenes   = Array.isArray(rawSirenes)  ? rawSirenes  : (rawSirenes as any)?.response  ?? [];
  const sousCats  = Array.isArray(rawSousCats) ? rawSousCats : (rawSousCats as any)?.response ?? [];

  // Recherche locale sur message / téléphone / IMEI
  const filtered = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter(n =>
      n.message?.toLowerCase().includes(q) ||
      n.phoneNumber?.toLowerCase().includes(q) ||
      n.sirene?.imei?.toLowerCase().includes(q)
    );
  }, [items, search]);

  function applyFilters() {
    setFilters({
      sireneId:              tmpSirene  ? +tmpSirene  : undefined,
      status:                tmpStatus  ? tmpStatus as NotificationStatus : undefined,
      startDate:             tmpStart   || undefined,
      endDate:               tmpEnd     || undefined,
      sousCategorieAlerteId: tmpSousCat ? +tmpSousCat : undefined,
      page: 1, limit: PER_PAGE,
    });
    setShowFilters(false);
  }

  function resetFilters() {
    setTmpSirene(""); setTmpStatus(""); setTmpStart(""); setTmpEnd(""); setTmpSousCat("");
    setFilters({ page: 1, limit: PER_PAGE });
    setShowFilters(false);
  }

  const activeFilterCount = [filters.sireneId, filters.status, filters.startDate, filters.sousCategorieAlerteId].filter(Boolean).length;

  const deleteMut = useMutation({
    mutationFn: (id: number) => notificationsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications-stats"] });
      setDelError(""); setTimeout(() => setDelItem(null), 300);
    },
    onError: (e: any) => setDelError(e?.response?.data?.message || e?.message || "Erreur suppression"),
  });

  return (
    <AppLayout>
      <div className="page-wrap">

        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Notifications</h1>
            <p className="page-subtitle">Historique des alertes envoyées</p>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="notif-stats-row">
            {[
              { key: "total",   label: "Total",      color: "#152a8a" },
              { key: "sent",    label: "Envoyés",    color: "#16a34a" },
              { key: "pending", label: "En attente", color: "#d97706" },
              { key: "failed",  label: "Échoués",    color: "#dc2626" },
            ].map(s => (
              <div key={s.key} className="notif-stat-card" style={{ borderLeftColor: s.color }}>
                <span className="notif-stat-value" style={{ color: s.color }}>{stats[s.key] ?? 0}</span>
                <span className="notif-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        )}

        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Liste des notifications</span>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div className="search-wrap">
                <Search size={14} className="search-icon"/>
                <input className="search-input" placeholder="Message, téléphone, IMEI…"
                  value={search} onChange={e => setSearch(e.target.value)}/>
              </div>
              <button className="btn-filter" onClick={() => setShowFilters(v => !v)}>
                <Filter size={14}/>
                Filtres
                {activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
              </button>
            </div>
          </div>

          {/* Panneau filtres */}
          {showFilters && (
            <div className="notif-filter-panel">
              <div className="notif-filter-grid">
                <div className="sirene-field">
                  <label>Sirène</label>
                  <select value={tmpSirene} onChange={e => setTmpSirene(e.target.value)}>
                    <option value="">— Toutes —</option>
                    {sirenes.map((s: any) => <option key={s.id} value={s.id}>{s.imei}</option>)}
                  </select>
                </div>
                <div className="sirene-field">
                  <label>Statut</label>
                  <select value={tmpStatus} onChange={e => setTmpStatus(e.target.value)}>
                    <option value="">— Tous —</option>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div className="sirene-field">
                  <label>Sous-catégorie</label>
                  <select value={tmpSousCat} onChange={e => setTmpSousCat(e.target.value)}>
                    <option value="">— Toutes —</option>
                    {sousCats.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="sirene-field">
                  <label>Date début</label>
                  <input type="datetime-local" value={tmpStart} onChange={e => setTmpStart(e.target.value)}/>
                </div>
                <div className="sirene-field">
                  <label>Date fin</label>
                  <input type="datetime-local" value={tmpEnd} onChange={e => setTmpEnd(e.target.value)}/>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
                <button className="btn-cancel" onClick={resetFilters}><X size={13}/> Réinitialiser</button>
                <button className="btn-primary" onClick={applyFilters}>Appliquer</button>
              </div>
            </div>
          )}

          <div style={{ overflowX: "auto" }}>
            {isLoading ? (
              <div className="empty-state"><Loader2 size={24} className="spin"/><p>Chargement…</p></div>
            ) : filtered.length === 0 ? (
              <div className="empty-state"><Bell size={28}/><p>Aucune notification trouvée</p></div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Statut</th>
                    <th>Sirène</th>
                    <th>Téléphone</th>
                    <th>Message</th>
                    <th>Sous-catégorie</th>
                    <th>Opérateur</th>
                    <th>Envoyé le</th>
                    <th>Délai post-alerte</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(n => (
                    <tr key={n.id}>
                      <td><StatusBadge status={n.status}/></td>
                      <td>
                        {n.sirene
                          ? <span className="cell-imei">{n.sirene.imei}</span>
                          : <span style={{ color: "var(--p-text-3)" }}>—</span>}
                      </td>
                      <td><span style={{ fontSize: "0.82rem" }}>{n.phoneNumber || "—"}</span></td>
                      <td>
                        <span className="notif-message-cell" title={n.message}>
                          {n.message?.length > 60 ? n.message.slice(0, 60) + "…" : n.message}
                        </span>
                      </td>
                      <td>{n.sousCategorie ? <span className="perm-tag">{n.sousCategorie.name}</span> : <span style={{ color: "var(--p-text-3)" }}>—</span>}</td>
                      <td><span style={{ fontSize: "0.82rem" }}>{n.operator || "—"}</span></td>
                      <td><span style={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}>{fmtDate(n.sendingTime)}</span></td>
                      <td><span style={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}>{fmtDate(n.sendingTimeAfterAlerte)}</span></td>
                      <td>
                        <div className="action-btns">
                          <button className="action-btn delete" title="Supprimer"
                            onClick={() => { setDelError(""); setDelItem({ id: n.id, name: `Notification #${n.id}` }); }}>
                            <Trash2 size={14}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination serveur */}
          {!isLoading && result.lastPage > 1 && (
            <div className="pagination">
              <span className="pagination-info">
                Page {result.page} / {result.lastPage} — {result.total} notifications
              </span>
              <div className="pagination-controls">
                <button className="page-btn" disabled={result.page <= 1}
                  onClick={() => setFilters(f => ({ ...f, page: (f.page ?? 1) - 1 }))}>
                  <ChevronLeft size={15}/>
                </button>
                {Array.from({ length: result.lastPage }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === result.lastPage || Math.abs(p - result.page) <= 1)
                  .reduce<(number|"...")[]>((acc, p, i, arr) => {
                    if (i > 0 && p - (arr[i-1] as number) > 1) acc.push("...");
                    acc.push(p); return acc;
                  }, [])
                  .map((p, i) => p === "..." ? <span key={`d${i}`} className="page-dots">…</span>
                    : <button key={p} className={`page-btn${result.page === p ? " active" : ""}`}
                        onClick={() => setFilters(f => ({ ...f, page: p as number }))}>{p}</button>)}
                <button className="page-btn" disabled={result.page >= result.lastPage}
                  onClick={() => setFilters(f => ({ ...f, page: (f.page ?? 1) + 1 }))}>
                  <ChevronRight size={15}/>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <AlerteDeleteDialog
        open={!!delItem} label="la notification" itemName={delItem?.name ?? ""}
        loading={deleteMut.isPending} error={delError}
        onConfirm={() => delItem && deleteMut.mutate(delItem.id)}
        onCancel={() => { setDelItem(null); setDelError(""); deleteMut.reset(); }}
      />
    </AppLayout>
  );
}