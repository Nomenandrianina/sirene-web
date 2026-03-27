import { useState, useRef, useEffect, useMemo } from "react";
import { Search, X, ChevronDown, Radio, Check } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ZoneItem {
  id:   number;
  name: string;
}

interface SearchableMultiSelectProps {
  label:       string;
  placeholder: string;
  items:       ZoneItem[];
  selected:    number[];
  onChange:    (ids: number[]) => void;
  disabled?:   boolean;
  disabledMsg?: string;
  color?:      "blue" | "violet" | "emerald" | "amber" | "rose";
}

// ── Palette couleurs par niveau ───────────────────────────────────────────────

const COLORS = {
  blue:    { badge: "bg-blue-100 text-blue-800",    dot: "bg-blue-500",    ring: "focus-within:ring-blue-400",  header: "bg-blue-50 border-blue-200",  check: "text-blue-600" },
  violet:  { badge: "bg-violet-100 text-violet-800", dot: "bg-violet-500",  ring: "focus-within:ring-violet-400", header: "bg-violet-50 border-violet-200", check: "text-violet-600" },
  emerald: { badge: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-500", ring: "focus-within:ring-emerald-400", header: "bg-emerald-50 border-emerald-200", check: "text-emerald-600" },
  amber:   { badge: "bg-amber-100 text-amber-800",   dot: "bg-amber-500",   ring: "focus-within:ring-amber-400",  header: "bg-amber-50 border-amber-200",  check: "text-amber-600" },
  rose:    { badge: "bg-rose-100 text-rose-800",     dot: "bg-rose-500",    ring: "focus-within:ring-rose-400",   header: "bg-rose-50 border-rose-200",    check: "text-rose-600" },
};

// ── Composant SearchableMultiSelect ──────────────────────────────────────────

function SearchableMultiSelect({
  label, placeholder, items, selected, onChange,
  disabled = false, disabledMsg, color = "blue",
}: SearchableMultiSelectProps) {
  const [open,   setOpen]   = useState(false);
  const [query,  setQuery]  = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);
  const c = COLORS[color];

  // Fermer en cliquant dehors
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Focus l'input quand on ouvre
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const filtered = useMemo(() =>
    query.trim()
      ? items.filter(i => i.name.toLowerCase().includes(query.toLowerCase()))
      : items,
    [items, query]);

  const selectedItems = useMemo(() =>
    items.filter(i => selected.includes(i.id)),
    [items, selected]);

  function toggle(id: number) {
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);
  }

  function selectAll() { onChange(filtered.map(i => i.id)); }
  function clearAll()  { onChange([]); }

  return (
    <div ref={containerRef} className="relative">
      {/* Label */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</span>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-slate-400 hover:text-red-500 transition flex items-center gap-0.5"
          >
            <X size={11} /> Tout effacer
          </button>
        )}
      </div>

      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => { if (!disabled) setOpen(o => !o); }}
        className={[
          "w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-sm transition",
          "focus:outline-none ring-2 ring-transparent",
          c.ring,
          disabled
            ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
            : open
              ? `border-slate-300 bg-white shadow-sm ${c.ring}`
              : "border-slate-200 bg-white hover:border-slate-300",
        ].join(" ")}
      >
        <span className="flex flex-wrap gap-1.5 flex-1 min-w-0">
          {selected.length === 0 ? (
            <span className="text-slate-400">{disabled && disabledMsg ? disabledMsg : placeholder}</span>
          ) : selected.length <= 3 ? (
            selectedItems.map(item => (
              <span key={item.id} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.badge}`}>
                {item.name}
                <span
                  role="button"
                  tabIndex={0}
                  onClick={e => { e.stopPropagation(); toggle(item.id); }}
                  onKeyDown={e => e.key === "Enter" && toggle(item.id)}
                  className="cursor-pointer hover:opacity-60"
                >
                  <X size={10} />
                </span>
              </span>
            ))
          ) : (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.badge}`}>
              {selected.length} sélectionné{selected.length > 1 ? "s" : ""}
            </span>
          )}
        </span>
        <ChevronDown
          size={15}
          className={`flex-shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">

          {/* Barre de recherche */}
          <div className="px-3 pt-3 pb-2">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={`Rechercher dans ${label.toLowerCase()}…`}
                className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-slate-50"
              />
              {query && (
                <button type="button" onClick={() => setQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Actions globales */}
          {filtered.length > 0 && (
            <div className="flex items-center gap-2 px-3 pb-2">
              <button
                type="button"
                onClick={selectAll}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium transition"
              >
                Tout sélectionner ({filtered.length})
              </button>
              <span className="text-slate-300">·</span>
              <button
                type="button"
                onClick={clearAll}
                className="text-xs text-slate-400 hover:text-slate-600 transition"
              >
                Tout effacer
              </button>
              {selected.length > 0 && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className={`text-xs font-medium ${c.check}`}>{selected.length} sélectionné{selected.length > 1 ? "s" : ""}</span>
                </>
              )}
            </div>
          )}

          {/* Liste */}
          <div className="max-h-52 overflow-y-auto border-t border-slate-100">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-slate-400">
                {query ? `Aucun résultat pour « ${query} »` : "Aucun élément disponible"}
              </div>
            ) : (
              filtered.map(item => {
                const isSelected = selected.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggle(item.id)}
                    className={[
                      "w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition",
                      isSelected
                        ? `bg-blue-50 text-blue-900 font-medium`
                        : "text-slate-700 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    {/* Checkbox visuelle */}
                    <span className={[
                      "flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition",
                      isSelected ? `bg-blue-500 border-blue-500` : "border-slate-300",
                    ].join(" ")}>
                      {isSelected && <Check size={10} className="text-white" strokeWidth={3} />}
                    </span>
                    <span className="flex-1 truncate">{item.name}</span>
                    {/* Dot coloré si sélectionné */}
                    {isSelected && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Props du ZonesStep ────────────────────────────────────────────────────────

interface ZonesStepProps {
  // Données brutes
  provinces:         ZoneItem[];
  allRegions:        ZoneItem[];
  allDistricts:      ZoneItem[];
  allCommunes:       ZoneItem[];
  allFokontany:      ZoneItem[];
  allVillages:       ZoneItem[];

  // Sélections
  selectedProvinces:  number[];
  selectedRegions:    number[];
  selectedDistricts:  number[];
  selectedCommunes:   number[];
  selectedFokontany:  number[];
  selectedVillages:   number[];

  // Setters
  setSelectedProvinces:  (ids: number[]) => void;
  setSelectedRegions:    (ids: number[]) => void;
  setSelectedDistricts:  (ids: number[]) => void;
  setSelectedCommunes:   (ids: number[]) => void;
  setSelectedFokontany:  (ids: number[]) => void;
  setSelectedVillages:   (ids: number[]) => void;

  // Préview sirènes
  previewLoading: boolean;
  sireneCount:    number;
  sirenePrev:     any[];
}

// ── ZonesStep principal ───────────────────────────────────────────────────────

export function ZonesStep({
  provinces, allRegions, allDistricts, allCommunes, allFokontany, allVillages,
  selectedProvinces, selectedRegions, selectedDistricts,
  selectedCommunes, selectedFokontany, selectedVillages,
  setSelectedProvinces, setSelectedRegions, setSelectedDistricts,
  setSelectedCommunes, setSelectedFokontany, setSelectedVillages,
  previewLoading, sireneCount, sirenePrev,
}: ZonesStepProps) {

  // ── Cascade : filtrage des options selon la sélection parente ───────────────

  const filteredRegions = useMemo(() =>
    selectedProvinces.length
      ? allRegions.filter((r: any) => selectedProvinces.includes(Number(r.provinceId ?? r.province?.id)))
      : allRegions,
    [allRegions, selectedProvinces]);

  const filteredDistricts = useMemo(() =>
    selectedRegions.length
      ? allDistricts.filter((d: any) => selectedRegions.includes(Number(d.regionId ?? d.region?.id)))
      : allDistricts,
    [allDistricts, selectedRegions]);

  const filteredCommunes = useMemo(() =>
    selectedDistricts.length
      ? allCommunes.filter((c: any) => selectedDistricts.includes(Number(c.districtId ?? c.district?.id)))
      : allCommunes,
    [allCommunes, selectedDistricts]);

  const filteredFokontany = useMemo(() =>
    selectedCommunes.length
      ? allFokontany.filter((f: any) => selectedCommunes.includes(Number(f.communeId ?? f.commune?.id)))
      : allFokontany,
    [allFokontany, selectedCommunes]);

  const filteredVillages = useMemo(() => {
    if (selectedFokontany.length)
      return allVillages.filter((v: any) => selectedFokontany.includes(Number(v.fokontanyId ?? v.fokontany?.id)));
    if (selectedCommunes.length)
      return allVillages.filter((v: any) => selectedCommunes.includes(Number(v.communeId ?? v.commune?.id)));
    if (selectedDistricts.length)
      return allVillages.filter((v: any) => selectedDistricts.includes(Number(v.districtId ?? v.district?.id)));
    return allVillages;
  }, [allVillages, selectedFokontany, selectedCommunes, selectedDistricts]);

  // ── Reset en cascade vers le bas ─────────────────────────────────────────────

  function handleProvinces(ids: number[]) {
    setSelectedProvinces(ids);
    setSelectedRegions([]);
    setSelectedDistricts([]);
    setSelectedCommunes([]);
    setSelectedFokontany([]);
    setSelectedVillages([]);
  }

  function handleRegions(ids: number[]) {
    setSelectedRegions(ids);
    setSelectedDistricts([]);
    setSelectedCommunes([]);
    setSelectedFokontany([]);
    setSelectedVillages([]);
  }

  function handleDistricts(ids: number[]) {
    setSelectedDistricts(ids);
    setSelectedCommunes([]);
    setSelectedFokontany([]);
    setSelectedVillages([]);
  }

  function handleCommunes(ids: number[]) {
    setSelectedCommunes(ids);
    setSelectedFokontany([]);
    setSelectedVillages([]);
  }

  function handleFokontany(ids: number[]) {
    setSelectedFokontany(ids);
    setSelectedVillages([]);
  }

  // ── Breadcrumb résumé ─────────────────────────────────────────────────────────

  const totalSelected =
    selectedProvinces.length + selectedRegions.length + selectedDistricts.length +
    selectedCommunes.length  + selectedFokontany.length + selectedVillages.length;

  const levels = [
    { label: "Province",   count: selectedProvinces.length,  color: "blue"    as const },
    { label: "Région",     count: selectedRegions.length,    color: "violet"  as const },
    { label: "District",   count: selectedDistricts.length,  color: "emerald" as const },
    { label: "Commune",    count: selectedCommunes.length,   color: "amber"   as const },
    { label: "Fokontany",  count: selectedFokontany.length,  color: "rose"    as const },
    { label: "Village",    count: selectedVillages.length,   color: "blue"    as const },
  ];

  return (
    <div className="flex flex-col gap-5">

      {/* ── Résumé sélection ── */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
        {totalSelected === 0 ? (
          <span className="text-sm text-slate-400 italic">
            Aucune zone sélectionnée — sélectionnez au moins un niveau ci-dessous
          </span>
        ) : (
          <>
            <span className="text-xs text-slate-500 font-medium">Zones :</span>
            {levels.filter(l => l.count > 0).map(l => (
              <span key={l.label} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${COLORS[l.color].badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${COLORS[l.color].dot}`} />
                {l.count} {l.label}{l.count > 1 ? "s" : ""}
              </span>
            ))}
          </>
        )}
      </div>

      {/* ── Grille des sélecteurs ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Province */}
        <SearchableMultiSelect
          label="Provinces"
          placeholder="Toutes les provinces…"
          items={provinces}
          selected={selectedProvinces}
          onChange={handleProvinces}
          color="blue"
        />

        {/* Région */}
        <SearchableMultiSelect
          label="Régions"
          placeholder="Sélectionner des régions…"
          items={filteredRegions}
          selected={selectedRegions}
          onChange={handleRegions}
          color="violet"
          disabled={filteredRegions.length === 0}
          disabledMsg="Aucune région disponible"
        />

        {/* District */}
        <SearchableMultiSelect
          label="Districts"
          placeholder="Sélectionner des districts…"
          items={filteredDistricts}
          selected={selectedDistricts}
          onChange={handleDistricts}
          color="emerald"
          disabled={filteredDistricts.length === 0}
          disabledMsg="Aucun district disponible"
        />

        {/* Commune */}
        <SearchableMultiSelect
          label="Communes"
          placeholder="Sélectionner des communes…"
          items={filteredCommunes}
          selected={selectedCommunes}
          onChange={handleCommunes}
          color="amber"
          disabled={filteredCommunes.length === 0}
          disabledMsg="Aucune commune disponible"
        />

        {/* Fokontany */}
        <SearchableMultiSelect
          label="Fokontany"
          placeholder="Sélectionner des fokontany…"
          items={filteredFokontany}
          selected={selectedFokontany}
          onChange={handleFokontany}
          color="rose"
          disabled={filteredFokontany.length === 0}
          disabledMsg="Aucun fokontany disponible"
        />

        {/* Village */}
        <SearchableMultiSelect
          label="Villages (optionnel)"
          placeholder="Affiner par village…"
          items={filteredVillages}
          selected={selectedVillages}
          onChange={setSelectedVillages}
          color="blue"
          disabled={filteredVillages.length === 0}
          disabledMsg="Aucun village disponible"
        />

      </div>

      {/* ── Aperçu sirènes ciblées ── */}
      <div className="flex flex-col gap-2 p-4 bg-slate-900 rounded-xl border border-slate-700">
        <div className="flex items-center gap-2 text-sm">
          <Radio size={14} className="text-sky-400" />
          {previewLoading ? (
            <span className="text-slate-400 text-sm italic">Calcul en cours…</span>
          ) : (
            <span className="text-white">
              <strong className="text-sky-400 text-base">{sireneCount}</strong>
              {" "}sirène{sireneCount > 1 ? "s" : ""} active{sireneCount > 1 ? "s" : ""} dans les zones sélectionnées
            </span>
          )}
        </div>
        {sirenePrev.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {sirenePrev.slice(0, 8).map((s: any) => (
              <span key={s.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-slate-700 text-slate-200 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {s.imei}{s.village?.name ? ` — ${s.village.name}` : ""}
              </span>
            ))}
            {sirenePrev.length > 8 && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-slate-700 text-slate-400">
                +{sirenePrev.length - 8} autres
              </span>
            )}
          </div>
        )}
        {totalSelected === 0 && (
          <p className="text-xs text-slate-500 italic mt-1">
            Sélectionnez au moins une zone pour voir les sirènes concernées
          </p>
        )}
      </div>

    </div>
  );
}