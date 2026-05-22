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
import "@/styles/sirene.css";
import { CanDo } from "@/components/Cando";
import { useRole } from "@/hooks/useRole";

const PER_PAGE = 10;

export default function SireneList() {
  const navigate    = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page,   setPage]   = useState(1);
  const { isSuperAdmin } = useRole();

  const { data: sirenes = [], isLoading } = useQuery({
    queryKey: ["sirenes"],
    queryFn:  () => sirenesApi.getAll(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => sirenesApi.remove(id),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ["sirenes"] }),
  });

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

  return (
    <AppLayout>
      <div className="sirene-page">
        {/* ── Header ── */}
        <div className="sirene-header">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Sirènes</h1>
            <p className="sirene-subtitle">
              {sirenes.length} sirène{sirenes.length > 1 ? "s" : ""} enregistrée{sirenes.length > 1 ? "s" : ""}
            </p>
          </div>
          <CanDo permission="sirenes:create">
            <button className="btn-primary" onClick={() => navigate("/sirenes/create")}>
              <Plus size={16} /> Nouvelle sirène
            </button>
          </CanDo>
        </div>

        {/* ── Barre de recherche ── */}
        <div className="sirene-toolbar">
          <div className="search-box">
            <Search size={15} />
            <input
              placeholder="Rechercher par référence, IMEI, district, village, client…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {/* ── Table ── */}
        {isLoading ? (
          <div className="sirene-loading">
            <Loader2 size={22} className="spin" /> Chargement…
          </div>
        ) : (
          <div className="sirene-table-wrap">
            <table className="sirene-table">
              <thead>
                <tr>
                  <th>Réference</th>
                  {isSuperAdmin && <th>IMEI</th>}
                  <th>District</th>
                  <th>Village</th>
                  {isSuperAdmin && <th>Clients</th>}
                  <th>Statut</th>
                  <th>Coordonnées</th>
                  {isSuperAdmin && <th>Type communication</th>}
                  {isSuperAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="empty-row">Aucune sirène trouvée</td>
                  </tr>
                ) : paginated.map(s => (
                  <tr key={s.id}>
                    <td>
                      <span className="imei-code">{s.name ?? "—"}</span>
                    </td>

                    {isSuperAdmin && (
                      <td>
                        <span className="imei-code">{s.imei ?? "—"}</span>
                      </td>
                    )}

                    <td>{s.village?.district?.name ?? "—"}</td>
                    <td>{s.village?.name ?? "—"}</td>

                    {isSuperAdmin && (
                      <td>
                        <div className="customers-cell">
                          {s.customers?.length
                            ? s.customers.map(c => (
                                <span key={c.id} className="customer-chip">{c.name}</span>
                              ))
                            : <span className="text-muted">—</span>
                          }
                        </div>
                      </td>
                    )}

                    <td>
                      <span className={`status-badge ${s.isActive ? "active" : "inactive"}`}>
                        {s.isActive
                          ? <><Wifi size={12} /> Active</>
                          : <><WifiOff size={12} /> Inactive</>}
                      </span>
                    </td>

                    {/* ── Coordonnées : bouton cliquable → carte ── */}
                    <td>
                      {s.latitude && s.longitude ? (
                        <button
                          className="coords-btn"
                          title="Voir sur la carte"
                          onClick={() => goToMap(s)}
                        >
                          <Navigation size={11} />
                          <span>
                            {parseFloat(s.latitude).toFixed(4)},&nbsp;
                            {parseFloat(s.longitude).toFixed(4)}
                          </span>
                        </button>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>

                    {isSuperAdmin && (
                      <td>
                        <span className="phone-badge relai">{s.communicationType ?? "—"}</span>
                      </td>
                    )}

                    {isSuperAdmin && (
                      <td>
                        <div className="action-btns">
                          <CanDo permission="sirenes:update">
                            <button
                              className="btn-icon-action edit"
                              title="Modifier"
                              onClick={() => navigate(`/sirenes/${s.id}/edit`)}
                            >
                              <Edit2 size={14} />
                            </button>
                          </CanDo>
                          <CanDo permission="sirenes:delete">
                            <button
                              className="btn-icon-action delete"
                              title="Supprimer"
                              onClick={() => {
                                if (confirm(`Supprimer la sirène ${s.imei ?? s.id} ?`))
                                  deleteMutation.mutate(s.id);
                              }}
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
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="pagination">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft size={16} />
            </button>
            <span>{page} / {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight size={16} />
            </button>
          </div>
        )}

      </div>

      {/* ── Style bouton coordonnées ── */}
      <style>{`
        .coords-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 9px;
          border-radius: 6px;
          border: 1px solid #bfdbfe;
          background: #eff6ff;
          color: #1d4ed8;
          font-size: 11px;
          font-family: monospace;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s, transform 0.1s;
          white-space: nowrap;
        }
        .coords-btn:hover {
          background: #dbeafe;
          border-color: #93c5fd;
          transform: translateY(-1px);
        }
        .coords-btn:active {
          transform: translateY(0);
        }
      `}</style>
    </AppLayout>
  );
}