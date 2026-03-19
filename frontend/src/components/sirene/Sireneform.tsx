import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { villagesApi } from "@/services/village.api";
import { customersApi } from "@/services/customers.api";
import { provincesApi } from "@/services/province.api";
import { regionsApi }   from "@/services/region.api";
import { districtsApi } from "@/services/districts.api";
import { CreateSireneDto } from "@/services/sirene.api";
import { ChevronLeft, Loader2, MapPin, Navigation, X, Search } from "lucide-react";
import "@/styles/sirene-form.css";

const DEFAULT_LAT  = -18.9249;
const DEFAULT_LNG  =  47.5185;
const DEFAULT_ZOOM = 6;
const PHONE_MAX    = 13;

export interface SireneFormData extends CreateSireneDto {}

interface SireneFormProps {
  initialData?: Partial<SireneFormData> & { id?: number };
  onSubmit:  (data: SireneFormData) => Promise<void>;
  loading:   boolean;
  error?:    string;
}

export function SireneForm({ initialData, onSubmit, loading, error }: SireneFormProps) {
  const isEdit   = !!initialData?.id;
  const navigate = useNavigate();

  const mapRef     = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<any>(null);
  const markerRef  = useRef<any>(null);

  const [provinceId, setProvinceId] = useState<number>(0);
  const [regionId,   setRegionId]   = useState<number>(0);
  const [districtId, setDistrictId] = useState<number>(0);

  // Recherche dans les selects
  const [regionSearch,   setRegionSearch]   = useState("");
  const [districtSearch, setDistrictSearch] = useState("");
  const [villageSearch,  setVillageSearch]  = useState("");

  const [form, setForm] = useState<SireneFormData>({
    name:             initialData?.name             ?? "",
    imei:             initialData?.imei             ?? "",
    latitude:         initialData?.latitude         ?? "",
    longitude:        initialData?.longitude        ?? "",
    phoneNumberBrain: initialData?.phoneNumberBrain ?? "",
    phoneNumberRelai: initialData?.phoneNumberRelai ?? "",
    villageId:        initialData?.villageId        ?? 0,
    isActive:         initialData?.isActive         ?? 1,
    customerIds:      initialData?.customerIds      ?? [],
  });

  const [latInput, setLatInput] = useState(initialData?.latitude  ?? "");
  const [lngInput, setLngInput] = useState(initialData?.longitude ?? "");

  // Validation téléphone
  const [phoneErrors, setPhoneErrors] = useState({ brain: "", relai: "" });

  const set = <K extends keyof SireneFormData>(k: K, v: SireneFormData[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (initialData?.id) {
      setForm({
        name:             initialData.name             ?? "",
        imei:             initialData.imei             ?? "",
        latitude:         initialData.latitude         ?? "",
        longitude:        initialData.longitude        ?? "",
        phoneNumberBrain: initialData.phoneNumberBrain ?? "",
        phoneNumberRelai: initialData.phoneNumberRelai ?? "",
        villageId:        initialData.villageId        ?? 0,
        isActive:         initialData.isActive         ?? 1,
        customerIds:      initialData.customerIds      ?? [],
      });
      setLatInput(initialData.latitude  ?? "");
      setLngInput(initialData.longitude ?? "");
    }
  }, [initialData?.id]);

  useEffect(() => {
    if (leafletRef.current && initialData?.latitude && initialData?.longitude) {
      const lat = parseFloat(initialData.latitude as string);
      const lng = parseFloat(initialData.longitude as string);
      if (!isNaN(lat) && !isNaN(lng)) leafletRef.current.setView([lat, lng], 13);
    }
  }, [initialData?.id]);

  // Données
  const { data: rawProvinces } = useQuery({ queryKey: ["provinces"], queryFn: () => provincesApi.getAll() });
  const { data: rawRegions }   = useQuery({ queryKey: ["regions"],   queryFn: () => regionsApi.getAll() });
  const { data: rawDistricts } = useQuery({ queryKey: ["districts"], queryFn: () => districtsApi.getAll() });
  const { data: rawVillages }  = useQuery({ queryKey: ["villages"],  queryFn: () => villagesApi.getAll() });
  const { data: rawCustomers } = useQuery({ queryKey: ["customers"], queryFn: () => customersApi.getAll() });

  const toArr = (raw: any) => Array.isArray(raw) ? raw : raw?.response ?? raw?.data ?? [];
  const provinces    = toArr(rawProvinces);
  const allRegions   = toArr(rawRegions);
  const allDistricts = toArr(rawDistricts);
  const allVillages  = toArr(rawVillages);
  const customers    = toArr(rawCustomers);

  // Cascade + recherche
  const filteredRegions = useMemo(() => {
    const base = provinceId ? allRegions.filter((r: any) => Number(r.province?.id ?? r.provinceId) === provinceId) : allRegions;
    return regionSearch ? base.filter((r: any) => r.name.toLowerCase().includes(regionSearch.toLowerCase())) : base;
  }, [allRegions, provinceId, regionSearch]);

  const filteredDistricts = useMemo(() => {
    const base = regionId ? allDistricts.filter((d: any) => Number(d.region?.id ?? d.regionId) === regionId) : allDistricts;
    return districtSearch ? base.filter((d: any) => d.name.toLowerCase().includes(districtSearch.toLowerCase())) : base;
  }, [allDistricts, regionId, districtSearch]);

  const filteredVillages = useMemo(() => {
    const base = districtId ? allVillages.filter((v: any) => Number(v.district?.id ?? v.districtId) === districtId) : allVillages;
    return villageSearch ? base.filter((v: any) => v.name.toLowerCase().includes(villageSearch.toLowerCase())) : base;
  }, [allVillages, districtId, villageSearch]);

  const handleProvinceChange = (id: number) => {
    setProvinceId(id); setRegionId(0); setDistrictId(0); set("villageId", 0);
    setRegionSearch(""); setDistrictSearch(""); setVillageSearch("");
  };
  const handleRegionChange = (id: number) => {
    setRegionId(id); setDistrictId(0); set("villageId", 0);
    setDistrictSearch(""); setVillageSearch("");
  };
  const handleDistrictChange = (id: number) => {
    setDistrictId(id); set("villageId", 0);
    setVillageSearch("");
  };

  // ── Validation téléphone ──
  function validatePhone(brain: string, relai: string) {
    const errors = { brain: "", relai: "" };
    if (brain && brain.length > PHONE_MAX)
      errors.brain = `Maximum ${PHONE_MAX} caractères`;
    if (relai && relai.length > PHONE_MAX)
      errors.relai = `Maximum ${PHONE_MAX} caractères`;
    if (brain && relai && brain === relai)
      errors.relai = "Le numéro Relai doit être différent du numéro Brain";
    setPhoneErrors(errors);
    return !errors.brain && !errors.relai;
  }

  function handleBrainChange(val: string) {
    if (val.length > PHONE_MAX) return; // bloquer saisie au-delà
    set("phoneNumberBrain", val);
    validatePhone(val, form.phoneNumberRelai ?? "");
  }

  function handleRelaiChange(val: string) {
    if (val.length > PHONE_MAX) return;
    set("phoneNumberRelai", val);
    validatePhone(form.phoneNumberBrain ?? "", val);
  }

  // ── GPS ──
  function moveMarker(latN: number, lngN: number) {
    if (!leafletRef.current || isNaN(latN) || isNaN(lngN)) return;
    import("leaflet").then(L => {
      const icon = L.divIcon({ className: "", html: `<div class="map-marker-pin"></div>`, iconSize: [28,28], iconAnchor: [14,28] });
      if (markerRef.current) markerRef.current.setLatLng([latN, lngN]);
      else markerRef.current = L.marker([latN, lngN], { icon }).addTo(leafletRef.current);
      leafletRef.current.setView([latN, lngN], 13);
    });
  }

  function applyGps(lat: string, lng: string) {
    setLatInput(lat); setLngInput(lng);
    set("latitude", lat); set("longitude", lng);
    moveMarker(parseFloat(lat), parseFloat(lng));
  }

  function handleLatInput(val: string) {
    setLatInput(val); set("latitude", val);
    moveMarker(parseFloat(val), parseFloat(lngInput));
  }

  function handleLngInput(val: string) {
    setLngInput(val); set("longitude", val);
    moveMarker(parseFloat(latInput), parseFloat(val));
  }

  // ── Init Leaflet ──
  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return;
    const link = document.createElement("link");
    link.rel  = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    import("leaflet").then(L => {
      if (!mapRef.current || leafletRef.current) return;
      const initLat  = latInput ? parseFloat(latInput) : DEFAULT_LAT;
      const initLng  = lngInput ? parseFloat(lngInput) : DEFAULT_LNG;
      const initZoom = latInput ? 13 : DEFAULT_ZOOM;
      const map = L.map(mapRef.current).setView([initLat, initLng], initZoom);
      leafletRef.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
      const icon = L.divIcon({ className: "", html: `<div class="map-marker-pin"></div>`, iconSize: [28,28], iconAnchor: [14,28] });
      if (latInput && lngInput) markerRef.current = L.marker([initLat, initLng], { icon }).addTo(map);
      map.on("click", (e: any) => applyGps(e.latlng.lat.toFixed(10), e.latlng.lng.toFixed(10)));
    });
    return () => { if (leafletRef.current) { leafletRef.current.remove(); leafletRef.current = null; markerRef.current = null; } };
  }, []);

  const handleGeolocate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos =>
      applyGps(pos.coords.latitude.toFixed(10), pos.coords.longitude.toFixed(10))
    );
  };

  // ── Clients ──
  function toggleCustomer(cid: number) {
    setForm(f => ({
      ...f,
      customerIds: f.customerIds?.includes(cid)
        ? f.customerIds.filter(x => x !== cid)
        : [...(f.customerIds ?? []), cid],
    }));
  }

  function removeCustomer(cid: number) {
    setForm(f => ({ ...f, customerIds: f.customerIds?.filter(x => x !== cid) ?? [] }));
  }

  function clearAllCustomers() {
    setForm(f => ({ ...f, customerIds: [] }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const valid = validatePhone(form.phoneNumberBrain ?? "", form.phoneNumberRelai ?? "");
    if (!valid) return;
    await onSubmit(form);
  }

  const selectedCustomers = customers.filter((c: any) => form.customerIds?.includes(c.id));

  return (
    <div className="sirene-form-page">

      <div className="sirene-page-header">
        <button className="btn-back" onClick={() => navigate("/sirenes")}>
          <ChevronLeft size={16} /> Retour à la liste
        </button>
        <h1 className="sirene-title">{isEdit ? "Modifier la sirène" : "Nouvelle sirène"}</h1>
        <p className="sirene-subtitle">
          {isEdit ? "Modifiez les informations de la sirène" : "Remplissez le formulaire et positionnez la sirène sur la carte"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="sirene-form-layout">

        {/* ── Informations ── */}
        <div className="sirene-form-card">
          <div className="sirene-section-title">Informations</div>
          <div className="sirene-fields-grid">
            <div className="sirene-field">
              <div className="sirene-field">
                <label>Désignation</label>
                <input value={form.name ?? ""} onChange={e => set("name", e.target.value)} placeholder="Sirène"  />
              </div>
              <label>Statut</label>
              <select value={form.isActive} onChange={e => set("isActive", Number(e.target.value))}>
                <option value={1}>Active</option>
                <option value={0}>Inactive</option>
              </select>
            </div>

            <div className="sirene-field">
              <label>IMEI</label>
              <input value={form.imei ?? ""} onChange={e => set("imei", e.target.value)} placeholder="Ex: 356938035643809" />
            </div>

            {/* Brain */}
            <div className="sirene-field ">
              <label>
                Numéro Brain
                <span className="phone-counter" style={{ color: (form.phoneNumberBrain?.length ?? 0) >= PHONE_MAX ? "#dc2626" : "#94a3b8" }}>
                  {" "}{form.phoneNumberBrain?.length ?? 0}/{PHONE_MAX}
                </span>
              </label>
              <input
                value={form.phoneNumberBrain ?? ""}
                onChange={e => handleBrainChange(e.target.value)}
                placeholder="+261340533456"
                className={phoneErrors.brain ? "input-error" : ""}
              />
              {phoneErrors.brain && <span className="field-error">{phoneErrors.brain}</span>}
            </div>

            {/* Relai */}
            <div className="sirene-field">
              <label>
                Numéro Relai
                <span className="phone-counter" style={{ color: (form.phoneNumberRelai?.length ?? 0) >= PHONE_MAX ? "#dc2626" : "#94a3b8" }}>
                  {" "}{form.phoneNumberRelai?.length ?? 0}/{PHONE_MAX}
                </span>
              </label>
              <input
                value={form.phoneNumberRelai ?? ""}
                onChange={e => handleRelaiChange(e.target.value)}
                placeholder="+261340533456"
                className={phoneErrors.relai ? "input-error" : ""}
              />
              {phoneErrors.relai && <span className="field-error">{phoneErrors.relai}</span>}
            </div>
          </div>
        </div>

        {/* ── Localisation avec recherche ── */}
        <div className="sirene-form-card">
          <div className="sirene-section-title">Localisation</div>
          <div className="sirene-location-grid">

            {/* Province — pas de recherche car peu d'éléments */}
            <div className="sirene-field">
              <label>Province</label>
              <select value={provinceId || ""} onChange={e => handleProvinceChange(Number(e.target.value))}>
                <option value="">— Toutes les provinces —</option>
                {provinces.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            {/* Région avec recherche */}
            <div className="sirene-field">
              <label>Région</label>
              <div className="select-search-wrap">
                <div className="select-search-input-wrap">
                  <Search size={13} className="select-search-icon" />
                  <input
                    className="select-search-input"
                    placeholder="Rechercher une région…"
                    value={regionSearch}
                    disabled={!provinceId}
                    onChange={e => setRegionSearch(e.target.value)}
                  />
                </div>
                <select
                  value={regionId || ""}
                  disabled={!provinceId}
                  size={filteredRegions.length > 0 ? Math.min(filteredRegions.length + 1, 5) : 2}
                  onChange={e => handleRegionChange(Number(e.target.value))}
                  className="select-scrollable"
                >
                  <option value="">{!provinceId ? "Choisir d'abord une province" : "— Toutes —"}</option>
                  {filteredRegions.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
            </div>

            {/* District avec recherche */}
            <div className="sirene-field">
              <label>District</label>
              <div className="select-search-wrap">
                <div className="select-search-input-wrap">
                  <Search size={13} className="select-search-icon" />
                  <input
                    className="select-search-input"
                    placeholder="Rechercher un district…"
                    value={districtSearch}
                    disabled={!regionId}
                    onChange={e => setDistrictSearch(e.target.value)}
                  />
                </div>
                <select
                  value={districtId || ""}
                  disabled={!regionId}
                  size={filteredDistricts.length > 0 ? Math.min(filteredDistricts.length + 1, 5) : 2}
                  onChange={e => handleDistrictChange(Number(e.target.value))}
                  className="select-scrollable"
                >
                  <option value="">{!regionId ? "Choisir d'abord une région" : "— Tous —"}</option>
                  {filteredDistricts.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            </div>

            {/* Village avec recherche */}
            <div className="sirene-field">
              <label>Village <span className="required">*</span></label>
              <div className="select-search-wrap">
                <div className="select-search-input-wrap">
                  <Search size={13} className="select-search-icon" />
                  <input
                    className="select-search-input"
                    placeholder="Rechercher un village…"
                    value={villageSearch}
                    onChange={e => setVillageSearch(e.target.value)}
                  />
                </div>
                <select
                  value={form.villageId}
                  required
                  size={filteredVillages.length > 0 ? Math.min(filteredVillages.length + 1, 5) : 2}
                  onChange={e => set("villageId", Number(e.target.value))}
                  className="select-scrollable"
                >
                  <option value={0}>— Sélectionner un village —</option>
                  {filteredVillages.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
            </div>

          </div>
        </div>

        {/* ── GPS ── */}
        <div className="sirene-form-card">
          <div className="sirene-section-title"><MapPin size={13} /> Position GPS</div>
          <div className="sirene-gps-row">
            <div className="sirene-field">
              <label>Latitude</label>
              <input type="text" value={latInput} onChange={e => handleLatInput(e.target.value)} placeholder="-18.9249..." />
            </div>
            <div className="sirene-field">
              <label>Longitude</label>
              <input type="text" value={lngInput} onChange={e => handleLngInput(e.target.value)} placeholder="47.5185..." />
            </div>
            <button type="button" className="btn-geolocate" onClick={handleGeolocate} title="Ma position">
              <Navigation size={15} />
            </button>
          </div>
          <p className="sirene-gps-hint">Saisissez les coordonnées ou cliquez directement sur la carte</p>
        </div>

        {/* ── Clients ── */}
        <div className="sirene-form-card">
          <div className="sirene-section-title" style={{ justifyContent: "space-between" }}>
            <span>Clients associés</span>
            {selectedCustomers.length > 0 && (
              <button type="button" className="btn-clear-all" onClick={clearAllCustomers}>
                <X size={12} /> Tout désélectionner
              </button>
            )}
          </div>

          {/* Tags clients sélectionnés */}
          {selectedCustomers.length > 0 && (
            <div className="selected-customers-tags">
              {selectedCustomers.map((c: any) => (
                <span key={c.id} className="customer-tag">
                  {c.name}
                  <button type="button" onClick={() => removeCustomer(c.id)} className="tag-remove">
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {customers.length === 0 ? (
            <p style={{ color: "#94a3b8", fontSize: "0.82rem", margin: 0 }}>Aucun client disponible</p>
          ) : (
            <div className="sirene-customers-grid">
              {customers.map((c: any) => (
                <label key={c.id} className={`sirene-customer-chip ${form.customerIds?.includes(c.id) ? "checked" : ""}`}>
                  <input type="checkbox" checked={form.customerIds?.includes(c.id) ?? false} onChange={() => toggleCustomer(c.id)} />
                  <span className="chip-dot" />
                  {c.name}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* ── Carte ── */}
        <div className="sirene-map-container">
          <div className="sirene-map-header">
            <MapPin size={13} />
            <span>Cliquez sur la carte pour positionner la sirène</span>
          </div>
          <div ref={mapRef} className="sirene-map-canvas" />
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="sirene-form-actions">
          <button type="button" className="btn-cancel" onClick={() => navigate("/sirenes")}>Annuler</button>
          <button type="submit" className="btn-primary"
            disabled={loading || !form.villageId || !!phoneErrors.brain || !!phoneErrors.relai}>
            {loading && <Loader2 size={14} className="spin" />}
            {isEdit ? "Enregistrer" : "Créer la sirène"}
          </button>
        </div>

      </form>
    </div>
  );
}