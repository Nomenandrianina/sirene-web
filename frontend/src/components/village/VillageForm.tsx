import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ChevronLeft, MapPin, Navigation } from "lucide-react";
import { provincesApi } from "@/services/province.api";
import { regionsApi }   from "@/services/region.api";
import { districtsApi } from "@/services/districts.api";
import { communesApi }  from "@/services/commune.api";
import { fokontanyApi } from "@/services/fokontany.api";
import type { Province }  from "@/types/province";
import type { Region }    from "@/types/region";
import type { District }  from "@/types/district";
import type { Commune }   from "@/types/commune";
import type { Fokontany } from "@/types/fokontany";

export interface VillageFormData {
  name:        string;
  latitude:    string;
  longitude:   string;
  provinceId:  number;
  regionId:    number;
  districtId:  number;
  communeId:   number;
  fokontanyId: number;
}

interface VillageFormProps {
  initialData?: Partial<VillageFormData> & { id?: number };
  onSubmit:     (data: VillageFormData) => Promise<void>;
  loading:      boolean;
  error?:       string;
}

// Madagascar centre
const DEFAULT_LAT  = -18.9249;
const DEFAULT_LNG  =  47.5185;
const DEFAULT_ZOOM = 6;

// ── Helpers ──────────────────────────────────────────────────────────────────
function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-700">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">{title}</h2>
      {children}
    </div>
  );
}

const selectCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 " +
  "focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent " +
  "disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed transition";

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 " +
  "placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 " +
  "focus:border-transparent transition";

// ─────────────────────────────────────────────────────────────────────────────

