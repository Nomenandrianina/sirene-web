import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sirenesApi } from "@/services/sirene.api";
import {  Sirene } from "@/types/sirene";
import { AppLayout } from "@/components/AppLayout";
import {
  Search, Plus, Edit2, Trash2, Bell, MapPin,
  Wifi, WifiOff, ChevronLeft, ChevronRight, X, Send, Loader2,
} from "lucide-react";
import "@/styles/sirene.css";
import { CanDo } from "@/components/Cando";

const PER_PAGE = 10;

export default function SireneList() {
  const navigate     = useNavigate();
  const queryClient  = useQueryClient();
  const [search,     setSearch]     = useState("");
  const [page,       setPage]       = useState(1);
  const [alertSirene, setAlertSirene] = useState<Sirene | null>(null);
  const [alertMsg,   setAlertMsg]   = useState("");
  const [sending,    setSending]    = useState(false);
  const [activeTab,  setActiveTab]  = useState<"list" | "map">("list");
  const alertRef  = useRef<HTMLDivElement>(null);
  const mapRef    = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<any>(null);

  const { data: sirenes = [], isLoading } = useQuery({
    queryKey: ["sirenes"],
    queryFn:  () => sirenesApi.getAll(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => sirenesApi.remove(id),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ["sirenes"] }),
  });

  // Filtrage + pagination
  const filtered = sirenes.filter(s =>
    [s.imei, s.village?.name, s.phoneNumberBrain, s.phoneNumberRelai]
      .some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Init carte Leaflet (même pattern VillageForm)
  useEffect(() => {
    if (activeTab !== "map") return;
    if (leafletRef.current) return; // déjà initialisée

    const link = document.createElement("link");
    link.rel  = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    // Petit délai pour que le div soit monté
    setTimeout(() => {
      if (!mapRef.current || leafletRef.current) return;
      import("leaflet").then(L => {
        if (!mapRef.current || leafletRef.current) return;
        const map = L.map(mapRef.current).setView([-18.9, 47.5], 6);
        leafletRef.current = map;

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '© OpenStreetMap',
          maxZoom: 19,
        }).addTo(map);

        // Icône personnalisée
        const icon = L.divIcon({
          className: "",
          html: `<div class="map-marker-pin"></div>`,
          iconSize: [28, 28], iconAnchor: [14, 28],
        });

        // Ajouter les markers des sirènes
        sirenes
          .filter(s => s.latitude && s.longitude)
          .forEach(s => {
            const marker = L.marker(
              [parseFloat(s.latitude!), parseFloat(s.longitude!)],
              { icon }
            ).addTo(map);

            marker.bindPopup(`
              <div style="min-width:160px;font-size:0.82rem">
                <strong>${s.village?.name ?? "Sirène"}</strong><br/>
                IMEI : ${s.imei ?? "—"}<br/>
                Brain : ${s.phoneNumberBrain ?? "—"}<br/>
                Relai : ${s.phoneNumberRelai ?? "—"}<br/>
                <span style="color:${s.isActive ? "#16a34a" : "#dc2626"};font-weight:600">
                  ${s.isActive ? "● Active" : "● Inactive"}
                </span>
              </div>
            `);
          });
      });
    }, 100);

    return () => {
      if (leafletRef.current) {
        leafletRef.current.remove();
        leafletRef.current = null;
      }
    };
  }, [activeTab, sirenes]);

  // Fermer modal alerte en dehors
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (alertRef.current && !alertRef.current.contains(e.target as Node)) {
        setAlertSirene(null);
        setAlertMsg("");
      }
    }
    if (alertSirene) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [alertSirene]);

  async function handleSendAlert() {
    if (!alertSirene || !alertMsg.trim()) return;
    setSending(true);
    try {
      await sirenesApi.sendAlert(alertSirene.id, alertMsg);
      setAlertSirene(null);
      setAlertMsg("");
    } finally {
      setSending(false);
    }
  }


  return (
    
    <AppLayout>
    <div className="sirene-page">

      {/* ── Header ── */}
      <div className="sirene-header">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Sirènes</h1>
          <p className="sirene-subtitle">{sirenes.length} sirène{sirenes.length > 1 ? "s" : ""} enregistrée{sirenes.length > 1 ? "s" : ""}</p>
        </div>
        <CanDo permission="sirenes:create">
          <button className="btn-primary" onClick={() => navigate("/sirenes/create")}>
            <Plus size={16} /> Nouvelle sirène
          </button>
        </CanDo>
      </div>

      {/* ── Onglets liste / carte ── */}
      <div className="sirene-tabs">
        <button
          className={`sirene-tab ${activeTab === "list" ? "active" : ""}`}
          onClick={() => setActiveTab("list")}
        >Liste</button>
        <button
          className={`sirene-tab ${activeTab === "map" ? "active" : ""}`}
          onClick={() => setActiveTab("map")}
        ><MapPin size={14} /> Carte</button>
      </div>

      {/* ── Vue Liste ── */}
      {activeTab === "list" && (
        <>
          <div className="sirene-toolbar">
            <div className="search-box">
              <Search size={15} />
              <input
                placeholder="Rechercher par IMEI, village, numéro…"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="sirene-loading"><Loader2 size={22} className="spin" /> Chargement…</div>
          ) : (
            <div className="sirene-table-wrap">
              <table className="sirene-table">
                <thead>
                  <tr>
                    <th>Désignation</th>
                    <th>IMEI</th>
                    <th>Village</th>
                    <th>N° Brain</th>
                    <th>N° Relai</th>
                    <th>Clients</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr><td colSpan={7} className="empty-row">Aucune sirène trouvée</td></tr>
                  ) : paginated.map(s => (
                    <tr key={s.id}>
                      <td>
                        <span className="imei-code">{s.name ?? "—"}</span>
                      </td>
                      <td>
                        <span className="imei-code">{s.imei ?? "—"}</span>
                      </td>
                      <td>
                        <div className="village-cell">
                          <MapPin size={13} className="pin-icon" />
                          {s.village?.name ?? "—"}
                        </div>
                      </td>
                      <td><span className="phone-badge brain">{s.phoneNumberBrain ?? "—"}</span></td>
                      <td><span className="phone-badge relai">{s.phoneNumberRelai ?? "—"}</span></td>
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
                      <td>
                        <span className={`status-badge ${s.isActive ? "active" : "inactive"}`}>
                          {s.isActive ? <><Wifi size={12} /> Active</> : <><WifiOff size={12} /> Inactive</>}
                        </span>
                      </td>
                      <td>
                        <div className="action-btns">
                          <button
                            className="btn-icon-action alert"
                            title="Envoyer alerte"
                            onClick={() => setAlertSirene(s)}
                          ><Bell size={14} /></button>
                          <CanDo permission="sirenes:update">
                            <button
                              className="btn-icon-action edit"
                              title="Modifier"
                              onClick={() => navigate(`/sirenes/${s.id}/edit`)}
                            ><Edit2 size={14} /></button>
                          </CanDo>
                          <CanDo permission="sirenes:delete">
                            <button
                              className="btn-icon-action delete"
                              title="Supprimer"
                              onClick={() => {
                                if (confirm(`Supprimer la sirène ${s.imei ?? s.id} ?`))
                                  deleteMutation.mutate(s.id);
                              }}
                            ><Trash2 size={14} /></button>
                          </CanDo>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
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
        </>
      )}

      {/* ── Vue Carte ── */}
      {activeTab === "map" && (
        <div className="sirene-map-wrap">
          <div ref={mapRef} style={{ height: "600px", width: "100%", borderRadius: "12px" }} />
        </div>
      )}

      {/* ── Modal alerte ── */}
      {alertSirene && (
        <div className="modal-overlay">
          <div className="modal-card" ref={alertRef}>
            <div className="modal-header">
              <div>
                <h3>Déclencher une alerte</h3>
                <p className="modal-subtitle">
                  Sirène {alertSirene.imei ?? `#${alertSirene.id}`} — {alertSirene.village?.name}
                </p>
              </div>
              <button className="btn-close" onClick={() => { setAlertSirene(null); setAlertMsg(""); }}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <div className="alert-targets">
                <div className="target-item">
                  <span className="target-label">Brain</span>
                  <span className="target-phone">{alertSirene.phoneNumberBrain ?? "Non défini"}</span>
                </div>
                <div className="target-item">
                  <span className="target-label">Relai</span>
                  <span className="target-phone">{alertSirene.phoneNumberRelai ?? "Non défini"}</span>
                </div>
              </div>
              <label className="form-label">Message</label>
              <textarea
                className="alert-textarea"
                placeholder="Saisir le message d'alerte…"
                rows={4}
                value={alertMsg}
                onChange={e => setAlertMsg(e.target.value)}
              />
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => { setAlertSirene(null); setAlertMsg(""); }}>
                Annuler
              </button>
              <button
                className="btn-alert-send"
                disabled={!alertMsg.trim() || sending}
                onClick={handleSendAlert}
              >
                {sending ? <Loader2 size={14} className="spin" /> : <Send size={14} />}
                Envoyer l'alerte
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
    </AppLayout>
  );
}