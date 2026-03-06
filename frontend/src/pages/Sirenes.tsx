import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { AppLayout } from "@/components/AppLayout";
import { Search, Radio } from "lucide-react";
import type { Sirene } from "@/types/sirene";
import "../styles/page.css";

const mockSirenes: Sirene[] = [
  { id: 1, imei: "SRN-001-ABC", latitude: "-18.9137", longitude: "47.5226", phone_number_brain: "+261340000001", phone_number_relai: "+261340000002", village_id: 1, is_active: true },
  { id: 2, imei: "SRN-002-DEF", latitude: "-18.1492", longitude: "49.4020", phone_number_brain: "+261340000003", phone_number_relai: "+261340000004", village_id: 2, is_active: true },
  { id: 3, imei: "SRN-003-GHI", latitude: "-19.8563", longitude: "47.0375", phone_number_brain: "+261340000005", phone_number_relai: "+261340000006", village_id: 3, is_active: false },
  { id: 4, imei: "SRN-004-JKL", latitude: "-15.7167", longitude: "46.3167", phone_number_brain: "+261340000007", phone_number_relai: "+261340000008", village_id: 4, is_active: true },
  { id: 5, imei: "SRN-005-MNO", latitude: "-21.4545", longitude: "47.0857", phone_number_brain: "+261340000009", phone_number_relai: "+261340000010", village_id: 5, is_active: true },
];

export default function Sirenes() {
  const [search, setSearch] = useState("");

  const { data: sirenes = mockSirenes } = useQuery({
    queryKey: ["sirenes"],
    queryFn: () => api.getSirenes(),
    placeholderData: mockSirenes,
  });

  const filtered = sirenes.filter((s) =>
    s.imei?.toLowerCase().includes(search.toLowerCase()) ||
    s.phone_number_brain?.includes(search) ||
    s.phone_number_relai?.includes(search)
  );

  const activeCount = sirenes.filter((s) => s.is_active).length;

  return (
    <AppLayout>
      <div className="page-wrap">
        {/* Header */}
        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-title">Sirènes</h1>
            <p className="page-subtitle">
              {activeCount} active{activeCount > 1 ? "s" : ""} sur {sirenes.length} — réseau Madagascar
            </p>
          </div>
        </div>

        {/* Table panel */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Liste des sirènes</span>
            <div className="search-wrap">
              <Search size={14} className="search-icon" />
              <input
                className="search-input"
                placeholder="Rechercher par IMEI, téléphone…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            {filtered.length === 0 ? (
              <div className="empty-state">
                <Radio size={28} />
                <p>Aucune sirène trouvée</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>IMEI</th>
                    <th>Tél. Brain</th>
                    <th>Tél. Relai</th>
                    <th>GPS</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.id}>
                      <td><span className="cell-imei">{s.imei}</span></td>
                      <td><span className="cell-phone">{s.phone_number_brain}</span></td>
                      <td><span className="cell-phone">{s.phone_number_relai}</span></td>
                      <td><span className="cell-gps">{s.latitude}, {s.longitude}</span></td>
                      <td>
                        <span className={`badge ${s.is_active ? "active" : "inactive"}`}>
                          <span className="badge-dot" />
                          {s.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