export function VillageForm({ initialData, onSubmit, loading, error }: VillageFormProps) {
  const isEdit   = !!initialData?.id;
  const navigate = useNavigate();
  const mapRef     = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<any>(null);
  const markerRef  = useRef<any>(null);

  const [form, setForm] = useState<VillageFormData>({
    name:        initialData?.name        ?? "",
    latitude:    initialData?.latitude    ?? "",
    longitude:   initialData?.longitude   ?? "",
    provinceId:  initialData?.provinceId  ?? 0,
    regionId:    initialData?.regionId    ?? 0,
    districtId:  initialData?.districtId  ?? 0,
    communeId:   initialData?.communeId   ?? 0,
    fokontanyId: initialData?.fokontanyId ?? 0,
  });

  const [latInput, setLatInput] = useState(initialData?.latitude  ?? "");
  const [lngInput, setLngInput] = useState(initialData?.longitude ?? "");

  // Sync édition async
  useEffect(() => {
    if (initialData?.id) {
      setForm({
        name:        initialData.name        ?? "",
        latitude:    initialData.latitude    ?? "",
        longitude:   initialData.longitude   ?? "",
        provinceId:  initialData.provinceId  ?? 0,
        regionId:    initialData.regionId    ?? 0,
        districtId:  initialData.districtId  ?? 0,
        communeId:   initialData.communeId   ?? 0,
        fokontanyId: initialData.fokontanyId ?? 0,
      });
      setLatInput(initialData.latitude  ?? "");
      setLngInput(initialData.longitude ?? "");
    }
  }, [initialData?.id]);

  const set = <K extends keyof VillageFormData>(k: K, v: VillageFormData[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  // ── Carte ──────────────────────────────────────────────────────────────────
  function moveMarker(latN: number, lngN: number) {
    if (!leafletRef.current || isNaN(latN) || isNaN(lngN)) return;
    import("leaflet").then(L => {
      const icon = L.divIcon({
        className: "",
        html: `<div style="width:20px;height:20px;background:#0284c7;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,.3)"></div>`,
        iconSize: [20, 20], iconAnchor: [10, 10],
      });
      if (markerRef.current) markerRef.current.setLatLng([latN, lngN]);
      else markerRef.current = L.marker([latN, lngN], { icon }).addTo(leafletRef.current);
      leafletRef.current.setView([latN, lngN], 13);
    });
  }

  function handleLatInput(val: string) {
    setLatInput(val); setForm(f => ({ ...f, latitude: val }));
    moveMarker(parseFloat(val), parseFloat(lngInput));
  }
  function handleLngInput(val: string) {
    setLngInput(val); setForm(f => ({ ...f, longitude: val }));
    moveMarker(parseFloat(latInput), parseFloat(val));
  }

  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return;
    const link = document.createElement("link");
    link.rel = "stylesheet"; link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    import("leaflet").then(L => {
      if (!mapRef.current || leafletRef.current) return;
      const initLat  = form.latitude  ? parseFloat(form.latitude)  : DEFAULT_LAT;
      const initLng  = form.longitude ? parseFloat(form.longitude) : DEFAULT_LNG;
      const initZoom = form.latitude  ? 13 : DEFAULT_ZOOM;
      const map = L.map(mapRef.current).setView([initLat, initLng], initZoom);
      leafletRef.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const icon = L.divIcon({
        className: "",
        html: `<div style="width:20px;height:20px;background:#0284c7;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,.3)"></div>`,
        iconSize: [20, 20], iconAnchor: [10, 10],
      });

      if (form.latitude && form.longitude) {
        markerRef.current = L.marker([initLat, initLng], { icon }).addTo(map);
      }

      map.on("click", (e: any) => {
        const { lat, lng } = e.latlng;
        const latStr = lat.toFixed(10); const lngStr = lng.toFixed(10);
        setLatInput(latStr); setLngInput(lngStr);
        setForm(f => ({ ...f, latitude: latStr, longitude: lngStr }));
        if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
        else markerRef.current = L.marker([lat, lng], { icon }).addTo(map);
      });
    });
    return () => {
      if (leafletRef.current) { leafletRef.current.remove(); leafletRef.current = null; markerRef.current = null; }
    };
  }, []);

  useEffect(() => {
    if (leafletRef.current && form.latitude && form.longitude) {
      const lat = parseFloat(form.latitude); const lng = parseFloat(form.longitude);
      if (!isNaN(lat) && !isNaN(lng)) leafletRef.current.setView([lat, lng], 13);
    }
  }, [initialData?.id]);

  const handleGeolocate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      const latStr = pos.coords.latitude.toFixed(10);
      const lngStr = pos.coords.longitude.toFixed(10);
      setLatInput(latStr); setLngInput(lngStr);
      setForm(f => ({ ...f, latitude: latStr, longitude: lngStr }));
      moveMarker(pos.coords.latitude, pos.coords.longitude);
    });
  };

  // ── Données géo ────────────────────────────────────────────────────────────
  const { data: rawProvinces } = useQuery({ queryKey: ["provinces"],  queryFn: provincesApi.getAll });
  const provinces: Province[] = Array.isArray(rawProvinces)  ? rawProvinces  : (rawProvinces  as any)?.data ?? [];

  const { data: rawRegions } = useQuery({ queryKey: ["regions"],    queryFn: regionsApi.getAll });
  const allRegions: Region[] = Array.isArray(rawRegions)    ? rawRegions    : (rawRegions    as any)?.data ?? [];

  const { data: rawDistricts } = useQuery({ queryKey: ["districts"],  queryFn: districtsApi.getAll });
  const allDistricts: District[] = Array.isArray(rawDistricts)  ? rawDistricts  : (rawDistricts  as any)?.data ?? [];

  const { data: rawCommunes } = useQuery({ queryKey: ["communes"],   queryFn: communesApi.getAll });
  const allCommunes: Commune[] = Array.isArray(rawCommunes)   ? rawCommunes   : (rawCommunes   as any)?.data ?? [];

  const { data: rawFokontany } = useQuery({ queryKey: ["fokontany"],  queryFn: fokontanyApi.getAll });
  const allFokontany: Fokontany[] = Array.isArray(rawFokontany)  ? rawFokontany  : (rawFokontany  as any)?.data ?? [];

  // ── Cascade ────────────────────────────────────────────────────────────────
  const filteredRegions = form.provinceId
    ? allRegions.filter(r => Number((r as any).province?.id ?? (r as any).provinceId) === Number(form.provinceId))
    : allRegions;

  const filteredDistricts = form.regionId
    ? allDistricts.filter(d => Number((d as any).region?.id ?? (d as any).regionId) === Number(form.regionId))
    : allDistricts;

  const filteredCommunes = form.districtId
    ? allCommunes.filter(c => Number((c as any).district?.id ?? (c as any).districtId) === Number(form.districtId))
    : allCommunes;

  const filteredFokontany = form.communeId
    ? allFokontany.filter(f => Number((f as any).commune?.id ?? (f as any).communeId) === Number(form.communeId))
    : allFokontany;

  const handleProvinceChange = (id: number) =>
    setForm(f => ({ ...f, provinceId: id, regionId: 0, districtId: 0, communeId: 0, fokontanyId: 0 }));
  const handleRegionChange   = (id: number) =>
    setForm(f => ({ ...f, regionId: id,   districtId: 0, communeId: 0, fokontanyId: 0 }));
  const handleDistrictChange = (id: number) =>
    setForm(f => ({ ...f, districtId: id, communeId: 0, fokontanyId: 0 }));
  const handleCommuneChange  = (id: number) =>
    setForm(f => ({ ...f, communeId: id,  fokontanyId: 0 }));

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      name:        form.name.trim(),
      latitude:    form.latitude,
      longitude:   form.longitude,
      provinceId:  Number(form.provinceId),
      regionId:    Number(form.regionId),
      districtId:  Number(form.districtId),
      communeId:   Number(form.communeId),
      fokontanyId: Number(form.fokontanyId),
    });
  };

  const isValid =
    form.name.trim() && form.latitude && form.longitude &&
    form.provinceId > 0 && form.regionId > 0 && form.districtId > 0 &&
    form.communeId  > 0 && form.fokontanyId > 0;

  // ── Rendu ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <button
          onClick={() => navigate("/villages")}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition mb-3"
        >
          <ChevronLeft size={15} /> Retour à la liste
        </button>
        <h1 className="text-xl font-semibold text-slate-900">
          {isEdit ? "Modifier le village" : "Nouveau village"}
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {isEdit ? "Modifiez les informations du village" : "Cliquez sur la carte pour positionner le village"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-6 py-8 flex flex-col gap-5">

        {/* ── Informations générales ── */}
        <SectionCard title="Informations">
          <Field label="Nom du village" required>
            <input
              type="text" placeholder="ex: Ambohimangakely"
              value={form.name} required autoFocus
              onChange={e => set("name", e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field
            label="Position GPS"
            required
            hint="Saisissez les coordonnées ou cliquez directement sur la carte"
          >
            <div className="flex gap-2 items-end">
              <div className="flex-1 flex flex-col gap-1">
                <span className="text-xs text-slate-400 uppercase tracking-wide">Latitude</span>
                <input
                  type="text" placeholder="-18.9249..."
                  value={latInput}
                  onChange={e => handleLatInput(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <span className="text-xs text-slate-400 uppercase tracking-wide">Longitude</span>
                <input
                  type="text" placeholder="47.5185..."
                  value={lngInput}
                  onChange={e => handleLngInput(e.target.value)}
                  className={inputCls}
                />
              </div>
              <button
                type="button"
                onClick={handleGeolocate}
                title="Ma position actuelle"
                className="flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-sky-600 transition flex-shrink-0"
              >
                <Navigation size={15} />
              </button>
            </div>
          </Field>
        </SectionCard>

        {/* ── Localisation cascade ── */}
        <SectionCard title="Localisation">

          {/* Breadcrumb visuel de la cascade */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs bg-slate-50 rounded-lg px-3 py-2">
            {[
              { label: "Province",   active: !!form.provinceId  },
              { label: "Région",     active: !!form.regionId    },
              { label: "District",   active: !!form.districtId  },
              { label: "Commune",    active: !!form.communeId   },
              { label: "Fokontany",  active: !!form.fokontanyId },
            ].map((step, i, arr) => (
              <span key={step.label} className="flex items-center gap-1.5">
                <span className={step.active ? "text-sky-600 font-semibold" : "text-slate-400"}>
                  {step.label}
                </span>
                {i < arr.length - 1 && <span className="text-slate-300">›</span>}
              </span>
            ))}
          </div>

          <Field label="Province" required>
            <select
              value={form.provinceId || ""}
              required
              onChange={e => handleProvinceChange(Number(e.target.value))}
              className={selectCls}
            >
              <option value="">— Choisir une province —</option>
              {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>

          <Field label="Région" required>
            <select
              value={form.regionId || ""}
              required
              disabled={!form.provinceId}
              onChange={e => handleRegionChange(Number(e.target.value))}
              className={selectCls}
            >
              <option value="">{!form.provinceId ? "Choisir d'abord une province" : "— Choisir une région —"}</option>
              {filteredRegions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </Field>

          <Field label="District" required>
            <select
              value={form.districtId || ""}
              required
              disabled={!form.regionId}
              onChange={e => handleDistrictChange(Number(e.target.value))}
              className={selectCls}
            >
              <option value="">{!form.regionId ? "Choisir d'abord une région" : "— Choisir un district —"}</option>
              {filteredDistricts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Field>

          <Field label="Commune" required>
            <select
              value={form.communeId || ""}
              required
              disabled={!form.districtId}
              onChange={e => handleCommuneChange(Number(e.target.value))}
              className={selectCls}
            >
              <option value="">{!form.districtId ? "Choisir d'abord un district" : "— Choisir une commune —"}</option>
              {filteredCommunes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>

          <Field label="Fokontany" required>
            <select
              value={form.fokontanyId || ""}
              required
              disabled={!form.communeId}
              onChange={e => set("fokontanyId", Number(e.target.value))}
              className={selectCls}
            >
              <option value="">{!form.communeId ? "Choisir d'abord une commune" : "— Choisir un fokontany —"}</option>
              {filteredFokontany.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </Field>
        </SectionCard>

        {/* ── Carte Leaflet ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 text-sm text-slate-500">
            <MapPin size={14} className="text-sky-500" />
            <span>Cliquez sur la carte pour positionner le village</span>
          </div>
          <div ref={mapRef} className="w-full h-72" />
        </div>

        {/* Erreur */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <button
            type="button"
            onClick={() => navigate("/villages")}
            className="px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading || !isValid}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {isEdit ? "Enregistrer" : "Créer le village"}
          </button>
        </div>

      </form>
    </div>
  );
}