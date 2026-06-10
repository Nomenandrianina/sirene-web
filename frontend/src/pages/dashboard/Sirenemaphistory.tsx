// src/pages/SireneMapHistory.tsx
// Carte historique des alertes BNGRC — filtre par date + heure

import { useRef, useEffect, useState, useMemo } from "react";
import { useQuery }                              from "@tanstack/react-query";
import { sirenesApi }                            from "@/services/sirene.api";
import { notificationsBngrcApi }                 from "@/services/notificationBngrc.api";
import { AppLayout }                             from "@/components/AppLayout";
import {
  History, MapPin, ChevronLeft, ChevronRight,
  Layers, Map as MapIcon, Calendar, Clock, Radio, User,
} from "lucide-react";

// ─── helpers ──────────────────────────────────────────────────────────────────
const toArr = (r: any) =>
  Array.isArray(r) ? r : r?.response ?? r?.data ?? [];

function padZ(n: number) { return String(n).padStart(2, "0"); }

function fmtTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("fr-FR", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${padZ(d.getMonth() + 1)}-${padZ(d.getDate())}`;
}

// ─── CSS carte + icônes ───────────────────────────────────────────────────────
const MAP_CSS = `
  .sirene-hist-icon { position:relative; width:44px; height:54px; display:flex; flex-direction:column; align-items:center; cursor:pointer; }
  .sirene-hist-marker {
    position:relative; z-index:2; width:38px; height:38px; border-radius:50%;
    display:flex; align-items:center; justify-content:center;
    box-shadow:0 4px 14px rgba(0,0,0,0.22), 0 0 0 3px white;
    transition:transform 0.15s ease;
  }
  .sirene-hist-icon:hover .sirene-hist-marker { transform:scale(1.12); }
  .sirene-hist-tail { width:3px; height:12px; border-radius:0 0 3px 3px; margin-top:-2px; z-index:1; }
  .sirene-hist-badge {
    position:absolute; top:-4px; right:-4px; z-index:3;
    background:#3b82f6; color:white; border-radius:10px;
    padding:1px 5px; font-size:9px; font-weight:700;
    border:1.5px solid white;
  }
  .leaflet-popup-content-wrapper {
    border-radius:14px !important; padding:0 !important; overflow:hidden;
    box-shadow:0 8px 32px rgba(0,0,0,0.14) !important;
    border:0.5px solid #e2e8f0 !important;
  }
  .leaflet-popup-content { margin:0 !important; min-width:270px; max-width:320px; }
  .leaflet-popup-tip-container { display:none; }
`;

// ─── SVG icône sirène ─────────────────────────────────────────────────────────
// fill  = couleur selon statut
// count = nb d'alertes dans ce créneau (badge)
function sireneSVG(fill: string, count: number) {
  return `
    <div class="sirene-hist-icon">
      <div class="sirene-hist-marker" style="background:${fill}">
        ${count > 0 ? `<div class="sirene-hist-badge">${count}</div>` : ""}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <rect x="9" y="13" width="6" height="5" rx="1" fill="white" opacity="0.95"/>
          <rect x="10" y="14" width="1.2" height="3" rx="0.4" fill="${fill}"/>
          <rect x="12.4" y="14" width="1.2" height="3" rx="0.4" fill="${fill}"/>
          <path d="M7.5 10.5 C6.5 11.8 6.5 13.2 7.5 14.5" stroke="white" stroke-width="1.4" stroke-linecap="round" fill="none" opacity="0.8"/>
          <path d="M5.5 8.5 C3.8 10.5 3.8 14.5 5.5 16.5" stroke="white" stroke-width="1.4" stroke-linecap="round" fill="none" opacity="0.5"/>
          <path d="M16.5 10.5 C17.5 11.8 17.5 13.2 16.5 14.5" stroke="white" stroke-width="1.4" stroke-linecap="round" fill="none" opacity="0.8"/>
          <path d="M18.5 8.5 C20.2 10.5 20.2 14.5 18.5 16.5" stroke="white" stroke-width="1.4" stroke-linecap="round" fill="none" opacity="0.5"/>
          <ellipse cx="12" cy="11" rx="3.5" ry="2.5" fill="white" opacity="0.95"/>
          <ellipse cx="12" cy="11" rx="2" ry="1.4" fill="${fill}"/>
          <circle cx="12" cy="11" r="0.8" fill="white" opacity="0.9"/>
          <rect x="10.5" y="18" width="3" height="1.2" rx="0.5" fill="white" opacity="0.8"/>
        </svg>
      </div>
      <div class="sirene-hist-tail" style="background:${fill}"></div>
    </div>`;
}

// ─── Popup HTML : liste des alertes d'une sirène ──────────────────────────────
function buildHistoryPopup(sirene: any, notifs: any[]) {
  const headerFill = notifs.length > 0 ? "#3b82f6" : "#94a3b8";

  const rows = notifs.map((n, i) => {
    const userName = n.user
      ? (`${n.user.firstName ?? ""} ${n.user.lastName ?? ""}`.trim() || n.user.email || "—")
      : "—";
    return `
      <div style="padding:8px 14px;${i > 0 ? "border-top:0.5px solid #f1f5f9;" : ""}">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <span style="font-size:10px;font-weight:700;color:#3b82f6;background:#eff6ff;
                       padding:1px 7px;border-radius:8px;">
            #${i + 1} — ${fmtTime(n.sendingTime)}
          </span>
          ${n.categorieAlerteBngrc?.name
            ? `<span style="font-size:10px;color:#92400e;background:#fff7ed;
                            padding:1px 7px;border-radius:8px;font-weight:600;">
                 ${n.categorieAlerteBngrc.name}
               </span>`
            : ""}
        </div>
        <div style="display:flex;flex-direction:column;gap:3px;">
          ${n.audioBngrc?.name
            ? `<div style="font-size:11px;color:#475569;">🎵 ${n.audioBngrc.name}
                 ${n.audioBngrc.duration
                   ? `<span style="color:#94a3b8;margin-left:4px;">${Math.round(n.audioBngrc.duration)}s</span>`
                   : ""}
               </div>`
            : ""}
          <div style="font-size:10px;color:#64748b;">
            👤 <strong>${userName}</strong>
          </div>
        </div>
      </div>`;
  }).join("");

  return `
    <div style="font-family:system-ui,sans-serif;font-size:13px;max-height:340px;overflow-y:auto;">
      <div style="background:${headerFill};padding:10px 14px;position:sticky;top:0;z-index:1;">
        <div style="color:white;font-weight:700;font-size:13px;margin-bottom:1px;">
          ${sirene.name ?? sirene.imei ?? `Sirène #${sirene.id}`}
        </div>
        <div style="color:rgba(255,255,255,0.85);font-size:10px;display:flex;align-items:center;gap:4px;">
          📍 ${sirene.village?.name ?? "Village inconnu"}
          ${notifs.length > 0
            ? `&nbsp;·&nbsp;<strong>${notifs.length}</strong> alerte${notifs.length > 1 ? "s" : ""}`
            : "&nbsp;·&nbsp;Aucune alerte dans ce créneau"}
        </div>
      </div>
      ${notifs.length === 0
        ? `<div style="padding:16px 14px;color:#94a3b8;font-size:12px;text-align:center;">
             Aucune alerte envoyée dans ce créneau horaire.
           </div>`
        : rows}
    </div>`;
}

// ─── Composants UI ────────────────────────────────────────────────────────────
function MapToggle({ mode, onChange }: { mode: "map" | "satellite"; onChange: (m: "map" | "satellite") => void }) {
  return (
    <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 8, padding: 2, gap: 2 }}>
      {(["map", "satellite"] as const).map(m => (
        <button key={m} onClick={() => onChange(m)} style={{
          display: "flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 6,
          border: "none", background: mode === m ? "#fff" : "transparent",
          boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
          color: mode === m ? "#1e293b" : "#64748b",
          fontSize: 12, fontWeight: mode === m ? 600 : 400,
          cursor: "pointer", transition: "all .15s", fontFamily: "inherit",
        }}>
          {m === "map" ? <MapIcon size={13} /> : <Layers size={13} />}
          {m === "map" ? "Plan" : "Satellite"}
        </button>
      ))}
    </div>
  );
}

// Bouton heure précédente / suivante
function HourNav({ hour, onChange }: { hour: number; onChange: (h: number) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <button
        onClick={() => onChange(Math.max(0, hour - 1))}
        disabled={hour === 0}
        style={{
          width: 28, height: 28, borderRadius: 7, border: "1px solid #e2e8f0",
          background: "#fff", cursor: hour === 0 ? "not-allowed" : "pointer",
          opacity: hour === 0 ? 0.4 : 1, display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <ChevronLeft size={14} color="#64748b" />
      </button>

      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        background: "#fff", border: "1.5px solid #3b82f6",
        borderRadius: 8, padding: "5px 12px",
      }}>
        <Clock size={13} color="#3b82f6" />
        <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", fontFamily: "monospace", minWidth: 48 }}>
          {padZ(hour)}:00 — {padZ(hour)}:59
        </span>
      </div>

      <button
        onClick={() => onChange(Math.min(23, hour + 1))}
        disabled={hour === 23}
        style={{
          width: 28, height: 28, borderRadius: 7, border: "1px solid #e2e8f0",
          background: "#fff", cursor: hour === 23 ? "not-allowed" : "pointer",
          opacity: hour === 23 ? 0.4 : 1, display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <ChevronRight size={14} color="#64748b" />
      </button>
    </div>
  );
}

// ─── Légende ─────────────────────────────────────────────────────────────────
function Legend() {
  const items = [
    { color: "#3b82f6", label: "Sirène avec alerte(s)" },
    { color: "#94a3b8", label: "Aucune alerte" },
    { color: "#16a34a", label: "Active sans alerte" },
  ];
  return (
    <div style={{
      position: "absolute", bottom: 14, left: 14, zIndex: 1000,
      background: "rgba(255,255,255,0.95)", border: "0.5px solid #e2e8f0",
      borderRadius: 10, padding: "8px 12px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)", fontFamily: "system-ui,sans-serif",
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
        Légende
      </div>
      {items.map(it => (
        <div key={it.label} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: it.color, flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: "#475569" }}>{it.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function SireneMapHistory() {
  const mapRef     = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<any>(null);
  const markersRef = useRef<Map<number, any>>(new Map());
  const tileRef    = useRef<any>(null);

  const [mapReady, setMapReady] = useState(false);
  const [mapMode,  setMapMode]  = useState<"map" | "satellite">("map");

  // ── Filtres date + heure ───────────────────────────────────────────────────
  const [selDate, setSelDate] = useState(todayStr());
  const [selHour, setSelHour] = useState(new Date().getHours());

  // ── Données ───────────────────────────────────────────────────────────────
  const { data: rawSirenes, isLoading: loadingSirenes } = useQuery({
    queryKey: ["sirenes"],
    queryFn:  () => sirenesApi.getAllForMap(),
  });

  const { data: rawHistory, isLoading: loadingHistory, isFetching } = useQuery({
    queryKey: ["history-bngrc", selDate, selHour],
    queryFn:  () => notificationsBngrcApi.getHistory(selDate, selHour),
    enabled:  !!selDate,
  });

  const sirenes = useMemo(() => toArr(rawSirenes), [rawSirenes]);
  const history = useMemo(() => toArr(rawHistory),  [rawHistory]);

  // Map sireneId → liste de notifs dans le créneau  ← doit être AVANT withCoords
  const notifsBySirene = useMemo(() => {
    const m = new Map<number, any[]>();
    history.forEach((n: any) => {
      const sid = n.sireneId ?? n.sirene?.id;
      if (!sid) return;
      if (!m.has(sid)) m.set(sid, []);
      m.get(sid)!.push(n);
    });
    return m;
  }, [history]);

  // ── Seulement les sirènes ayant des alertes dans ce créneau ────────────────
  const withCoords = useMemo(
    () => sirenes.filter((s: any) =>
      s.latitude && s.longitude && notifsBySirene.has(s.id)
    ),
    [sirenes, notifsBySirene]
  );

  // Toutes les sirènes avec coords (pour la stat GPS manquant)
  const allWithCoords = useMemo(
    () => sirenes.filter((s: any) => s.latitude && s.longitude),
    [sirenes]
  );

  const totalSirenesTouchees = notifsBySirene.size;
  const totalAlertes         = history.length;

  // ── Stats du créneau ─────────────────────────────────────────────────────
  const statsBar = useMemo(() => {
    if (!history.length) return null;
    const categories = new Map<string, number>();
    history.forEach((n: any) => {
      const cat = n.categorieAlerteBngrc?.name ?? "Inconnue";
      categories.set(cat, (categories.get(cat) ?? 0) + 1);
    });
    return Array.from(categories.entries()).sort((a, b) => b[1] - a[1]);
  }, [history]);

  // ── Init Leaflet ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!document.getElementById("lf-css")) {
      const l = document.createElement("link"); l.id = "lf-css"; l.rel = "stylesheet";
      l.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(l);
    }
    if (!document.getElementById("sirene-hist-css")) {
      const s = document.createElement("style"); s.id = "sirene-hist-css"; s.textContent = MAP_CSS;
      document.head.appendChild(s);
    }
    if (!mapRef.current || leafletRef.current) return;

    import("leaflet").then((L: any) => {
      if (!mapRef.current || leafletRef.current) return;
      const map = L.map(mapRef.current, { center: [-18.9, 47.5], zoom: 6, zoomControl: false });
      leafletRef.current = map;
      L.control.zoom({ position: "bottomright" }).addTo(map);
      tileRef.current = L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        { attribution: "© OpenStreetMap © CARTO", maxZoom: 19 }
      ).addTo(map);
      setMapReady(true);
    });

    return () => {
      if (leafletRef.current) {
        leafletRef.current.remove(); leafletRef.current = null;
        markersRef.current.clear(); setMapReady(false);
      }
    };
  }, []);

  // ── Tile switch ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !leafletRef.current) return;
    import("leaflet").then((L: any) => {
      if (tileRef.current) leafletRef.current.removeLayer(tileRef.current);
      const url  = mapMode === "satellite"
        ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
      tileRef.current = L.tileLayer(url, {
        attribution: mapMode === "satellite" ? "© Esri" : "© OpenStreetMap © CARTO",
        maxZoom: 19,
      }).addTo(leafletRef.current);
    });
  }, [mapMode, mapReady]);

  // ── Markers — recréés quand les données ou le créneau changent ────────────
  useEffect(() => {
    if (!mapReady || !leafletRef.current) return;
    import("leaflet").then((L: any) => {
      const map = leafletRef.current;
      markersRef.current.forEach(m => m.remove());
      markersRef.current.clear();

      withCoords.forEach((s: any) => {
        const sNotifs = notifsBySirene.get(s.id) ?? [];
        const hasAlert = sNotifs.length > 0;

        // Couleur : bleu si alerte dans ce créneau, vert si actif sans alerte, gris sinon
        const fill = hasAlert
          ? "#3b82f6"
          : s.isActive ? "#16a34a" : "#94a3b8";

        const icon = L.divIcon({
          className: "",
          html: sireneSVG(fill, sNotifs.length),
          iconSize: [44, 54], iconAnchor: [22, 54], popupAnchor: [0, -58],
        });

        const marker = L.marker(
          [parseFloat(s.latitude), parseFloat(s.longitude)],
          { icon, zIndexOffset: hasAlert ? 1000 : 0 }   // alertes au premier plan
        ).addTo(map);

        marker.bindPopup(
          buildHistoryPopup(s, sNotifs),
          { maxWidth: 320, minWidth: 270, closeButton: true, maxHeight: 360 }
        );

        // Ouvrir le popup au survol si alerte
        if (hasAlert) {
          marker.on("mouseover", () => marker.openPopup());
        }

        markersRef.current.set(s.id, marker);
      });

      // fitBounds sur les sirènes affichées (déjà filtrées sur les alertes)
      if (withCoords.length > 0) {
        const bounds = L.latLngBounds(
          withCoords.map((s: any) => [parseFloat(s.latitude), parseFloat(s.longitude)])
        );
        map.fitBounds(bounds, { padding: [60, 60] });
      }
    });
  }, [mapReady, withCoords, notifsBySirene]);

  const isLoading = loadingSirenes || loadingHistory;

  return (
    <AppLayout>
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 64px)" }}>

        {/* ── Header ── */}
        <div style={{
          padding: "14px 24px", display: "flex", alignItems: "center", gap: 12,
          borderBottom: "0.5px solid #e2e8f0", background: "#fff", flexShrink: 0,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10, background: "#eff6ff",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <History size={17} color="#3b82f6" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1e293b" }}>
              Historique des alertes
            </h1>
            <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>
              Alertes BNGRC envoyées par créneau horaire
            </p>
          </div>

          {/* Stats globales du créneau */}
          {!isFetching && totalAlertes > 0 && (
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#3b82f6", lineHeight: 1 }}>
                  {totalAlertes}
                </div>
                <div style={{ fontSize: 10, color: "#94a3b8" }}>alerte{totalAlertes > 1 ? "s" : ""} envoyée{totalAlertes > 1 ? "s" : ""}</div>
              </div>
              <div style={{ width: 1, height: 28, background: "#e2e8f0" }} />
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#6366f1", lineHeight: 1 }}>
                  {totalSirenesTouchees}
                </div>
                <div style={{ fontSize: 10, color: "#94a3b8" }}>sirène{totalSirenesTouchees > 1 ? "s" : ""} touchée{totalSirenesTouchees > 1 ? "s" : ""}</div>
              </div>
            </div>
          )}
          {!isFetching && totalAlertes === 0 && selDate && (
            <div style={{ marginLeft: "auto", fontSize: 12, color: "#94a3b8" }}>
              Aucune alerte dans ce créneau
            </div>
          )}
        </div>

        {/* ── Toolbar filtres ── */}
        <div style={{
          padding: "10px 24px", background: "#fafbfc",
          borderBottom: "0.5px solid #e2e8f0", flexShrink: 0,
          display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
        }}>
          {/* Sélecteur date */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Date
            </span>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <Calendar size={13} color="#64748b" style={{ position: "absolute", left: 9, pointerEvents: "none" }} />
              <input
                type="date"
                value={selDate}
                max={todayStr()}
                onChange={e => setSelDate(e.target.value)}
                style={{
                  paddingLeft: 28, paddingRight: 10, paddingTop: 6, paddingBottom: 6,
                  border: "1.5px solid #3b82f6", borderRadius: 8,
                  fontSize: 13, color: "#1e293b", fontFamily: "inherit",
                  background: "#fff", outline: "none", cursor: "pointer",
                }}
              />
            </div>
          </div>

          <div style={{ width: 1, height: 22, background: "#e2e8f0", flexShrink: 0 }} />

          {/* Sélecteur heure */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Heure
            </span>
            <HourNav hour={selHour} onChange={setSelHour} />
          </div>

          {/* Chips catégories trouvées */}
          {statsBar && statsBar.length > 0 && (
            <>
              <div style={{ width: 1, height: 22, background: "#e2e8f0", flexShrink: 0 }} />
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                {statsBar.map(([cat, count]) => (
                  <div key={cat} style={{
                    display: "flex", alignItems: "center", gap: 5,
                    background: "#eff6ff", borderRadius: 20, padding: "3px 10px",
                    fontSize: 11, color: "#1d4ed8", fontWeight: 500,
                  }}>
                    <Radio size={10} /> {cat}
                    <span style={{
                      background: "#3b82f6", color: "white",
                      borderRadius: 10, padding: "0 5px", fontSize: 10, fontWeight: 700,
                    }}>
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          <div style={{ marginLeft: "auto" }}>
            <MapToggle mode={mapMode} onChange={setMapMode} />
          </div>
        </div>

        {/* ── Carte ── */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

          <Legend />

          {/* Spinner overlay pendant le chargement */}
          {(isLoading || isFetching) && (
            <div style={{
              position: "absolute", inset: 0, display: "flex",
              alignItems: "center", justifyContent: "center",
              background: "rgba(255,255,255,0.7)", zIndex: 2000,
              backdropFilter: "blur(2px)",
            }}>
              <div style={{ textAlign: "center" }}>
                <div style={{
                  width: 38, height: 38, borderRadius: "50%",
                  border: "3px solid #dbeafe", borderTop: "3px solid #3b82f6",
                  animation: "spin 0.9s linear infinite", margin: "0 auto 10px",
                }} />
                <div style={{ fontSize: 13, color: "#64748b" }}>
                  {loadingSirenes ? "Chargement des sirènes…" : "Recherche des alertes…"}
                </div>
              </div>
            </div>
          )}

          {/* Message si aucune alerte dans ce créneau */}
          {!isFetching && !loadingSirenes && totalAlertes === 0 && selDate && (
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 1000, background: "rgba(255,255,255,0.95)",
              border: "0.5px solid #e2e8f0", borderRadius: 14,
              padding: "24px 32px", textAlign: "center",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              fontFamily: "system-ui,sans-serif",
              pointerEvents: "none",
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: "50%", background: "#f8fafc",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 12px",
              }}>
                <History size={22} color="#cbd5e1" />
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>
                Aucune alerte dans ce créneau
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>
                {selDate} · {padZ(selHour)}h00 — {padZ(selHour)}h59<br/>
                Aucune sirène n'a reçu d'alerte à cette heure.
              </div>
            </div>
          )}

          {/* Info GPS manquant */}
          {sirenes.length > allWithCoords.length && (
            <div style={{
              position: "absolute", bottom: 14, right: 14, zIndex: 1000,
              background: "rgba(255,251,235,0.95)", border: "0.5px solid #fcd34d",
              borderRadius: 8, padding: "5px 10px", fontSize: 11, color: "#b45309",
              display: "flex", alignItems: "center", gap: 4,
            }}>
              <MapPin size={10} />
              {sirenes.length - allWithCoords.length} sirène{sirenes.length - allWithCoords.length > 1 ? "s" : ""} sans GPS
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AppLayout>
  );
}