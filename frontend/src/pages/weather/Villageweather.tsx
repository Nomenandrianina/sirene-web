import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Loader2, AlertTriangle, Download, X, Check } from "lucide-react";
import { weatherApi, FinalWeatherEntry } from "@/services/weather.api";
import { villagesApi } from "@/services/village.api";
import "@/styles/village-weather.css";
import * as XLSX from "xlsx";
import { AppLayout } from "@/components/AppLayout";

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDateFr(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  }
  
  function dayOfWeek(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", { weekday: "long" }).toUpperCase();
  }
  
  function getByDatePart(
    entries: FinalWeatherEntry[],
    type: string,
    date: string,
    part: "AM" | "PM",
  ): any {
    return entries.find(e => e.type === type && e.date === date && e.day_part === part)?.result ?? null;
  }
  
  function getUniqueDates(entries: FinalWeatherEntry[]): string[] {
    const set = new Set(entries.filter(e => e.day_part === "AM").map(e => e.date));
    return Array.from(set).sort();
  }
  
  // Rotations EXACTES copiées depuis ViewArome.vue (CSS classes)
  // SVG pointe vers le BAS (S = 0°) dans le Vue
  const AROME_ROTATIONS: Record<string, number> = {
    "n":  180,
    "ne": 315,
    "e":  270,
    "se": 225,
    "s":  0,
    "sw": 45,
    "w":  90,
    "nw": 135,
  };
  
  // Pour final_weather — rotations EXACTES de ViewWeather.vue
  // NE=225, SE=315 (inversé par rapport à ViewArome.vue)
  const FORECAST_ROTATIONS: Record<string, number> = {
    "n":  180,
    "ne": 225,  // ViewWeather: rotate(225deg)
    "e":  270,
    "se": 315,  // ViewWeather: rotate(315deg)
    "s":  0,
    "sw": 45,
    "w":  90,
    "nw": 135,
  };
  
  function windDirDeg(dir: string, fromEnd: boolean): number {
    if (!dir) return 0;
    const code = fromEnd
      ? dir.substring(dir.length - 2).toLowerCase().replace(" ", "").trim()
      : dir.substring(0, 2).toLowerCase().replace(" ", "").trim();
    const map = fromEnd ? FORECAST_ROTATIONS : AROME_ROTATIONS;
    return map[code] ?? 0;
  }
  
  // Couleur AROME
  function aromeColor(value: number | null): string {
    if (value == null) return "white";
    if (value <= 5)  return "rgba(0,255,0,0.7)";
    if (value < 21)  return "rgba(255,255,0,0.7)";
    if (value < 31)  return "rgba(255,165,0,0.7)";
    return "rgba(255,0,0,0.7)";
  }
  
  function getAromeTitle(dateValue: string, type: 1 | 2 | 3 | 4): string {
    const date = new Date(dateValue);
    const days = ["Di", "Lu", "Ma", "Me", "Je", "Ve", "Sa"];
    const dayName    = days[(date.getDay() + 1) % 7];
    const dayOfMonth = date.getDate() + 1;
    const hour       = date.getHours();
    if (type === 1) return dayName;
    if (type === 2) return String(dayOfMonth);
    if (type === 3) return `${dayOfMonth}-${date.getMonth() + 1}-${date.getFullYear()}`;
    return String(hour);
  }
  
  // ── Composant flèche SVG — port exact du ArrowIcon Vue ────────────────────
  // arome=false (défaut) : final_weather → substring(length-2)
  // arome=true           : AROME        → substring(0, 2)
  function ArrowIcon({ dir, arome = false }: { dir: string; arome?: boolean }) {
    if (!dir) return <span style={{ color: "#aaa" }}>—</span>;
    const deg = windDirDeg(dir, !arome);
    return (
      <svg
        style={{ transform: `rotate(${deg}deg)`, transition: "transform 0.3s ease-in-out" }}
        width="24" height="24"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 30 30"
      >
        <path d="M9.95,10.87c-0.01,0.35,0.1,0.65,0.34,0.9s0.53,0.37,0.89,0.36c0.34,0.02,0.63-0.10,0.88-0.37l1.66-1.64v10.3 c-0.01,0.35,0.11,0.64,0.36,0.88s0.55,0.35,0.92,0.34c0.34,0.02,0.64-0.09,0.89-0.32s0.39-0.53,0.40-0.88v-10.3l1.64,1.64 c0.23,0.24,0.53,0.37,0.88,0.37c0.36,0,0.66-0.12,0.90-0.36s0.36-0.53,0.36-0.89c-0.02-0.36-0.15-0.64-0.40-0.85l-3.74-3.84 c-0.24-0.23-0.55-0.37-0.92-0.40c-0.37,0.02-0.68,0.16-0.92,0.41l-3.75,3.81C10.08,10.25,9.95,10.53,9.95,10.87z" />
      </svg>
    );
  }
  
  // ── Composant icônes alerte ────────────────────────────────────────────────
  function AlertIcons({ windspd, wave }: { windspd: number | null; wave: number | null }) {
    const hasInterdit = windspd != null && windspd >= 29;
    const hasWave     = wave    != null && wave    >= 2;
    if (!hasInterdit && !hasWave) return null;
    return (
      <div className="alert-icons">
        {hasInterdit && <span className="icon-interdit" title="Vent fort">⊘</span>}
        {hasWave     && <span className="icon-wave"     title="Vagues">⚠</span>}
      </div>
    );
  }
  
  
  
  // ── Page principale ────────────────────────────────────────────────────────
  export default function VillageWeather() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const villageId = Number(id);
  
    // ── Export form state ─────────────────────────────────────────────────────
    const today     = new Date().toISOString().split("T")[0];
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
    const [showExport,  setShowExport]  = useState(false);
    const [exportFormat, setExportFormat] = useState<"xlsx" | "csv">("xlsx");
    const [exportStart,  setExportStart]  = useState(monthStart);
    const [exportEnd,    setExportEnd]    = useState(today);
    const [exporting,    setExporting]    = useState(false);
  
    async function doExport() {
      setExporting(true);
      try {
        const BASE  = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3000") as string;
        const token = localStorage.getItem("access_token") ?? "";
        const params = new URLSearchParams({
          format:              exportFormat,
          "date[start_date]":  exportStart,
          "date[end_date]":    exportEnd,
        });
        const res = await fetch(
          `${BASE}/export-single-village/${villageId}?${params}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        const blob = await res.blob();
        const url  = window.URL.createObjectURL(blob);
        const a    = document.createElement("a");
        a.href     = url;
        a.download = `prévision du ${exportStart} au ${exportEnd}.${exportFormat}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        setShowExport(false);
      } catch (err) {
        console.error("Export error:", err);
        alert("Erreur lors de l'export. Vérifiez la console.");
      } finally {
        setExporting(false);
      }
    }
  
    const { data: village } = useQuery({
      queryKey: ["village", villageId],
      queryFn:  () => villagesApi.getById(villageId),
      enabled:  !!villageId,
    });
  
    const { data: weatherData, isLoading, isError } = useQuery({
      queryKey: ["weather", villageId],
      queryFn:  () => weatherApi.fetchByVillage(villageId),
      enabled:  !!villageId,
      staleTime: 5 * 60 * 1000,
    });
  
    const weather      = weatherData?.[0];
    const finalWeather = weather?.final_weather ?? [];
  
    // Normaliser arome (objet clés numériques → tableau) comme weatherStore Vue
    const rawArome = weather?.arome ?? {};
    const arome: Record<string, any> = {};
    Object.keys(rawArome).forEach((key) => {
      const val = (rawArome as any)[key];
      if (val !== null && typeof val === "object" && !Array.isArray(val)) {
        const arr: any[] = [];
        Object.keys(val).forEach((k) => { if (Number(k) >= 0) arr[Number(k)] = val[k]; });
        arome[key] = arr;
      } else {
        arome[key] = val;
      }
    });
  
    const uniqueDates = getUniqueDates(finalWeather);
    const aromeDates  = Array.isArray(arome?.GUST)
      ? (arome.GUST as any[]).map((d: any) => d?.date_time).filter(Boolean)
      : [];
  
    const aromeTypes = [
      { name: "Vitesse de vent (Km/h)", type: "WINDSPD"    },
      { name: "Rafale de vent (Km/h)",  type: "GUST"       },
      { name: "Direction de vent (→)",  type: "WINDIRNAME" },
    ];
  
    function getAromeByDate(type: string, date: string): any {
      const arr = arome?.[type] as any[];
      return arr?.find((a: any) => a?.date_time === date);
    }
  
    return (
      <AppLayout>
      <div className="weather-page">
  
        {/* ── Header ── */}
        <div className="weather-header">
          <button className="btn-back" onClick={() => navigate("/villages")}>
            <ChevronLeft size={16} /> Retour à la liste
          </button>
          <div style={{ flex: 1 }}>
            <h1 className="page-title">Prévisions météo</h1>
          </div>
          {finalWeather.length > 0 && (
            <div className="export-actions">
              <button className="btn-export" onClick={() => setShowExport(v => !v)} disabled={showExport}>
                <Download size={14} /> Exporter
              </button>
            </div>
          )}
        </div>
  
        {/* ── Formulaire export (comme Mitao) ── */}
        {showExport && (
          <div className="export-form-card">
            <div className="export-form-header">
              <strong>Export</strong>
              <button className="btn-icon" onClick={() => setShowExport(false)}><X size={16} /></button>
            </div>
            <div className="export-form-body">
              <div className="export-field">
                <label>Format</label>
                <select value={exportFormat} onChange={e => setExportFormat(e.target.value as "xlsx" | "csv")}>
                  <option value="xlsx">Excel (.xlsx)</option>
                  <option value="csv">CSV (.csv)</option>
                </select>
              </div>
              <div className="export-field">
                <label>Date début</label>
                <input type="date" value={exportStart} onChange={e => setExportStart(e.target.value)} />
              </div>
              <div className="export-field">
                <label>Date fin</label>
                <input type="date" value={exportEnd} onChange={e => setExportEnd(e.target.value)} />
              </div>
              <div className="export-form-actions">
                <button className="btn-cancel" onClick={() => setShowExport(false)}>
                  <X size={13} /> Annuler
                </button>
                <button className="btn-confirm" onClick={doExport} disabled={exporting}>
                  {exporting ? <Loader2 size={13} className="spin" /> : <Check size={13} />}
                  Valider
                </button>
              </div>
            </div>
          </div>
        )}
  
        {/* ── Nom village ── */}
        {village && (
          <table className="village-info-table">
            <tbody>
              <tr>
                <td><strong>Village</strong></td>
                <td>{village.name}</td>
              </tr>
              <tr>
                <td><strong>Position</strong></td>
                <td>{village.latitude}, {village.longitude}</td>
              </tr>
            </tbody>
          </table>
        )}
  
        {/* ── Loading ── */}
        {isLoading && (
          <div className="weather-loading">
            <Loader2 size={24} className="spin" />
            <span>Chargement des données Windguru…</span>
          </div>
        )}
  
        {/* ── Erreur ── */}
        {isError && (
          <div className="weather-error">
            <AlertTriangle size={18} /> Impossible de charger les prévisions.
          </div>
        )}
  
        {/* ── Tableau MATIN / APRÈS-MIDI ── */}
        {!isLoading && finalWeather.length > 0 && (
          <div className="forecast-wrap">
            <div className="forecast-scroll">
              <table className="forecast-table" id="forecast-table">
                <thead>
                  <tr className="row-head">
                    <th className="col-label"></th>
                    {uniqueDates.map(d => (
                      <th key={d} className="col-day">{dayOfWeek(d)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
  
                  {/* MATIN */}
                  <tr className="row-period">
                    <td className="col-label"><strong>MATIN</strong></td>
                    {uniqueDates.map(d => (
                      <td key={d} className="col-day"><strong>{formatDateFr(d)}</strong></td>
                    ))}
                  </tr>
                  <tr>
                    <td className="col-label bg-gris">Vitesse du vent (Km/h)</td>
                    {uniqueDates.map(d => <td key={d} className="col-day">{getByDatePart(finalWeather, "WINDSPD", d, "AM") ?? "NA"}</td>)}
                  </tr>
                  <tr>
                    <td className="col-label bg-gris">Direction du vent</td>
                    {uniqueDates.map(d => (
                      <td key={d} className="col-day">
                        <ArrowIcon dir={getByDatePart(finalWeather, "WINDIRNAME", d, "AM") ?? ""} />
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="col-label bg-gris">Hauteur de vague (m)</td>
                    {uniqueDates.map(d => <td key={d} className="col-day">{getByDatePart(finalWeather, "WVHGT", d, "AM") ?? "NA"}</td>)}
                  </tr>
                  <tr>
                    <td className="col-label bg-gris">Code couleur</td>
                    {uniqueDates.map(d => {
                      const color = getByDatePart(finalWeather, "COLOR", d, "AM");
                      return <td key={d} className="col-day" style={{ backgroundColor: color?.toLowerCase() || "transparent" }} />;
                    })}
                  </tr>
                  <tr>
                    <td className="col-label bg-gris">Rafale de vent (Km/h)</td>
                    {uniqueDates.map(d => <td key={d} className="col-day">{getByDatePart(finalWeather, "GUST", d, "AM") ?? ""}</td>)}
                  </tr>
                  <tr>
                    <td className="col-label bg-gris">ALERTE</td>
                    {uniqueDates.map(d => (
                      <td key={d} className="col-day">
                        <AlertIcons
                          windspd={getByDatePart(finalWeather, "WINDSPD", d, "AM")}
                          wave={getByDatePart(finalWeather, "WVHGT", d, "AM")}
                        />
                      </td>
                    ))}
                  </tr>
  
                  {/* APRÈS-MIDI */}
                  <tr className="row-period">
                    <td className="col-label"><strong>APRÈS-MIDI</strong></td>
                    {uniqueDates.map(d => (
                      <td key={d} className="col-day"><strong>{formatDateFr(d)}</strong></td>
                    ))}
                  </tr>
                  <tr>
                    <td className="col-label bg-gris">Vitesse du vent (Km/h)</td>
                    {uniqueDates.map(d => <td key={d} className="col-day">{getByDatePart(finalWeather, "WINDSPD", d, "PM") ?? "NA"}</td>)}
                  </tr>
                  <tr>
                    <td className="col-label bg-gris">Direction du vent</td>
                    {uniqueDates.map(d => (
                      <td key={d} className="col-day">
                        <ArrowIcon dir={getByDatePart(finalWeather, "WINDIRNAME", d, "PM") ?? ""} />
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="col-label bg-gris">Hauteur de vague (m)</td>
                    {uniqueDates.map(d => <td key={d} className="col-day">{getByDatePart(finalWeather, "WVHGT", d, "PM") ?? "NA"}</td>)}
                  </tr>
                  <tr>
                    <td className="col-label bg-gris">Code couleur</td>
                    {uniqueDates.map(d => {
                      const color = getByDatePart(finalWeather, "COLOR", d, "PM");
                      return <td key={d} className="col-day" style={{ backgroundColor: color?.toLowerCase() || "transparent" }} />;
                    })}
                  </tr>
                  <tr>
                    <td className="col-label bg-gris">Rafale de vent (Km/h)</td>
                    {uniqueDates.map(d => <td key={d} className="col-day">{getByDatePart(finalWeather, "GUST", d, "PM") ?? ""}</td>)}
                  </tr>
                  <tr>
                    <td className="col-label bg-gris">ALERTE</td>
                    {uniqueDates.map(d => (
                      <td key={d} className="col-day">
                        <AlertIcons
                          windspd={getByDatePart(finalWeather, "WINDSPD", d, "PM")}
                          wave={getByDatePart(finalWeather, "WVHGT", d, "PM")}
                        />
                      </td>
                    ))}
                  </tr>
  
                </tbody>
              </table>
            </div>
          </div>
        )}
  
        {/* ── Tableau AROME ── */}
        {!isLoading && aromeDates.length > 0 && (
          <div className="arome-wrap">
            <div className="arome-header">
              <h2 className="arome-title">AROME 2.5 km</h2>
            </div>
            <div className="forecast-scroll">
              <table className="forecast-table">
                <thead>
                  <tr className="row-head">
                    <th className="col-label" style={{ fontSize: "0.72rem" }}>
                      <div>INIT :</div>
                      <div>{arome?.initdate ? getAromeTitle(arome.initdate as string, 3) : ""}</div>
                      <div>{arome?.initdate ? getAromeTitle(arome.initdate as string, 4) : ""} UTC</div>
                    </th>
                    {aromeDates.map((date, i) => (
                      <th key={i} className="col-day" style={{ minWidth: 55, fontSize: "0.68rem" }}>
                        <div>{getAromeTitle(date, 1)}</div>
                        <div>{getAromeTitle(date, 2)}.</div>
                        <div>{getAromeTitle(date, 4)}h</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {aromeTypes.map(aType => (
                    <tr key={aType.type}>
                      <td className="col-label bg-gris">{aType.name}</td>
                      {aromeDates.map((date, i) => {
                        const entry = getAromeByDate(aType.type, date);
                        const val   = entry?.value ?? null;
                        return (
                          <td key={i} className="col-day"
                            style={{
                              backgroundColor: aType.type !== "WINDIRNAME" ? aromeColor(val) : "white",
                              fontSize: "0.72rem",
                            }}>
                            {aType.type !== "WINDIRNAME"
                              ? (val ?? "NA")
                              : <ArrowIcon dir={val ?? ""} arome={true} />
                            }
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
  
      </div>
      </AppLayout>
    );
  }
  
  