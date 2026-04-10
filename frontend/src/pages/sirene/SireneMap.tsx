import { useRef, useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { sirenesApi }   from "@/services/sirene.api";
import { provincesApi } from "@/services/province.api";
import { regionsApi }   from "@/services/region.api";
import { AppLayout }    from "@/components/AppLayout";
import {
  Radio, Wifi, WifiOff, MapPin, Activity,
  Layers,  Map as MapIcon, ChevronDown, RotateCcw,
} from "lucide-react";

// ─── helpers ──────────────────────────────────────────────────────────────────
const toArr = (r: any) =>
  Array.isArray(r) ? r : r?.response ?? r?.data ?? [];

// ─── Icône SVG sirène ─────────────────────────────────────────────────────────
function sireneSVG(active: boolean, isOwned: boolean) {
    const fill = !isOwned
    ? "#eab308" // jaune (non possédé)
    : active
    ? "#16a34a" // vert
    : "#dc2626"; // rouge

  const ring = active ? "#bbf7d0" : "#fecaca";
  return `
    <div class="sirene-map-icon ${active ? "active" : "inactive"}">
      <div class="sirene-pulse-ring" style="background:${ring}"></div>
      <div class="sirene-marker" style="background:${fill}">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
      <div class="sirene-pin-tail" style="background:${fill}"></div>
    </div>
  `;
}

// ─── CSS icons + popup ────────────────────────────────────────────────────────
const MAP_CSS = `
  .sirene-map-icon { position:relative; width:44px; height:54px; display:flex; flex-direction:column; align-items:center; cursor:pointer; }
  .sirene-pulse-ring {
    position:absolute; top:0; left:50%; transform:translateX(-50%);
    width:44px; height:44px; border-radius:50%;
    animation:sirene-pulse 2.4s ease-out infinite; opacity:0;
  }
  .sirene-map-icon.inactive .sirene-pulse-ring { animation:none; opacity:0.15; }
  @keyframes sirene-pulse {
    0%   { transform:translateX(-50%) scale(0.6); opacity:0.7; }
    100% { transform:translateX(-50%) scale(1.6); opacity:0;   }
  }
  .sirene-marker {
    position:relative; z-index:2;
    width:38px; height:38px; border-radius:50%;
    display:flex; align-items:center; justify-content:center;
    box-shadow:0 4px 14px rgba(0,0,0,0.22), 0 0 0 3px white;
    transition:transform 0.15s ease;
  }
  .sirene-map-icon:hover .sirene-marker { transform:scale(1.12); }
  .sirene-pin-tail { width:3px; height:12px; border-radius:0 0 3px 3px; margin-top:-2px; z-index:1; }
  .leaflet-popup-content-wrapper {
    border-radius:14px !important; padding:0 !important; overflow:hidden;
    box-shadow:0 8px 32px rgba(0,0,0,0.14) !important;
    border:0.5px solid #e2e8f0 !important;
  }
  .leaflet-popup-content { margin:0 !important; min-width:210px; }
  .leaflet-popup-tip-container { display:none; }
`;

// ─── Popup HTML ───────────────────────────────────────────────────────────────
function buildPopupHTML(s: any) {
    const ownerLabel = s.isOwned ? "Votre sirène" : "Autre sirène";
    const fill  = s.isActive ? "#16a34a" : "#dc2626";
    const bg    = s.isActive ? "#f0fdf4" : "#fef2f2";
    const label = s.isActive ? "Active" : "Inactive";
    const row = (k: string, v: string) => `
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <span style="color:#64748b;font-size:11px;">${k}</span>
      <span style="color:#1e293b;font-weight:500;font-size:11px;font-family:monospace;">${v}</span>
    </div>`;
  return `
    <div style="font-family:system-ui,sans-serif;font-size:13px;">
      <div style="background:${fill};padding:12px 14px;">
        <div style="color:white;font-weight:700;font-size:14px;margin-bottom:2px;">
          ${s.name ?? s.imei ?? `Sirene #${s.id}`}
        </div>
        <div style="color:rgba(255,255,255,0.8);font-size:11px;">📍 ${s.village?.name ?? "Village inconnu"}</div>
      </div>
      <div style="padding:10px 14px;display:flex;flex-direction:column;gap:7px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:.04em;">Statut</span>
          <span style="background:${bg};color:${fill};padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600;">${label}</span>
        </div>
        ${row("IMEI", s.imei ?? "—")}
        ${row("N° Brain", s.phoneNumberBrain ?? "—")}
        ${row("N° Relai", s.phoneNumberRelai ?? "—")}
        ${s.latitude && s.longitude ? `
          <div style="margin-top:2px;padding-top:7px;border-top:.5px solid #f1f5f9;display:flex;justify-content:space-between;">
            <span style="color:#94a3b8;font-size:10px;">GPS</span>
            <span style="color:#94a3b8;font-size:10px;font-family:monospace;">
              ${parseFloat(s.latitude).toFixed(4)}, ${parseFloat(s.longitude).toFixed(4)}
            </span>
          </div>` : ""}
      </div>
    </div>`;
}

// ─── Select dropdown réutilisable ─────────────────────────────────────────────
function FilterSelect({
  label, value, options, onChange, disabled = false,
}: {
  label: string;
  value: string;
  options: { id: string | number; name: string }[];
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div style={{ position: "relative", minWidth: 140 }}>
      <select
        disabled={disabled}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          appearance: "none", width: "100%",
          padding: "7px 28px 7px 10px",
          fontSize: 13, color: value ? "#1e293b" : "#94a3b8",
          background: "#fff",
          border: `1.5px solid ${value ? "#3b82f6" : "#e2e8f0"}`,
          borderRadius: 8, cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.45 : 1,
          outline: "none", transition: "border-color .15s",
          fontFamily: "inherit",
        }}
      >
        <option value="">{label}</option>
        {options.map(o => (
          <option key={o.id} value={String(o.id)}>{o.name}</option>
        ))}
      </select>
      <ChevronDown
        size={13} color="#94a3b8"
        style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
      />
    </div>
  );
}

// ─── Toggle Map / Satellite ───────────────────────────────────────────────────
function MapToggle({ mode, onChange }: { mode: "map" | "satellite"; onChange: (m: "map" | "satellite") => void }) {
  return (
    <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 8, padding: 2, gap: 2 }}>
      {(["map", "satellite"] as const).map(m => (
        <button
          key={m}
          onClick={() => onChange(m)}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "5px 11px", borderRadius: 6, border: "none",
            background: mode === m ? "#fff" : "transparent",
            boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
            color: mode === m ? "#1e293b" : "#64748b",
            fontSize: 12, fontWeight: mode === m ? 600 : 400,
            cursor: "pointer", transition: "all .15s", fontFamily: "inherit",
          }}
        >
          {m === "map" ? <MapIcon  size={13} /> : <Layers size={13} />}
          {m === "map" ? "Plan" : "Satellite"}
        </button>
      ))}
    </div>
  );
}

// ─── Chip filtre statut ───────────────────────────────────────────────────────
function StatusChip({ value, current, label, color, bg, onClick }: any) {
  const active = current === value;
  return (
    <button
      onClick={() => onClick(active ? "all" : value)}
      style={{
        display: "flex", alignItems: "center", gap: 5,
        padding: "5px 12px", borderRadius: 20, border: "none",
        background: active ? bg : "#f8fafc",
        color: active ? color : "#64748b",
        fontSize: 12, fontWeight: active ? 600 : 400,
        cursor: "pointer",
        boxShadow: active ? `inset 0 0 0 1.5px ${color}` : "inset 0 0 0 1px #e2e8f0",
        transition: "all .15s", fontFamily: "inherit",
      }}
    >
      <span style={{
        width: 7, height: 7, borderRadius: "50%",
        background: active ? color : "#cbd5e1", flexShrink: 0,
      }} />
      {label}
    </button>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function SireneMap() {
  const mapRef      = useRef<HTMLDivElement>(null);
  const leafletRef  = useRef<any>(null);
  const markersRef  = useRef<Map<number, any>>(new Map());
  const tileRef     = useRef<any>(null);

  const [mapReady,     setMapReady]     = useState(false);
  const [selected,     setSelected]     = useState<any>(null);
  const [mapMode,      setMapMode]      = useState<"map" | "satellite">("map");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Filtres géographiques
  const [selProvince,   setSelProvince]   = useState("");
  const [selRegion,     setSelRegion]     = useState("");
  const [selDistrict,   setSelDistrict]   = useState("");
  const [selCommune,    setSelCommune]    = useState("");
  const [selFokontany,  setSelFokontany]  = useState("");
  const [selVillage,    setSelVillage]    = useState("");

  // ── Requêtes ─────────────────────────────────────────────────────
  const { data: rawSirenes, isLoading } = useQuery({
    queryKey: ["sirenes"], queryFn: () => sirenesApi.getAllForMap(),
  });
  const { data: rawProvinces } = useQuery({
    queryKey: ["provinces"], queryFn: () => provincesApi.getAll(),
  });
  const { data: rawRegions } = useQuery({
    queryKey: ["regions"], queryFn: () => regionsApi.getAll(),
  });

  const sirenes    = useMemo(() => toArr(rawSirenes),   [rawSirenes]);
  const provinces  = useMemo(() => toArr(rawProvinces), [rawProvinces]);
  const allRegions = useMemo(() => toArr(rawRegions),   [rawRegions]);

  // ── Arbre géographique dérivé des sirènes ─────────────────────────
  const geoTree = useMemo(() => {
    const districts:  Map<string, { id: string; name: string; regionId: string }> = new Map();
    const communes:   Map<string, { id: string; name: string; districtId: string }> = new Map();
    const fokontanys: Map<string, { id: string; name: string; communeId: string }> = new Map();
    const villages:   Map<string, { id: string; name: string; fokontanyId: string }> = new Map();

    sirenes.forEach((s: any) => {
      const v = s.village; if (!v) return;
      const vId  = String(v.id ?? v.name ?? "");
      const fId  = String(v.fokontany?.id ?? v.fokontanyId ?? "");
      const fNm  = v.fokontany?.name ?? v.fokontanyName ?? "";
      const cId  = String(v.fokontany?.commune?.id ?? v.communeId ?? "");
      const cNm  = v.fokontany?.commune?.name ?? v.communeName ?? "";
      const dId  = String(v.fokontany?.commune?.district?.id ?? v.districtId ?? "");
      const dNm  = v.fokontany?.commune?.district?.name ?? v.districtName ?? "";
      const rId  = String(v.region?.id ?? v.regionId ?? v.fokontany?.commune?.district?.region?.id ?? "");

      if (dId && dNm) districts.set(dId,   { id: dId,  name: dNm,  regionId: rId });
      if (cId && cNm) communes.set(cId,    { id: cId,  name: cNm,  districtId: dId });
      if (fId && fNm) fokontanys.set(fId,  { id: fId,  name: fNm,  communeId: cId });
      if (vId && v.name) villages.set(vId, { id: vId,  name: v.name, fokontanyId: fId });
    });

    return {
      districts:  Array.from(districts.values()),
      communes:   Array.from(communes.values()),
      fokontanys: Array.from(fokontanys.values()),
      villages:   Array.from(villages.values()),
    };
  }, [sirenes]);

  // Options filtrées par sélection parente
  const filteredRegions    = useMemo(() =>
    selProvince
      ? allRegions.filter((r: any) => String(r.provinceId ?? r.province_id) === selProvince)
      : allRegions,
    [allRegions, selProvince]
  );
  const filteredDistricts  = useMemo(() =>
    selRegion ? geoTree.districts.filter(d => d.regionId === selRegion) : geoTree.districts,
    [geoTree, selRegion]
  );
  const filteredCommunes   = useMemo(() =>
    selDistrict ? geoTree.communes.filter(c => c.districtId === selDistrict) : geoTree.communes,
    [geoTree, selDistrict]
  );
  const filteredFokontanys = useMemo(() =>
    selCommune ? geoTree.fokontanys.filter(f => f.communeId === selCommune) : geoTree.fokontanys,
    [geoTree, selCommune]
  );
  const filteredVillages   = useMemo(() =>
    selFokontany ? geoTree.villages.filter(v => v.fokontanyId === selFokontany) : geoTree.villages,
    [geoTree, selFokontany]
  );

  // Reset cascade descendante
  const handleProvince  = (v: string) => { setSelProvince(v);  setSelRegion(""); setSelDistrict(""); setSelCommune(""); setSelFokontany(""); setSelVillage(""); };
  const handleRegion    = (v: string) => { setSelRegion(v);    setSelDistrict(""); setSelCommune(""); setSelFokontany(""); setSelVillage(""); };
  const handleDistrict  = (v: string) => { setSelDistrict(v);  setSelCommune(""); setSelFokontany(""); setSelVillage(""); };
  const handleCommune   = (v: string) => { setSelCommune(v);   setSelFokontany(""); setSelVillage(""); };
  const handleFokontany = (v: string) => { setSelFokontany(v); setSelVillage(""); };

  const hasGeoFilter = !!(selProvince || selRegion || selDistrict || selCommune || selFokontany || selVillage);

  const resetAllFilters = () => {
    setStatusFilter("all");
    setSelProvince(""); setSelRegion(""); setSelDistrict("");
    setSelCommune(""); setSelFokontany(""); setSelVillage("");
  };

  // ── Sirènes visibles après filtres ───────────────────────────────
  const visibleSirenes = useMemo(() => {
    return sirenes.filter((s: any) => {
      if (statusFilter === "active"   && !s.isActive) return false;
      if (statusFilter === "inactive" &&  s.isActive) return false;

      const v   = s.village;
      const fId = String(v?.fokontany?.id ?? v?.fokontanyId ?? "");
      const cId = String(v?.fokontany?.commune?.id ?? v?.communeId ?? "");
      const dId = String(v?.fokontany?.commune?.district?.id ?? v?.districtId ?? "");
      const rId = String(v?.region?.id ?? v?.regionId ?? "");
      const vId = String(v?.id ?? v?.name ?? "");

      if (selVillage   && vId  !== selVillage)   return false;
      if (selFokontany && fId  !== selFokontany) return false;
      if (selCommune   && cId  !== selCommune)   return false;
      if (selDistrict  && dId  !== selDistrict)  return false;
      if (selRegion    && rId  !== selRegion)    return false;
      if (selProvince) {
        const reg = allRegions.find((r: any) => String(r.id) === rId);
        if (!reg || String(reg.provinceId ?? reg.province_id) !== selProvince) return false;
      }
      return true;
    });
  }, [sirenes, statusFilter, selVillage, selFokontany, selCommune, selDistrict, selRegion, selProvince, allRegions]);

  const withCoords = useMemo(
    () => visibleSirenes.filter((s: any) => s.latitude && s.longitude),
    [visibleSirenes]
  );

  // ── Init Leaflet ────────────────────────────────────────────────
  useEffect(() => {
    if (!document.getElementById("lf-css")) {
      const l = document.createElement("link");
      l.id = "lf-css"; l.rel = "stylesheet";
      l.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(l);
    }
    if (!document.getElementById("sirene-css")) {
      const s = document.createElement("style");
      s.id = "sirene-css"; s.textContent = MAP_CSS;
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
        leafletRef.current.remove();
        leafletRef.current = null;
        markersRef.current.clear();
        setMapReady(false);
      }
    };
  }, []);

  // ── Switch tuile Plan ↔ Satellite ─────────────────────────────────
  useEffect(() => {
    if (!mapReady || !leafletRef.current) return;
    import("leaflet").then((L: any) => {
      if (tileRef.current) leafletRef.current.removeLayer(tileRef.current);
      const url = mapMode === "satellite"
        ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
      const attr = mapMode === "satellite"
        ? "© Esri, Maxar, Earthstar Geographics"
        : "© OpenStreetMap © CARTO";
      tileRef.current = L.tileLayer(url, { attribution: attr, maxZoom: 19 }).addTo(leafletRef.current);
    });
  }, [mapMode, mapReady]);

  // ── Markers : recalcul quand filtres ou données changent ──────────
  useEffect(() => {
    if (!mapReady || !leafletRef.current) return;
    import("leaflet").then((L: any) => {
      const map = leafletRef.current;
      markersRef.current.forEach(m => m.remove());
      markersRef.current.clear();

      withCoords.forEach((s: any) => {
        const icon = L.divIcon({
          className: "",
          html: sireneSVG(s.isActive, s.isOwned),
          iconSize: [44, 54], iconAnchor: [22, 54], popupAnchor: [0, -56],
        });
        const marker = L.marker([parseFloat(s.latitude), parseFloat(s.longitude)], { icon }).addTo(map);
        marker.bindPopup(buildPopupHTML(s), { maxWidth: 240, minWidth: 210, closeButton: false });
        marker.on("click", () => setSelected(s));
        markersRef.current.set(s.id, marker);
      });

      if (withCoords.length > 0) {
        const bounds = L.latLngBounds(
          withCoords.map((s: any) => [parseFloat(s.latitude), parseFloat(s.longitude)])
        );
        map.fitBounds(bounds, { padding: [80, 80] });
      }
    });
  }, [mapReady, withCoords]);

  // ── Fly to sur sélection ──────────────────────────────────────────
  useEffect(() => {
    if (!selected || !mapReady || !leafletRef.current) return;
    const marker = markersRef.current.get(selected.id);
    if (!marker) return;
    leafletRef.current.flyTo(
      [parseFloat(selected.latitude), parseFloat(selected.longitude)],
      13, { duration: 0.8 }
    );
    setTimeout(() => marker.openPopup(), 850);
  }, [selected]);

  // ─────────────────────────────────────────────────────────────────
  const activeCount   = sirenes.filter((s: any) =>  s.isActive).length;
  const inactiveCount = sirenes.filter((s: any) => !s.isActive).length;
  const isFiltered    = statusFilter !== "all" || hasGeoFilter;

  return (
    <AppLayout>
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 64px)" }}>

        {/* ── Header ── */}
        <div style={{
          padding: "14px 24px", display: "flex", alignItems: "center",
          gap: 12, borderBottom: "0.5px solid #e2e8f0", background: "#fff", flexShrink: 0,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10, background: "#eff6ff",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Radio size={17} color="#3b82f6" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1e293b" }}>
              Cartographie des sirènes
            </h1>
            <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>
              {withCoords.length} affichée{withCoords.length > 1 ? "s" : ""} sur {sirenes.length} au total
            </p>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            <Activity size={13} color={activeCount === sirenes.length ? "#22c55e" : "#f59e0b"} />
            <span style={{ fontSize: 12, color: "#64748b" }}>
              <strong style={{ color: "#1e293b" }}>{activeCount}</strong>/{sirenes.length} actives
            </span>
          </div>
        </div>

        {/* ── Toolbar filtres (hors carte) ── */}
        <div style={{
          padding: "10px 24px", background: "#fafbfc",
          borderBottom: "0.5px solid #e2e8f0", flexShrink: 0,
          display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
        }}>

          {/* --- Statut --- */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginRight: 2 }}>
              Statut
            </span>
            <StatusChip
              value="active" current={statusFilter}
              label={`Actives (${activeCount})`}
              color="#16a34a" bg="#f0fdf4"
              onClick={setStatusFilter}
            />
            <StatusChip
              value="inactive" current={statusFilter}
              label={`Inactives (${inactiveCount})`}
              color="#dc2626" bg="#fef2f2"
              onClick={setStatusFilter}
            />
          </div>

          {/* Séparateur */}
          <div style={{ width: 1, height: 22, background: "#e2e8f0", margin: "0 4px", flexShrink: 0 }} />

          {/* --- Cascade géographique --- */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginRight: 2 }}>
              Zone
            </span>
            <FilterSelect
              label="Province" value={selProvince}
              options={provinces.map((p: any) => ({ id: p.id, name: p.name }))}
              onChange={handleProvince}
            />
            <FilterSelect
              label="Région" value={selRegion}
              options={filteredRegions.map((r: any) => ({ id: r.id, name: r.name }))}
              onChange={handleRegion}
              disabled={!selProvince && provinces.length > 0}
            />
            <FilterSelect
              label="District" value={selDistrict}
              options={filteredDistricts.map(d => ({ id: d.id, name: d.name }))}
              onChange={handleDistrict}
              disabled={!selRegion}
            />
            <FilterSelect
              label="Commune" value={selCommune}
              options={filteredCommunes.map(c => ({ id: c.id, name: c.name }))}
              onChange={handleCommune}
              disabled={!selDistrict}
            />
            <FilterSelect
              label="Fokontany" value={selFokontany}
              options={filteredFokontanys.map(f => ({ id: f.id, name: f.name }))}
              onChange={handleFokontany}
              disabled={!selCommune}
            />
            <FilterSelect
              label="Village" value={selVillage}
              options={filteredVillages.map(v => ({ id: v.id, name: v.name }))}
              onChange={setSelVillage}
              disabled={!selFokontany}
            />
          </div>

          {/* Reset */}
          {isFiltered && (
            <button
              onClick={resetAllFilters}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "5px 10px", borderRadius: 8,
                border: "1px solid #e2e8f0", background: "#fff",
                color: "#64748b", fontSize: 12, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              <RotateCcw size={12} /> Réinitialiser
            </button>
          )}

          {/* Toggle Plan/Satellite poussé à droite */}
          <div style={{ marginLeft: "auto" }}>
            <MapToggle mode={mapMode} onChange={setMapMode} />
          </div>
        </div>

        {/* ── Zone carte plein écran ── */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

          {/* Compteur résultats filtrés (overlay discret) */}
          {isFiltered && (
            <div style={{
              position: "absolute", top: 12, right: 12, zIndex: 1000,
              background: "rgba(255,255,255,0.95)", border: "0.5px solid #e2e8f0",
              borderRadius: 8, padding: "6px 12px",
              fontSize: 12, color: "#1e293b", fontWeight: 600,
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <Radio size={12} color="#3b82f6" />
              {visibleSirenes.length} sirène{visibleSirenes.length > 1 ? "s" : ""} filtrée{visibleSirenes.length > 1 ? "s" : ""}
            </div>
          )}

          {/* Badge sirènes sans GPS */}
          {sirenes.length > withCoords.length && (
            <div style={{
              position: "absolute", bottom: 14, left: 14, zIndex: 1000,
              background: "rgba(255,251,235,0.95)", border: "0.5px solid #fcd34d",
              borderRadius: 8, padding: "6px 11px",
              fontSize: 12, color: "#b45309", display: "flex", alignItems: "center", gap: 5,
            }}>
              <MapPin size={11} />
              {sirenes.length - withCoords.length} sirène{sirenes.length - withCoords.length > 1 ? "s" : ""} sans coordonnées GPS
            </div>
          )}

          {/* Loader */}
          {isLoading && (
            <div style={{
              position: "absolute", inset: 0, display: "flex", alignItems: "center",
              justifyContent: "center", background: "rgba(255,255,255,0.85)", zIndex: 2000,
            }}>
              <div style={{ textAlign: "center" }}>
                <div style={{
                  width: 38, height: 38, borderRadius: "50%",
                  border: "3px solid #dbeafe", borderTop: "3px solid #3b82f6",
                  animation: "spin 0.9s linear infinite", margin: "0 auto 10px",
                }} />
                <div style={{ fontSize: 13, color: "#64748b" }}>Chargement des sirènes…</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AppLayout>
  );
}