import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { villagesApi }  from "@/services/village.api";
import { customersApi } from "@/services/customers.api";
import { provincesApi } from "@/services/province.api";
import { regionsApi }   from "@/services/region.api";
import { districtsApi } from "@/services/districts.api";
import { communesApi }  from "@/services/commune.api";
import { fokontanyApi } from "@/services/fokontany.api";
import { CreateSireneDto } from "@/services/sirene.api";
import { ChevronLeft, Loader2, MapPin, Navigation, X, Search } from "lucide-react";

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

// ── Helpers UI ────────────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
        {title}
      </div>
      {children}
    </div>
  );
}

function Field({ label, required, counter, error, children }: {
  label: string; required?: boolean; counter?: React.ReactNode;
  error?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {counter}
      </div>
      {children}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 " +
  "placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 " +
  "focus:border-transparent transition";

const inputErrCls =
  "w-full rounded-lg border border-red-300 bg-white px-3 py-2.5 text-sm text-slate-800 " +
  "placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-400 " +
  "focus:border-transparent transition";

const selectCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 " +
  "focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent " +
  "disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed transition";

// ── SelectWithSearch : dropdown qui s'ouvre au clic ──────────────────────────

interface SelectWithSearchProps {
  placeholder:  string;
  searchValue:  string;
  onSearch:     (v: string) => void;
  selectValue:  number | string;
  onSelect:     (id: number) => void;
  items:        { id: number; name: string }[];
  disabled?:    boolean;
  disabledMsg?: string;
  required?:    boolean;
}

function SelectWithSearch({
  placeholder, searchValue, onSearch,
  selectValue, onSelect, items,
  disabled = false, disabledMsg,
}: SelectWithSearchProps) {
  const [open, setOpen] = useState(false);
  const ref      = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedLabel = items.find(i => i.id === Number(selectValue))?.name;

  // Fermer en cliquant dehors
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        onSearch("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Focus input quand on ouvre
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 40);
  }, [open]);

  function handleSelect(id: number) {
    onSelect(id);
    setOpen(false);
    onSearch("");
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onSelect(0);
    onSearch("");
  }

  const triggerCls = [
    "w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border text-sm transition text-left",
    disabled
      ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
      : open
        ? "border-sky-400 bg-white ring-2 ring-sky-100 shadow-sm"
        : "border-slate-200 bg-white hover:border-slate-300 cursor-pointer",
  ].join(" ");

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        className={triggerCls}
      >
        <span className={selectedLabel ? "text-slate-800" : "text-slate-400"}>
          {disabled && disabledMsg
            ? disabledMsg
            : selectedLabel ?? placeholder}
        </span>
        <span className="flex items-center gap-1 flex-shrink-0">
          {selectedLabel && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={e => e.key === "Enter" && handleClear(e as any)}
              className="text-slate-300 hover:text-slate-500 transition"
            >
              <X size={12} />
            </span>
          )}
          <Search size={13} className={open ? "text-sky-500" : "text-slate-400"} />
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
          {/* Recherche */}
          <div className="px-2 pt-2 pb-1.5">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={searchValue}
                onChange={e => onSearch(e.target.value)}
                placeholder={`Rechercher…`}
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
              />
              {searchValue && (
                <button type="button" onClick={() => onSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={11} />
                </button>
              )}
            </div>
          </div>

          {/* Liste */}
          <div className="max-h-48 overflow-y-auto border-t border-slate-100">
            {items.length === 0 ? (
              <div className="px-4 py-5 text-center text-sm text-slate-400">
                {searchValue ? `Aucun résultat pour « ${searchValue} »` : "Aucun élément disponible"}
              </div>
            ) : (
              items.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  className={[
                    "w-full text-left px-4 py-2 text-sm transition",
                    Number(selectValue) === item.id
                      ? "bg-sky-50 text-sky-700 font-medium"
                      : "text-slate-700 hover:bg-slate-50",
                  ].join(" ")}
                >
                  {item.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SireneForm
// ═════════════════════════════════════════════════════════════════════════════

export function SireneForm({ initialData, onSubmit, loading, error }: SireneFormProps) {
  const isEdit   = !!initialData?.id;
  const navigate = useNavigate();

  const mapRef     = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<any>(null);
  const markerRef  = useRef<any>(null);

  // ── États cascade ──────────────────────────────────────────────────────────
  const [provinceId,  setProvinceId]  = useState<number>(0);
  const [regionId,    setRegionId]    = useState<number>(0);
  const [districtId,  setDistrictId]  = useState<number>(0);
  const [communeId,   setCommuneId]   = useState<number>(0);
  const [fokontanyId, setFokontanyId] = useState<number>(0);

  // Recherches
  const [regionSearch,    setRegionSearch]    = useState("");
  const [districtSearch,  setDistrictSearch]  = useState("");
  const [communeSearch,   setCommuneSearch]   = useState("");
  const [fokontanySearch, setFokontanySearch] = useState("");
  const [villageSearch,   setVillageSearch]   = useState("");

  // ── Formulaire ─────────────────────────────────────────────────────────────
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
    communicationType: initialData?.communicationType ?? "SMS", 
  });

  const [latInput, setLatInput] = useState(initialData?.latitude  ?? "");
  const [lngInput, setLngInput] = useState(initialData?.longitude ?? "");
  const [phoneErrors, setPhoneErrors] = useState({ brain: "", relai: "" });

  const set = <K extends keyof SireneFormData>(k: K, v: SireneFormData[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  // Sync édition async
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
        communicationType: initialData.communicationType ?? "SMS", 
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

  // ── Données ────────────────────────────────────────────────────────────────
  const { data: rawProvinces }  = useQuery({ queryKey: ["provinces"],  queryFn: () => provincesApi.getAll() });
  const { data: rawRegions }    = useQuery({ queryKey: ["regions"],    queryFn: () => regionsApi.getAll() });
  const { data: rawDistricts }  = useQuery({ queryKey: ["districts"],  queryFn: () => districtsApi.getAll() });
  const { data: rawCommunes }   = useQuery({ queryKey: ["communes"],   queryFn: () => communesApi.getAll() });
  const { data: rawFokontany }  = useQuery({ queryKey: ["fokontany"],  queryFn: () => fokontanyApi.getAll() });
  const { data: rawVillages }   = useQuery({ queryKey: ["villages"],   queryFn: () => villagesApi.getAll() });
  const { data: rawCustomers }  = useQuery({ queryKey: ["customers"],  queryFn: () => customersApi.getAll() });

  const toArr = (raw: any) => Array.isArray(raw) ? raw : raw?.response ?? raw?.data ?? [];
  const provinces    = toArr(rawProvinces);
  const allRegions   = toArr(rawRegions);
  const allDistricts = toArr(rawDistricts);
  const allCommunes  = toArr(rawCommunes);
  const allFokontany = toArr(rawFokontany);
  const allVillages  = toArr(rawVillages);
  const customers    = toArr(rawCustomers);

  // ── Cascade + recherche ───────────────────────────────────────────────────
  const filteredRegions = useMemo(() => {
    const base = provinceId
      ? allRegions.filter((r: any) => Number(r.province?.id ?? r.provinceId) === provinceId)
      : allRegions;
    return regionSearch
      ? base.filter((r: any) => r.name.toLowerCase().includes(regionSearch.toLowerCase()))
      : base;
  }, [allRegions, provinceId, regionSearch]);

  const filteredDistricts = useMemo(() => {
    const base = regionId
      ? allDistricts.filter((d: any) => Number(d.region?.id ?? d.regionId) === regionId)
      : allDistricts;
    return districtSearch
      ? base.filter((d: any) => d.name.toLowerCase().includes(districtSearch.toLowerCase()))
      : base;
  }, [allDistricts, regionId, districtSearch]);

  const filteredCommunes = useMemo(() => {
    const base = districtId
      ? allCommunes.filter((c: any) => Number(c.district?.id ?? c.districtId) === districtId)
      : allCommunes;
    return communeSearch
      ? base.filter((c: any) => c.name.toLowerCase().includes(communeSearch.toLowerCase()))
      : base;
  }, [allCommunes, districtId, communeSearch]);

  const filteredFokontany = useMemo(() => {
    const base = communeId
      ? allFokontany.filter((f: any) => Number(f.commune?.id ?? f.communeId) === communeId)
      : allFokontany;
    return fokontanySearch
      ? base.filter((f: any) => f.name.toLowerCase().includes(fokontanySearch.toLowerCase()))
      : base;
  }, [allFokontany, communeId, fokontanySearch]);

  const filteredVillages = useMemo(() => {
    const base = fokontanyId
      ? allVillages.filter((v: any) => Number(v.fokontany?.id ?? v.fokontanyId) === fokontanyId)
      : districtId
        ? allVillages.filter((v: any) => Number(v.district?.id ?? v.districtId) === districtId)
        : allVillages;
    return villageSearch
      ? base.filter((v: any) => v.name.toLowerCase().includes(villageSearch.toLowerCase()))
      : base;
  }, [allVillages, fokontanyId, districtId, villageSearch]);

  // ── Handlers cascade ──────────────────────────────────────────────────────
  function handleProvinceChange(id: number) {
    setProvinceId(id); setRegionId(0); setDistrictId(0); setCommuneId(0); setFokontanyId(0); set("villageId", 0);
    setRegionSearch(""); setDistrictSearch(""); setCommuneSearch(""); setFokontanySearch(""); setVillageSearch("");
  }
  function handleRegionChange(id: number) {
    setRegionId(id); setDistrictId(0); setCommuneId(0); setFokontanyId(0); set("villageId", 0);
    setDistrictSearch(""); setCommuneSearch(""); setFokontanySearch(""); setVillageSearch("");
  }
  function handleDistrictChange(id: number) {
    setDistrictId(id); setCommuneId(0); setFokontanyId(0); set("villageId", 0);
    setCommuneSearch(""); setFokontanySearch(""); setVillageSearch("");
  }
  function handleCommuneChange(id: number) {
    setCommuneId(id); setFokontanyId(0); set("villageId", 0);
    setFokontanySearch(""); setVillageSearch("");
  }
  function handleFokontanyChange(id: number) {
    setFokontanyId(id); set("villageId", 0);
    setVillageSearch("");
  }

  // ── Téléphone ─────────────────────────────────────────────────────────────
  function validatePhone(brain: string, relai: string) {
    const errors = { brain: "", relai: "" };
    if (brain && brain.length > PHONE_MAX) errors.brain = `Maximum ${PHONE_MAX} caractères`;
    if (relai && relai.length > PHONE_MAX) errors.relai = `Maximum ${PHONE_MAX} caractères`;
    if (brain && relai && brain === relai)  errors.relai = "Le numéro Relai doit être différent du numéro Brain";
    setPhoneErrors(errors);
    return !errors.brain && !errors.relai;
  }

  function handleBrainChange(val: string) {
    if (val.length > PHONE_MAX) return;
    set("phoneNumberBrain", val);
    validatePhone(val, form.phoneNumberRelai ?? "");
  }
  function handleRelaiChange(val: string) {
    if (val.length > PHONE_MAX) return;
    set("phoneNumberRelai", val);
    validatePhone(form.phoneNumberBrain ?? "", val);
  }

  // ── GPS ───────────────────────────────────────────────────────────────────
  function moveMarker(latN: number, lngN: number) {
    if (!leafletRef.current || isNaN(latN) || isNaN(lngN)) return;
    import("leaflet").then(L => {
      const icon = L.divIcon({
        className: "",
        html: `<div style="width:18px;height:18px;background:#0284c7;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,.3)"></div>`,
        iconSize: [18, 18], iconAnchor: [9, 9],
      });
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
      const map = L.map(mapRef.current).setView([initLat, initLng], latInput ? 13 : DEFAULT_ZOOM);
      leafletRef.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);

      const icon = L.divIcon({
        className: "",
        html: `<div style="width:18px;height:18px;background:#0284c7;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,.3)"></div>`,
        iconSize: [18, 18], iconAnchor: [9, 9],
      });
      if (latInput && lngInput) markerRef.current = L.marker([initLat, initLng], { icon }).addTo(map);
      map.on("click", (e: any) => applyGps(e.latlng.lat.toFixed(10), e.latlng.lng.toFixed(10)));
    });
    return () => {
      if (leafletRef.current) { leafletRef.current.remove(); leafletRef.current = null; markerRef.current = null; }
    };
  }, []);

  const handleGeolocate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos =>
      applyGps(pos.coords.latitude.toFixed(10), pos.coords.longitude.toFixed(10))
    );
  };

  // ── Clients ───────────────────────────────────────────────────────────────
  function toggleCustomer(cid: number) {
    setForm(f => ({
      ...f,
      customerIds: f.customerIds?.includes(cid)
        ? f.customerIds.filter(x => x !== cid)
        : [...(f.customerIds ?? []), cid],
    }));
  }
  const selectedCustomers = customers.filter((c: any) => form.customerIds?.includes(c.id));

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validatePhone(form.phoneNumberBrain ?? "", form.phoneNumberRelai ?? "")) return;
    await onSubmit(form);
  }

  // ── Breadcrumb localisation ───────────────────────────────────────────────
  const locSteps = [
    { label: "Province",  done: !!provinceId  },
    { label: "Région",    done: !!regionId    },
    { label: "District",  done: !!districtId  },
    { label: "Commune",   done: !!communeId   },
    { label: "Fokontany", done: !!fokontanyId },
    { label: "Village",   done: !!form.villageId },
  ];

  // ─────────────────────────────────────────────────────────────────────────

  return (
  <div className="min-h-full bg-slate-50 pb-10">

      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-200 px-4 py-4">
        <button
          onClick={() => navigate("/sirenes")}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition mb-3"
        >
          <ChevronLeft size={15} /> Retour à la liste
        </button>
        <h1 className="text-xl font-semibold text-slate-900">
          {isEdit ? "Modifier la sirène" : "Nouvelle sirène"}
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {isEdit ? "Modifiez les informations de la sirène" : "Remplissez le formulaire et positionnez la sirène sur la carte"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-7xl mx-auto px-3 py-5 flex flex-col gap-4">

        {/* ── Informations ── */}
        <SectionCard title="Informations">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <Field label="Désignation">
              <input
                value={form.name ?? ""}
                onChange={e => set("name", e.target.value)}
                placeholder="Sirène"
                required
                className={inputCls}
              />
            </Field>

            <Field label="Statut">
              <select
                value={form.isActive}
                onChange={e => set("isActive", Number(e.target.value))}
                className={selectCls}
              >
                <option value={1}>Active</option>
                <option value={0}>Inactive</option>
              </select>
            </Field>

            <Field label="IMEI">
              <input
                value={form.imei ?? ""}
                onChange={e => set("imei", e.target.value)}
                placeholder="Ex: 356938035643809"
                required
                className={inputCls}
              />
            </Field>

            {/* Spacer */}
            <div />

            <Field
              label="Numéro Brain"
              error={phoneErrors.brain}
              counter={
                <span className={`text-xs tabular-nums ${(form.phoneNumberBrain?.length ?? 0) >= PHONE_MAX ? "text-red-500" : "text-slate-400"}`}>
                  {form.phoneNumberBrain?.length ?? 0}/{PHONE_MAX}
                </span>
              }
            >
              <input
                value={form.phoneNumberBrain ?? ""}
                onChange={e => handleBrainChange(e.target.value)}
                placeholder="+261340533456"
                className={phoneErrors.brain ? inputErrCls : inputCls}
              />
            </Field>

            <Field
              label="Numéro Relai"
              error={phoneErrors.relai}
              counter={
                <span className={`text-xs tabular-nums ${(form.phoneNumberRelai?.length ?? 0) >= PHONE_MAX ? "text-red-500" : "text-slate-400"}`}>
                  {form.phoneNumberRelai?.length ?? 0}/{PHONE_MAX}
                </span>
              }
            >
              <input
                value={form.phoneNumberRelai ?? ""}
                onChange={e => handleRelaiChange(e.target.value)}
                placeholder="+261340533456"
                className={phoneErrors.relai ? inputErrCls : inputCls}
              />
            </Field>

            <Field label="Type de communication">
              <div className="flex gap-2">
                {(["SMS", "DATA"] as const).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => set("communicationType", type)}
                    className={[
                      "flex-1 py-2.5 rounded-lg border text-sm font-medium transition",
                      form.communicationType === type
                        ? "bg-sky-600 border-sky-600 text-white shadow-sm"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300",
                    ].join(" ")}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </Field>

          </div>
        </SectionCard>

        {/* ── Localisation ── */}
        <SectionCard title="Localisation">

          {/* Breadcrumb visuel de progression */}
          <div className="flex flex-wrap items-center gap-1 text-xs bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
            {locSteps.map((s, i, arr) => (
              <span key={s.label} className="flex items-center gap-1">
                <span className={s.done ? "text-sky-600 font-semibold" : "text-slate-400"}>
                  {s.label}
                </span>
                {i < arr.length - 1 && <span className="text-slate-300">›</span>}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Province — simple select (peu d'éléments) */}
            <Field label="Province">
              <select
                value={provinceId || ""}
                onChange={e => handleProvinceChange(Number(e.target.value))}
                className={selectCls}
              >
                <option value="">— Toutes les provinces —</option>
                {provinces.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>

            {/* Région */}
            <Field label="Région">
              <SelectWithSearch
                placeholder="Sélectionner une région"
                searchValue={regionSearch}
                onSearch={setRegionSearch}
                selectValue={regionId}
                onSelect={handleRegionChange}
                items={filteredRegions}
                disabled={!provinceId}
                disabledMsg="Choisir d'abord une province"
              />
            </Field>

            {/* District */}
            <Field label="District">
              <SelectWithSearch
                placeholder="Sélectionner un district"
                searchValue={districtSearch}
                onSearch={setDistrictSearch}
                selectValue={districtId}
                onSelect={handleDistrictChange}
                items={filteredDistricts}
                disabled={!regionId}
                disabledMsg="Choisir d'abord une région"
              />
            </Field>

            {/* Commune */}
            <Field label="Commune">
              <SelectWithSearch
                placeholder="Sélectionner une commune"
                searchValue={communeSearch}
                onSearch={setCommuneSearch}
                selectValue={communeId}
                onSelect={handleCommuneChange}
                items={filteredCommunes}
                disabled={!districtId}
                disabledMsg="Choisir d'abord un district"
              />
            </Field>

            {/* Fokontany */}
            <Field label="Fokontany">
              <SelectWithSearch
                placeholder="Sélectionner un fokontany"
                searchValue={fokontanySearch}
                onSearch={setFokontanySearch}
                selectValue={fokontanyId}
                onSelect={handleFokontanyChange}
                items={filteredFokontany}
                disabled={!communeId}
                disabledMsg="Choisir d'abord une commune"
              />
            </Field>

            {/* Village */}
            <Field label="Village" required>
              <SelectWithSearch
                placeholder="Sélectionner un village"
                searchValue={villageSearch}
                onSearch={setVillageSearch}
                selectValue={form.villageId}
                onSelect={id => set("villageId", id)}
                items={filteredVillages}
                disabled={filteredVillages.length === 0}
                disabledMsg="Aucun village disponible"
                required
              />
            </Field>

          </div>
        </SectionCard>

        {/* ── GPS ── */}
        <SectionCard title={<><MapPin size={13} /> Position GPS</>}>
          <div className="flex gap-3 items-end">
            <div className="flex-1 flex flex-col gap-1">
              <span className="text-xs text-slate-400 uppercase tracking-wide">Latitude</span>
              <input
                type="text"
                value={latInput}
                onChange={e => { setLatInput(e.target.value); set("latitude", e.target.value); moveMarker(parseFloat(e.target.value), parseFloat(lngInput)); }}
                placeholder="-18.9249..."
                className={inputCls}
              />
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <span className="text-xs text-slate-400 uppercase tracking-wide">Longitude</span>
              <input
                type="text"
                value={lngInput}
                onChange={e => { setLngInput(e.target.value); set("longitude", e.target.value); moveMarker(parseFloat(latInput), parseFloat(e.target.value)); }}
                placeholder="47.5185..."
                className={inputCls}
              />
            </div>
            <button
              type="button"
              onClick={handleGeolocate}
              title="Ma position"
              className="flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition flex-shrink-0"
            >
              <Navigation size={15} />
            </button>
          </div>
          <p className="text-xs text-slate-400">Saisissez les coordonnées ou cliquez directement sur la carte</p>
        </SectionCard>

        {/* ── Clients ── */}
        <SectionCard title={
          <div className="flex w-full items-center justify-between">
            <span>Clients associés</span>
            {selectedCustomers.length > 0 && (
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, customerIds: [] }))}
                className="flex items-center gap-1 text-xs font-normal text-slate-400 hover:text-red-500 transition normal-case tracking-normal"
              >
                <X size={11} /> Tout désélectionner
              </button>
            )}
          </div>
        }>

          {/* Tags sélectionnés */}
          {selectedCustomers.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedCustomers.map((c: any) => (
                <span key={c.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-sky-100 text-sky-800">
                  {c.name}
                  <button type="button" onClick={() => toggleCustomer(c.id)} className="hover:text-sky-600">
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {customers.length === 0 ? (
            <p className="text-sm text-slate-400">Aucun client disponible</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {customers.map((c: any) => {
                const checked = form.customerIds?.includes(c.id) ?? false;
                return (
                  <label
                    key={c.id}
                    className={[
                      "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition",
                      checked
                        ? "bg-sky-50 border-sky-300 text-sky-800 font-medium"
                        : "bg-white border-slate-200 text-slate-700 hover:border-slate-300",
                    ].join(" ")}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCustomer(c.id)}
                      className="sr-only"
                    />
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${checked ? "bg-sky-500" : "bg-slate-300"}`} />
                    {c.name}
                  </label>
                );
              })}
            </div>
          )}
        </SectionCard>

        {/* ── Carte Leaflet ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 text-sm text-slate-500">
            <MapPin size={14} className="text-sky-500" />
            <span>Cliquez sur la carte pour positionner la sirène</span>
          </div>
          <div ref={mapRef} className="w-full h-72" />
        </div>

        {/* Erreur globale */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 py-4">
          <button
            type="button"
            onClick={() => navigate("/sirenes")}
            className="px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading || !form.villageId || !!phoneErrors.brain || !!phoneErrors.relai}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {isEdit ? "Enregistrer" : "Créer la sirène"}
          </button>
        </div>

      </form>
    </div>
  );
}