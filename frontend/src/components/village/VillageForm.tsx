import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ChevronLeft, MapPin, Navigation } from "lucide-react";
import { provincesApi } from "@/services/province.api";
import { regionsApi }   from "@/services/region.api";
import { districtsApi } from "@/services/districts.api";
import type { Province } from "@/types/province";
import type { Region }   from "@/types/region";
import type { District } from "@/types/district";
import "@/styles/page.css";
import "@/styles/utilisateurs.css";
import "@/styles/village-form.css";

export interface VillageFormData {
  name:       string;
  latitude:   string;
  longitude:  string;
  provinceId: number;
  regionId:   number;
  districtId: number;
}

interface VillageFormProps {
  initialData?: Partial<VillageFormData> & { id?: number };
  onSubmit: (data: VillageFormData) => Promise<void>;
  loading: boolean;
  error?: string;
}

// Madagascar centre par défaut
const DEFAULT_LAT = -18.9249;
const DEFAULT_LNG =  47.5185;
const DEFAULT_ZOOM = 6;

export function VillageForm({ initialData, onSubmit, loading, error }: VillageFormProps) {
  const isEdit   = !!initialData?.id;
  const navigate = useNavigate();
  const mapRef      = useRef<HTMLDivElement>(null);
  const leafletRef  = useRef<any>(null);   // instance map Leaflet
  const markerRef   = useRef<any>(null);   // marqueur actuel

  const [form, setForm] = useState<VillageFormData>({
    name:       initialData?.name       ?? "",
    latitude:   initialData?.latitude   ?? "",
    longitude:  initialData?.longitude  ?? "",
    provinceId: initialData?.provinceId ?? 0,
    regionId:   initialData?.regionId   ?? 0,
    districtId: initialData?.districtId ?? 0,
  });

  const set = <K extends keyof VillageFormData>(k: K, v: VillageFormData[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const [latInput, setLatInput] = useState(initialData?.latitude  ?? "");
  const [lngInput, setLngInput] = useState(initialData?.longitude ?? "");

  // Sync édition async
  useEffect(() => {
    if (initialData?.id) {
      setForm({
        name:       initialData.name       ?? "",
        latitude:   initialData.latitude   ?? "",
        longitude:  initialData.longitude  ?? "",
        provinceId: initialData.provinceId ?? 0,
        regionId:   initialData.regionId   ?? 0,
        districtId: initialData.districtId ?? 0,
      });
      setLatInput(initialData.latitude  ?? "");
      setLngInput(initialData.longitude ?? "");
    }
  }, [initialData?.id]);

  function moveMarker(latN: number, lngN: number) {
    if (!leafletRef.current || isNaN(latN) || isNaN(lngN)) return;
    import("leaflet").then(L => {
      const icon = L.divIcon({ className: "", html: `<div class="map-marker-pin"></div>`, iconSize: [28,28], iconAnchor: [14,28] });
      if (markerRef.current) markerRef.current.setLatLng([latN, lngN]);
      else markerRef.current = L.marker([latN, lngN], { icon }).addTo(leafletRef.current);
      leafletRef.current.setView([latN, lngN], 13);
    });
  }

  function handleLatInput(val: string) {
    setLatInput(val);
    setForm(f => ({ ...f, latitude: val }));
    moveMarker(parseFloat(val), parseFloat(lngInput));
  }

  function handleLngInput(val: string) {
    setLngInput(val);
    setForm(f => ({ ...f, longitude: val }));
    moveMarker(parseFloat(latInput), parseFloat(val));
  }

  // ── Données géographiques ──
  const { data: rawProvinces } = useQuery({
    queryKey: ["provinces"],
    queryFn:  () => provincesApi.getAll(),
  });
  const provinces: Province[] = Array.isArray(rawProvinces)
    ? rawProvinces
    : (rawProvinces as any)?.data ?? (rawProvinces as any)?.response ?? [];

  const { data: rawRegions } = useQuery({
    queryKey: ["regions"],
    queryFn:  () => regionsApi.getAll(),
  });
  const allRegions: Region[] = Array.isArray(rawRegions)
    ? rawRegions
    : (rawRegions as any)?.data ?? (rawRegions as any)?.response ?? [];

  const { data: rawDistricts } = useQuery({
    queryKey: ["districts"],
    queryFn:  () => districtsApi.getAll(),
  });
  const allDistricts: District[] = Array.isArray(rawDistricts)
    ? rawDistricts
    : (rawDistricts as any)?.data ?? (rawDistricts as any)?.response ?? [];

  // ── Cascade ──
  const filteredRegions = form.provinceId
    ? allRegions.filter(r => {
        const pid = (r as any).province?.id ?? (r as any).provinceId;
        return Number(pid) === Number(form.provinceId);
      })
    : allRegions;

  const filteredDistricts = form.regionId
    ? allDistricts.filter(d => {
        const rid = (d as any).region?.id ?? (d as any).regionId;
        return Number(rid) === Number(form.regionId);
      })
    : allDistricts;

  // Reset cascade en aval
  const handleProvinceChange = (id: number) => {
    setForm(f => ({ ...f, provinceId: id, regionId: 0, districtId: 0 }));
  };
  const handleRegionChange = (id: number) => {
    setForm(f => ({ ...f, regionId: id, districtId: 0 }));
  };

  // ── Initialisation Leaflet ──
  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return;

    // Charger Leaflet dynamiquement
    const link = document.createElement("link");
    link.rel   = "stylesheet";
    link.href  = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    import("leaflet").then(L => {
      if (!mapRef.current || leafletRef.current) return;

      const initLat = form.latitude  ? parseFloat(form.latitude)  : DEFAULT_LAT;
      const initLng = form.longitude ? parseFloat(form.longitude) : DEFAULT_LNG;
      const initZoom = form.latitude ? 13 : DEFAULT_ZOOM;

      const map = L.map(mapRef.current).setView([initLat, initLng], initZoom);
      leafletRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Icône personnalisée
      const icon = L.divIcon({
        className: "",
        html: `<div class="map-marker-pin"></div>`,
        iconSize:   [28, 28],
        iconAnchor: [14, 28],
      });

      // Marqueur initial si coordonnées existantes
      if (form.latitude && form.longitude) {
        markerRef.current = L.marker([initLat, initLng], { icon }).addTo(map);
      }

      // Clic sur la carte → place/déplace le marqueur
      map.on("click", (e: any) => {
        const { lat, lng } = e.latlng;
        const latStr = lat.toFixed(10);
        const lngStr = lng.toFixed(10);
        setLatInput(latStr);
        setLngInput(lngStr);
        setForm(f => ({ ...f, latitude: latStr, longitude: lngStr }));
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng], { icon }).addTo(map);
        }
      });
    });

    return () => {
      if (leafletRef.current) {
        leafletRef.current.remove();
        leafletRef.current = null;
        markerRef.current  = null;
      }
    };
  }, []);

  // Recentrer si édition et coords disponibles après chargement
  useEffect(() => {
    if (leafletRef.current && form.latitude && form.longitude) {
      const lat = parseFloat(form.latitude);
      const lng = parseFloat(form.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        leafletRef.current.setView([lat, lng], 13);
      }
    }
  }, [initialData?.id]);

  const handleGeolocate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const latStr = lat.toFixed(10);
      const lngStr = lng.toFixed(10);
      setLatInput(latStr);
      setLngInput(lngStr);
      setForm(f => ({ ...f, latitude: latStr, longitude: lngStr }));
      moveMarker(lat, lng);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      name:       form.name.trim(),
      latitude:   form.latitude,
      longitude:  form.longitude,
      provinceId: Number(form.provinceId),
      regionId:   Number(form.regionId),
      districtId: Number(form.districtId),
    });
  };

  const isValid =
    form.name.trim() &&
    form.latitude &&
    form.longitude &&
    form.provinceId > 0 &&
    form.regionId   > 0 &&
    form.districtId > 0;

  return (
    <div className="form-page">

      {/* Header */}
      <div className="form-page-header">
        <button className="btn-back" onClick={() => navigate("/villages")}>
          <ChevronLeft size={16} /> Retour à la liste
        </button>
        <h1 className="page-title">
          {isEdit ? "Modifier le village" : "Nouveau village"}
        </h1>
        <p className="page-subtitle">
          {isEdit
            ? "Modifiez les informations du village"
            : "Cliquez sur la carte pour positionner le village"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="village-form-layout">

        {/* ── Informations ── */}
        <div className="form-card">
          <div className="form-section">
            <div className="form-section-title">Informations</div>

            <div className="form-field">
              <label>Nom du village <span className="required">*</span></label>
              <input
                type="text" placeholder="ex: Ambohimangakely"
                value={form.name} required autoFocus
                onChange={e => set("name", e.target.value)}
              />
            </div>

            <div className="form-field">
              <label>
                Position GPS
                <span className="required"> *</span>
              </label>
              <div className="gps-input-row">
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: "0.72rem", color: "#9aa0a6", textTransform: "uppercase", letterSpacing: "0.04em" }}>Latitude</span>
                  <input
                    type="text"
                    placeholder="-18.9249..."
                    value={latInput}
                    onChange={e => handleLatInput(e.target.value)}
                  />
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: "0.72rem", color: "#9aa0a6", textTransform: "uppercase", letterSpacing: "0.04em" }}>Longitude</span>
                  <input
                    type="text"
                    placeholder="47.5185..."
                    value={lngInput}
                    onChange={e => handleLngInput(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className="btn-geolocate"
                  onClick={handleGeolocate}
                  title="Ma position actuelle"
                  style={{ alignSelf: "flex-end" }}
                >
                  <Navigation size={14} />
                </button>
              </div>
              <p style={{ fontSize: "0.73rem", color: "#94a3b8", margin: "4px 0 0" }}>
                Saisissez les coordonnées ou cliquez directement sur la carte
              </p>
            </div>
          </div>
        </div>

        {/* ── Localisation cascade ── */}
        <div className="form-card">
          <div className="form-section">
            <div className="form-section-title">Localisation</div>

            <div className="form-field">
              <label>Province <span className="required">*</span></label>
              <select
                value={form.provinceId || ""}
                required
                onChange={e => handleProvinceChange(Number(e.target.value))}
              >
                <option value="">— Choisir une province —</option>
                {provinces.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Région <span className="required">*</span></label>
              <select
                value={form.regionId || ""}
                required
                disabled={!form.provinceId}
                onChange={e => handleRegionChange(Number(e.target.value))}
              >
                <option value="">
                  {!form.provinceId ? "Choisir d'abord une province" : "— Choisir une région —"}
                </option>
                {filteredRegions.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>District <span className="required">*</span></label>
              <select
                value={form.districtId || ""}
                required
                disabled={!form.regionId}
                onChange={e => set("districtId", Number(e.target.value))}
              >
                <option value="">
                  {!form.regionId ? "Choisir d'abord une région" : "— Choisir un district —"}
                </option>
                {filteredDistricts.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── Carte pleine largeur ── */}
        <div className="village-map-container">
          <div className="village-map-header">
            <MapPin size={14} />
            <span>Cliquez sur la carte pour positionner le village</span>
          </div>
          <div ref={mapRef} className="village-map" />
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="form-actions" style={{ justifyContent: "flex-end", background: "none", border: "none", boxShadow: "none", padding: "4px 0 24px" }}>
          <button type="button" className="btn-cancel" onClick={() => navigate("/villages")}>
            Annuler
          </button>
          <button type="submit" className="btn-primary" disabled={loading || !isValid}>
            {loading && <Loader2 size={14} className="spin" />}
            {isEdit ? "Enregistrer" : "Créer le village"}
          </button>
        </div>

      </form>
    </div>
  );
}