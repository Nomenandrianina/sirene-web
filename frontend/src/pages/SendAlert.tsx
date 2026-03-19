import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { alertesApi }              from "@/services/alertes.api";
import { alerteTypesApi }          from "@/services/alertetypes.api";
import { sousCategorieAlertesApi } from "@/services/souscategorieAlerte.api";
import { categorieAlertesApi }     from "@/services/categoriealertes.api";
import { alerteAudiosApi }         from "@/services/alerteaudio.api";
import { provincesApi }            from "@/services/province.api";
import { regionsApi }              from "@/services/region.api";
import { districtsApi }            from "@/services/districts.api";
import { villagesApi }             from "@/services/village.api";
import { sirenesApi }              from "@/services/sirene.api";
import { notificationsApi }        from "@/services/notification.api";
import { sendAlerteApi, SendAlertePayload } from "@/services/sendalerte.api";
import {
  CheckCircle, ChevronRight, ChevronLeft, Send, Loader2,
  AlertTriangle, Radio, Play, Pause, Music, Clock, Zap,
  Layers, Plus, X, List, RotateCcw, Timer, Bell,
} from "lucide-react";
import "@/styles/send-alerte.css";

const EXCLUDED_ALERTE_NAMES = ["alerte automatique"];

const STEPS_SIMPLE = [
  { id: 0, label: "Alerte",         desc: "Choisissez le type de catastrophe ou communication" },
  { id: 1, label: "Type",           desc: "Sélectionnez le type spécifique" },
  { id: 2, label: "Catégorie",      desc: "Sélectionnez la catégorie d'alerte" },
  { id: 3, label: "Sous-catégorie", desc: "Choisissez le message audio à envoyer" },
  { id: 4, label: "Zones",          desc: "Sélectionnez les zones géographiques cibles" },
  { id: 5, label: "Planification",  desc: "Définissez l'heure d'envoi et les paramètres de répétition" },
  { id: 6, label: "Confirmation",   desc: "Vérifiez et confirmez l'envoi" },
];

const STEPS_MULTI = [
  { id: 0, label: "Alerte",        desc: "Choisissez le type de catastrophe ou communication" },
  { id: 1, label: "Type",          desc: "Sélectionnez le type spécifique" },
  { id: 2, label: "Sélection",     desc: "Ajoutez plusieurs catégories / sous-catégories" },
  { id: 3, label: "Zones",         desc: "Sélectionnez les zones géographiques cibles" },
  { id: 4, label: "Planification", desc: "Définissez l'heure d'envoi et les paramètres de répétition" },
  { id: 5, label: "Confirmation",  desc: "Vérifiez et confirmez l'envoi" },
];

const SCHEDULE_OPTIONS = [
  { value: "now",  label: "Maintenant",     hours: 0  },
  { value: "1h",   label: "Dans 1 heure",   hours: 1  },
  { value: "2h",   label: "Dans 2 heures",  hours: 2  },
  { value: "3h",   label: "Dans 3 heures",  hours: 3  },
  { value: "6h",   label: "Dans 6 heures",  hours: 6  },
  { value: "12h",  label: "Dans 12 heures", hours: 12 },
  { value: "24h",  label: "Dans 24 heures", hours: 24 },
];

// ── Unités de temps pour l'intervalle ──────────────────────────────────────────
type IntervalUnit = "min" | "h" | "j";

const INTERVAL_UNIT_OPTIONS: { value: IntervalUnit; label: string; toMinutes: (v: number) => number }[] = [
  { value: "min", label: "Minutes", toMinutes: (v) => v },
  { value: "h",   label: "Heures",  toMinutes: (v) => v * 60 },
  { value: "j",   label: "Jours",   toMinutes: (v) => v * 60 * 24 },
];

// Presets par unité
const INTERVAL_PRESETS: Record<IntervalUnit, { value: number; label: string }[]> = {
  min: [
    { value: 5,   label: "5 min"  },
    { value: 10,  label: "10 min" },
    { value: 15,  label: "15 min" },
    { value: 30,  label: "30 min" },
  ],
  h: [
    { value: 1,  label: "1h"  },
    { value: 2,  label: "2h"  },
    { value: 3,  label: "3h"  },
    { value: 6,  label: "6h"  },
    { value: 12, label: "12h" },
  ],
  j: [
    { value: 1, label: "1 jour"  },
    { value: 2, label: "2 jours" },
    { value: 3, label: "3 jours" },
    { value: 7, label: "1 sem."  },
  ],
};

// Convertit la valeur affichée + unité en minutes (pour le message envoyé)
function toMinutes(value: number, unit: IntervalUnit): number {
  return INTERVAL_UNIT_OPTIONS.find(u => u.value === unit)!.toMinutes(value);
}

// Affichage lisible de l'intervalle
function displayInterval(value: number, unit: IntervalUnit): string {
  const unitLabel = INTERVAL_UNIT_OPTIONS.find(u => u.value === unit)!.label.toLowerCase();
  return `${value} ${unitLabel}`;
}

interface MultiSelection {
  categorieId:       number;
  categorieName:     string;
  sousCategorieId:   number;
  sousCategorieName: string;
  audioName?:        string;
  mobileId?:         string;
}

// ═══════════════════════════════════════════════════════════════════════
// Composants partagés
// ═══════════════════════════════════════════════════════════════════════

function MiniPlayer({ url }: { url: string }) {
  const [playing,  setPlaying]  = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const a = new Audio(url);
    audioRef.current = a;
    a.addEventListener("timeupdate",     () => setProgress(a.currentTime));
    a.addEventListener("loadedmetadata", () => setDuration(a.duration));
    a.addEventListener("ended",          () => setPlaying(false));
    return () => { a.pause(); a.src = ""; };
  }, [url]);

  function toggle(e: React.MouseEvent) {
    e.stopPropagation();
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else         { a.play();  setPlaying(true);  }
  }

  function fmt(s: number) {
    const m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  return (
    <div className="sa-mini-player" onClick={e => e.stopPropagation()}>
      <button className="sa-play-btn" onClick={toggle}>
        {playing ? <Pause size={12} /> : <Play size={12} />}
      </button>
      <input type="range" className="sa-seek" min={1} max={duration || 1} step={1}
        value={progress} onChange={e => {
          if (audioRef.current) audioRef.current.currentTime = +e.target.value;
          setProgress(+e.target.value);
        }} />
      <span className="sa-time">{fmt(progress)} / {fmt(duration)}</span>
    </div>
  );
}

function OptionCard({ selected, onClick, title, subtitle, icon: Icon, disabled }: any) {
  return (
    <button
      className={`sa-option-card${selected ? " selected" : ""}${disabled ? " disabled" : ""}`}
      onClick={onClick} disabled={disabled} type="button"
    >
      {Icon && <Icon size={20} className="sa-option-icon" />}
      <div className="sa-option-text">
        <span className="sa-option-title">{title}</span>
        {subtitle && <span className="sa-option-subtitle">{subtitle}</span>}
      </div>
      {selected && <CheckCircle size={16} className="sa-option-check" />}
    </button>
  );
}

function StepperBar({ steps, step }: { steps: typeof STEPS_SIMPLE; step: number }) {
  return (
    <div className="sa-stepper">
      {steps.map((s, i) => (
        <div key={s.id} className={`sa-step${i === step ? " active" : ""}${i < step ? " done" : ""}`}>
          <div className="sa-step-dot">
            {i < step ? <CheckCircle size={14} /> : <span>{i + 1}</span>}
          </div>
          <span className="sa-step-label">{s.label}</span>
          {i < steps.length - 1 && <div className="sa-step-line" />}
        </div>
      ))}
    </div>
  );
}

function ZonesStep({
  provinces, filteredRegions, filteredDistricts, filteredVillages,
  selectedProvinces, selectedRegions, selectedDistricts, selectedVillages,
  toggleFn, previewLoading, sireneCount, sirenePrev,
}: any) {
  return (
    <div className="sa-zones">
      {[
        { label: "Provinces", items: provinces,         sel: selectedProvinces, setFn: (id: number) => toggleFn(selectedProvinces, "provinces", id), hint: "" },
        { label: "Régions",   items: filteredRegions,   sel: selectedRegions,   setFn: (id: number) => toggleFn(selectedRegions, "regions", id),   hint: selectedProvinces.length > 0 ? "(filtrées par province)" : "" },
        { label: "Districts", items: filteredDistricts, sel: selectedDistricts, setFn: (id: number) => toggleFn(selectedDistricts, "districts", id), hint: selectedRegions.length > 0 ? "(filtrés par région)" : "" },
        {
          label: "Villages", items: filteredVillages, sel: selectedVillages,
          setFn: (id: number) => toggleFn(selectedVillages, "villages", id),
          hint: selectedDistricts.length > 0 ? "(filtrés par district)" : selectedRegions.length > 0 ? "(filtrés par région)" : "(optionnel — affiner par village)",
        },
      ].map(({ label, items, sel, setFn, hint }) => (
        <div key={label} className="sa-zone-group">
          <h4>{label}{hint && <span className="sa-zone-filter-hint">{hint}</span>}</h4>
          <div className="sa-checkboxes">
            {items.length === 0
              ? <span className="sa-zone-empty">Aucun élément disponible</span>
              : items.map((item: any) => (
                <label key={item.id} className={`sa-checkbox${sel.includes(item.id) ? " checked" : ""}`}>
                  <input type="checkbox" checked={sel.includes(item.id)} onChange={() => setFn(item.id)} />
                  {item.name}
                </label>
              ))}
          </div>
        </div>
      ))}
      <div className="sa-sirene-preview">
        <div className="sa-sirene-preview-header">
          <Radio size={14} />
          {previewLoading
            ? <span>Calcul en cours…</span>
            : <span><strong>{sireneCount}</strong> sirène{sireneCount > 1 ? "s" : ""} active{sireneCount > 1 ? "s" : ""} dans les zones sélectionnées</span>}
        </div>
        {sirenePrev.length > 0 && (
          <div className="sa-sirene-list">
            {sirenePrev.slice(0, 8).map((s: any) => (
              <span key={s.id} className="sa-sirene-chip">{s.imei}{s.village?.name ? ` — ${s.village.name}` : ""}</span>
            ))}
            {sirenePrev.length > 8 && <span className="sa-sirene-chip sa-sirene-more">+{sirenePrev.length - 8} autres</span>}
          </div>
        )}
      </div>
    </div>
  );
}

// ── PlanificationStep avec intervalle multi-unités ────────────────────────────

function PlanificationStep({
  schedule, setSchedule,
  repeatCount, setRepeatCount,
  repeatInterval, setRepeatInterval,
  intervalUnit, setIntervalUnit,
}: any) {
  const presets = INTERVAL_PRESETS[intervalUnit as IntervalUnit];
  const intervalInMinutes = repeatCount > 1 ? repeatInterval : "0";

  //  toMinutes(repeatInterval, intervalUnit as IntervalUnit);

  return (
    <div className="sa-planification">

      {/* ── Heure d'envoi ── */}
      <div className="sa-plan-section">
        <div className="sa-plan-section-title"><Clock size={15} /><span>Heure d'envoi</span></div>
        <div className="sa-schedule">
          {SCHEDULE_OPTIONS.map(opt => (
            <button key={opt.value} type="button"
              className={`sa-schedule-card${schedule === opt.value ? " selected" : ""}`}
              onClick={() => setSchedule(opt.value)}>
              {opt.value === "now" ? <Zap size={16} /> : <Clock size={16} />}
              <span>{opt.label}</span>
              {schedule === opt.value && <CheckCircle size={14} className="sa-option-check" />}
            </button>
          ))}
        </div>
      </div>

      {/* ── Répétition ── */}
      <div className="sa-plan-section">
        <div className="sa-plan-section-title"><RotateCcw size={15} /><span>Répétition de la diffusion</span></div>
        <p className="sa-plan-section-desc">
          Définissez combien de fois l'alerte audio sera répétée et l'intervalle entre chaque diffusion.
        </p>

        <div className="sa-repeat-grid">

          {/* Nombre de répétitions */}
          <div className="sa-repeat-field">
            <label className="sa-repeat-label"><RotateCcw size={13} />Nombre de répétitions</label>
            <div className="sa-repeat-stepper">
              <button type="button" className="sa-repeat-btn"
                onClick={() => setRepeatCount((v: number) => Math.max(1, v - 1))}>−</button>
              <input type="number" className="sa-repeat-input" min={1} max={99} step={1} value={repeatCount}
                onChange={e => setRepeatCount(Math.max(1, Math.min(99, parseInt(e.target.value) || 1)))} />
              <button type="button" className="sa-repeat-btn"
                onClick={() => setRepeatCount((v: number) => Math.min(99, v + 1))}>+</button>
            </div>
            <span className="sa-repeat-hint">
              {repeatCount === 1 ? "Diffusé 1 seule fois" : `Diffusé ${repeatCount} fois`}
            </span>
          </div>

          {/* Intervalle avec choix d'unité */}
          <div className="sa-repeat-field">
            <label className="sa-repeat-label"><Timer size={13} />Intervalle entre diffusions</label>

            {/* Sélecteur d'unité */}
            <div className="sa-interval-unit-tabs">
              {INTERVAL_UNIT_OPTIONS.map(u => (
                <button key={u.value} type="button"
                  className={`sa-interval-unit-tab${intervalUnit === u.value ? " selected" : ""}`}
                  disabled={repeatCount <= 1}
                  onClick={() => {
                    setIntervalUnit(u.value);
                    // Reset au premier preset de la nouvelle unité
                    setRepeatInterval(INTERVAL_PRESETS[u.value][0].value);
                  }}>
                  {u.label}
                </button>
              ))}
            </div>

            {/* Presets selon l'unité */}
            <div className="sa-interval-options">
              {presets.map(opt => (
                <button key={opt.value} type="button"
                  className={`sa-interval-chip${repeatInterval === opt.value ? " selected" : ""}`}
                  onClick={() => setRepeatInterval(opt.value)}
                  disabled={repeatCount <= 1}>
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Saisie manuelle */}
            <div className="sa-interval-custom">
              <span className="sa-repeat-hint">Valeur personnalisée :</span>
              <input type="number" className="sa-repeat-input sa-repeat-input--sm"
                min={1} max={999} 
                value={repeatInterval}
                disabled={repeatCount <= 1}
                onChange={e => setRepeatInterval(Math.max(1, parseFloat(e.target.value)))} />
              <span className="sa-repeat-hint">
                {INTERVAL_UNIT_OPTIONS.find(u => u.value === intervalUnit)?.label.toLowerCase()}
              </span>
            </div>

            {repeatCount <= 1 && (
              <span className="sa-repeat-hint sa-repeat-hint--warn">
                L'intervalle n'est actif qu'avec 2 répétitions ou plus
              </span>
            )}
          </div>
        </div>

        {/* Aperçu du message */}
        <div className="sa-message-preview">
          <div className="sa-message-preview-header">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span>Aperçu du message</span>
          </div>

          <div className="sa-message-preview-parts">
            <div className="sa-msg-part sa-msg-part--id">
              <span className="sa-msg-part-label">identifiant audio</span>
            </div>
            <span className="sa-msg-plus">+</span>
            <div className="sa-msg-part">
              <span className="sa-msg-part-label">répétitions</span>
              <code className="sa-msg-part-val">{repeatCount}</code>
            </div>
            <span className="sa-msg-plus">+</span>
            <div className={`sa-msg-part${repeatCount <= 1 ? " sa-msg-part--disabled" : ""}`}>
              <span className="sa-msg-part-label">intervalle ({intervalUnit}) </span>
              <code className="sa-msg-part-val">
                {repeatCount > 1 ? intervalInMinutes : "0"}
              </code>
            </div>
          </div>

          <div className="sa-message-preview-example">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
            </svg>
            <span>Exemple :</span>
            <code>ALERTE_767 {repeatCount}{repeatCount > 1 ? ` ${intervalInMinutes}${intervalUnit}` : " 0"}</code>
            {repeatCount > 1 && (
              <span className="sa-msg-interval-human">
                = {displayInterval(repeatInterval, intervalUnit as IntervalUnit)} entre chaque diffusion
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Écran d'accueil
// ═══════════════════════════════════════════════════════════════════════

function ModeSelectionScreen({ onSelect }: { onSelect: (mode: "simple" | "multi") => void }) {
  const toArr = (r: any) => Array.isArray(r) ? r : r?.response ?? [];

  const { data: rawSirenes }       = useQuery({ queryKey: ["sirenes"],       queryFn: () => sirenesApi.getAll() });
  const { data: rawProvinces }     = useQuery({ queryKey: ["provinces"],     queryFn: () => provincesApi.getAll() });
  const { data: rawNotifications } = useQuery({ queryKey: ["notifications"], queryFn: () => notificationsApi.getAll() });
  const { data: contractData }     = useQuery({ queryKey: ["available-messages"], queryFn: () => sirenesApi.getAvalaibleMessage() });

  const availableMessages = (contractData as any)?.[0]?.availableUnits ?? null;

  const sirenes       = useMemo(() => toArr(rawSirenes),       [rawSirenes]);
  const provinces     = useMemo(() => toArr(rawProvinces),     [rawProvinces]);
  const notifications = useMemo(() => toArr(rawNotifications), [rawNotifications]);

  const activeSirenes = useMemo(() => sirenes.filter((s: any) => s.isActive).length, [sirenes]);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const alertesThisMonth = useMemo(() =>
    notifications.filter((n: any) => n.status === "sent" && new Date(n.sendingTime) >= startOfMonth).length,
    [notifications]);

  const planned = useMemo(() =>
    notifications.filter((n: any) => n.status === "pending" && n.sendingTimeAfterAlerte).length,
    [notifications]);

  const lastAlertes = useMemo(() => {
    const sent = [...notifications]
      .filter((n: any) => n.status === "sent" && n.sendingTime)
      .sort((a: any, b: any) => new Date(b.sendingTime).getTime() - new Date(a.sendingTime).getTime());
    const seen = new Set<string>();
    const result: any[] = [];
    for (const n of sent) {
      const key = `${n.type ?? n.message}__${new Date(n.sendingTime).toDateString()}`;
      if (!seen.has(key)) { seen.add(key); result.push(n); }
      if (result.length >= 3) break;
    }
    return result;
  }, [notifications]);

  const dotColors = ["#3b82f6", "#f59e0b", "#22c55e"];

  function relativeTime(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1) return "il y a moins d'1h";
    if (h < 24) return `il y a ${h}h`;
    return `il y a ${Math.floor(h / 24)}j`;
  }

  return (
    <div className="sa-home">
      <div className="sa-hero">
        <svg className="sa-hero-waves-svg" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          {[50, 80, 110, 145, 180].map((r) => (
            <circle key={r} cx="320" cy="150" r={r} fill="none" stroke="white" strokeWidth="0.8" opacity={0.06} />
          ))}
          <circle cx="320" cy="150" r="18" fill="white" opacity="0.12" />
          <circle cx="320" cy="150" r="8"  fill="white" opacity="0.25" />
        </svg>
        <div className="sa-hero-left">
          <div className="sa-hero-badge"><span className="sa-hero-pulse" />Système actif</div>
          <h1 className="sa-hero-title">Envoyer une alerte</h1>
          <p className="sa-hero-desc">Déclenchez une diffusion audio vers les sirènes ciblées — en temps réel ou planifiée, simple ou groupée.</p>
        </div>
        <div className="sa-hero-right">
          <div className="sa-hero-stat-card">
            <div className="sa-hero-stat-icon sa-hero-stat-icon--green"><Radio size={16} /></div>
            <div><div className="sa-hero-stat-val">{activeSirenes || "—"}</div><div className="sa-hero-stat-lbl">Sirènes actives</div></div>
          </div>
          <div className="sa-hero-stat-card">
            <div className="sa-hero-stat-icon sa-hero-stat-icon--blue"><Bell size={16} /></div>
            <div><div className="sa-hero-stat-val">{alertesThisMonth || "0"}</div><div className="sa-hero-stat-lbl">SMS ce mois</div></div>
          </div>
          <div className="sa-hero-stat-card">
            <div className="sa-hero-stat-icon sa-hero-stat-icon--amber"><Send size={16} /></div>
            <div>
              <div className="sa-hero-stat-val">{availableMessages !== null ? availableMessages.toLocaleString("fr-FR") : "—"}</div>
              <div className="sa-hero-stat-lbl">SMS disponibles</div>
            </div>
          </div>
        </div>
      </div>

      <div className="sa-stats-row">
        <div className="sa-stat-card"><span className="sa-stat-val">{provinces.length || "—"}</span><span className="sa-stat-lbl">Provinces</span></div>
        <div className="sa-stat-card"><span className="sa-stat-val">{sirenes.length || "—"}</span><span className="sa-stat-lbl">Sirènes au total</span></div>
        <div className="sa-stat-card"><span className="sa-stat-val">{alertesThisMonth || "0"}</span><span className="sa-stat-lbl">Alertes ce mois</span></div>
        <div className="sa-stat-card"><span className="sa-stat-val">{planned || "0"}</span><span className="sa-stat-lbl">Planifiées</span></div>
      </div>

      <div className="sa-home-section-label">Choisir le mode d'envoi</div>
      <div className="sa-mode-grid">
        <button className="sa-mode-card sa-mode-card--simple" onClick={() => onSelect("simple")}>
          <div className="sa-mode-card-accent sa-mode-card-accent--simple" />
          <div className="sa-mode-icon sa-mode-icon--simple"><Send size={22} /></div>
          <div className="sa-mode-card-body"><h3>Envoi simple</h3><p>Envoyez une seule sous-catégorie d'alerte vers les zones sélectionnées.</p></div>
          <div className="sa-mode-card-footer"><span className="sa-mode-badge">1 message audio</span><span className="sa-mode-arrow">→</span></div>
        </button>
        <button className="sa-mode-card sa-mode-card--multi" onClick={() => onSelect("multi")}>
          <div className="sa-mode-card-accent sa-mode-card-accent--multi" />
          <div className="sa-mode-icon sa-mode-icon--multi"><Layers size={22} /></div>
          <div className="sa-mode-card-body"><h3>Envoi groupé</h3><p>Sélectionnez plusieurs catégories et sous-catégories à envoyer simultanément.</p></div>
          <div className="sa-mode-card-footer"><span className="sa-mode-badge sa-mode-badge--multi">Plusieurs messages audio</span><span className="sa-mode-arrow">→</span></div>
        </button>
      </div>

      {lastAlertes.length > 0 && (
        <div className="sa-home-history">
          <div className="sa-home-section-label">Dernières alertes envoyées</div>
          <div className="sa-last-alertes">
            {lastAlertes.map((n: any, i: number) => (
              <div key={n.id} className="sa-last-alerte-item">
                <div className="sa-last-alerte-dot" style={{ background: dotColors[i % dotColors.length] }} />
                <div className="sa-last-alerte-info">
                  <span className="sa-last-alerte-name">{n.type || n.message}</span>
                  <span className="sa-last-alerte-meta">{relativeTime(n.sendingTime)}</span>
                </div>
                <span className="sa-last-alerte-badge"><Radio size={10} />SMS envoyé</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Page principale
// ═══════════════════════════════════════════════════════════════════════

export default function SendAlerte() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<"simple" | "multi" | null>(null);
  const [step,              setStep]              = useState(0);
  const [alerteId,          setAlerteId]          = useState<number | null>(null);
  const [alerteTypeId,      setAlerteTypeId]      = useState<number | null>(null);
  const [selectedProvinces, setSelectedProvinces] = useState<number[]>([]);
  const [selectedRegions,   setSelectedRegions]   = useState<number[]>([]);
  const [selectedDistricts, setSelectedDistricts] = useState<number[]>([]);
  const [selectedVillages,  setSelectedVillages]  = useState<number[]>([]);
  const [schedule,          setSchedule]          = useState("now");
  const [repeatCount,       setRepeatCount]       = useState(1);
  const [repeatInterval,    setRepeatInterval]    = useState(1);
  // ← nouveau : unité de l'intervalle
  const [intervalUnit,      setIntervalUnit]      = useState<IntervalUnit>("min");
  const [success,           setSuccess]           = useState<any>(null);

  const [categorieId,     setCategorieId]     = useState<number | null>(null);
  const [sousCategorieId, setSousCategorieId] = useState<number | null>(null);

  const [selections,     setSelections]     = useState<MultiSelection[]>([]);
  const [tmpCategorieId, setTmpCategorieId] = useState<number | null>(null);
  const [tmpSousCatId,   setTmpSousCatId]   = useState<number | null>(null);

  const toArr = (r: any) => Array.isArray(r) ? r : r?.response ?? [];

  const { data: rawAlertes }   = useQuery({ queryKey: ["alertes"],                queryFn: () => alertesApi.getAll() });
  const { data: rawTypes }     = useQuery({ queryKey: ["alerte-types"],           queryFn: () => alerteTypesApi.getAll(), enabled: !!alerteId });
  const { data: rawCats }      = useQuery({ queryKey: ["categorie-alertes"],      queryFn: () => categorieAlertesApi.getAll(), enabled: !!alerteTypeId });
  const { data: rawSousCats }  = useQuery({ queryKey: ["sous-categorie-alertes"], queryFn: () => sousCategorieAlertesApi.getAll(), enabled: !!alerteTypeId });
  const { data: rawAudios }    = useQuery({ queryKey: ["alerte-audios"],          queryFn: () => alerteAudiosApi.getAll() });
  const { data: rawProvinces } = useQuery({ queryKey: ["provinces"],              queryFn: () => provincesApi.getAll() });
  const { data: rawRegions }   = useQuery({ queryKey: ["regions"],                queryFn: () => regionsApi.getAll() });
  const { data: rawDistricts } = useQuery({ queryKey: ["districts"],              queryFn: () => districtsApi.getAll() });
  const { data: rawVillages }  = useQuery({ queryKey: ["villages"],               queryFn: () => villagesApi.getAll() });

  const alertes      = useMemo(() => toArr(rawAlertes).filter((a: any) => !EXCLUDED_ALERTE_NAMES.includes(a.name.toLowerCase())), [rawAlertes]);
  const allTypes     = useMemo(() => toArr(rawTypes),    [rawTypes]);
  const allCats      = useMemo(() => toArr(rawCats),     [rawCats]);
  const allSousCats  = useMemo(() => toArr(rawSousCats), [rawSousCats]);
  const allAudios    = useMemo(() => toArr(rawAudios),   [rawAudios]);
  const provinces    = useMemo(() => toArr(rawProvinces),[rawProvinces]);
  const allRegions   = useMemo(() => toArr(rawRegions),  [rawRegions]);
  const allDistricts = useMemo(() => toArr(rawDistricts),[rawDistricts]);
  const allVillages  = useMemo(() => toArr(rawVillages), [rawVillages]);

  const types    = useMemo(() => alerteId     ? allTypes.filter((t: any) => Number(t.alerteId)        === alerteId)     : [], [allTypes, alerteId]);
  const cats     = useMemo(() => alerteTypeId ? allCats.filter((c: any)  => Number(c.alerteTypeId)    === alerteTypeId) : [], [allCats, alerteTypeId]);
  const sousCats = useMemo(() => alerteTypeId ? allSousCats.filter((s: any) => Number(s.alerteTypeId) === alerteTypeId) : [], [allSousCats, alerteTypeId]);

  // ── Sous-cats filtrées pour le picker multi ──
  // ← FIX : on filtre par categorieId seulement, sans exclure ceux déjà dans selections
  //   L'exclusion se fait uniquement au niveau de la sous-catégorie déjà ajoutée
  const tmpSousCatsFiltered = useMemo(() =>
    tmpCategorieId ? allSousCats.filter((s: any) => Number(s.categorieAlerteId) === tmpCategorieId) : [],
    [allSousCats, tmpCategorieId]);

  const filteredRegions = useMemo(() =>
    selectedProvinces.length ? allRegions.filter((r: any) => selectedProvinces.includes(Number(r.provinceId ?? r.province_id))) : allRegions,
    [allRegions, selectedProvinces]);

  const filteredDistricts = useMemo(() =>
    selectedRegions.length ? allDistricts.filter((d: any) => selectedRegions.includes(Number(d.regionId ?? d.region_id))) : allDistricts,
    [allDistricts, selectedRegions]);

  const filteredVillages = useMemo(() => {
    if (selectedDistricts.length) return allVillages.filter((v: any) => selectedDistricts.includes(Number(v.districtId ?? v.district_id)));
    if (selectedRegions.length) {
      const dids = allDistricts.filter((d: any) => selectedRegions.includes(Number(d.regionId ?? d.region_id))).map((d: any) => d.id);
      return allVillages.filter((v: any) => dids.includes(Number(v.districtId ?? v.district_id)));
    }
    return allVillages;
  }, [allVillages, allDistricts, selectedDistricts, selectedRegions]);

  const { data: previewData, isFetching: previewLoading } = useQuery({
    queryKey: ["sirene-preview", selectedProvinces, selectedRegions, selectedDistricts, selectedVillages],
    queryFn:  () => sendAlerteApi.preview(selectedProvinces, selectedRegions, selectedDistricts, selectedVillages),
    enabled:  (mode === "simple" && step === 4) || (mode === "multi" && step === 3) || step === 6 || step === 5,
  });

  const sireneCount = (previewData as any)?.sireneCount ?? 0;
  const sirenePrev  = (previewData as any)?.sirenes ?? [];

  const linkedAudio = useMemo(() =>
    sousCategorieId ? allAudios.find((a: any) => Number(a.sousCategorieAlerteId) === sousCategorieId) : null,
    [allAudios, sousCategorieId]);

  const selSchedule = SCHEDULE_OPTIONS.find(o => o.value === schedule);

  // Intervalle converti en minutes pour le message
  const intervalInMinutes = repeatCount > 1 ? `${repeatInterval}${intervalUnit}` : "0";
  // useMemo(() =>
  //   repeatCount > 1 ? toMinutes(repeatInterval, intervalUnit) : undefined, [repeatCount, repeatInterval, intervalUnit]);

  function toggleZone(arr: number[], type: string, id: number) {
    const setters: any = { provinces: setSelectedProvinces, regions: setSelectedRegions, districts: setSelectedDistricts, villages: setSelectedVillages };
    setters[type]((p: number[]) => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  }

  function addSelection() {
    if (!tmpCategorieId || !tmpSousCatId) return;
    // ← FIX : on vérifie uniquement que la sous-catégorie n'est pas déjà dans la liste
    // deux sous-catégories de la même catégorie sont autorisées
    if (selections.some(s => s.categorieId === tmpCategorieId)) return;

    const cat     = allCats.find((c: any) => c.id === tmpCategorieId);
    const sousCat = allSousCats.find((s: any) => s.id === tmpSousCatId);
    const audio   = allAudios.find((a: any) => Number(a.sousCategorieAlerteId) === tmpSousCatId);
    setSelections(prev => [...prev, {
      categorieId: tmpCategorieId, categorieName: cat?.name ?? "",
      sousCategorieId: tmpSousCatId, sousCategorieName: sousCat?.name ?? "",
      audioName: audio?.name ?? audio?.originalFilename, mobileId: audio?.mobileId,
    }]);
    setTmpCategorieId(null);
    setTmpSousCatId(null);
  }

  function removeSelection(id: number) { setSelections(prev => prev.filter(s => s.sousCategorieId !== id)); }

  function buildMessage(mobileId: string) {
    if (repeatCount <= 1) return `${mobileId} ${repeatCount} 0`;
    return `${mobileId} ${repeatCount} ${repeatInterval}${intervalUnit}`;
  }

  const sendSimpleMut = useMutation({
    mutationFn: (payload: SendAlertePayload) => sendAlerteApi.send(payload),
    onSuccess: (result) => setSuccess({ ...result, mode: "simple" }),
  });

  const sendMultiMut = useMutation({
    mutationFn: async (payloads: SendAlertePayload[]) => {
      let totalCreated = 0, totalSent = 0, totalPlanned = 0;
      for (const p of payloads) {
        const r = await sendAlerteApi.send(p) as any;
        totalCreated += r.created ?? 0; totalSent += r.sent ?? 0; totalPlanned += r.planned ?? 0;
      }
      return { created: totalCreated, sent: totalSent, planned: totalPlanned };
    },
    onSuccess: (result) => setSuccess({ ...result, mode: "multi" }),
  });

  function buildScheduledDate() {
    if (schedule === "now") return undefined;
    return new Date(Date.now() + SCHEDULE_OPTIONS.find(o => o.value === schedule)!.hours * 3600000).toISOString();
  }

  function handleSendSimple() {
    console.log('intervalInMinutes:',intervalInMinutes)
    sendSimpleMut.mutate({
      alerteId: alerteId!, alerteTypeId: alerteTypeId!,
      categorieAlerteId: categorieId!, sousCategorieAlerteId: sousCategorieId!,
      provinceIds: selectedProvinces, regionIds: selectedRegions,
      districtIds: selectedDistricts, villageIds: selectedVillages,
      repeatCount, repeatInterval: intervalInMinutes   ,
      sendingTimeAfterAlerte: buildScheduledDate(),
    });
  }

  function handleSendMulti() {
    sendMultiMut.mutate(selections.map(sel => ({
      alerteId: alerteId!, alerteTypeId: alerteTypeId!,
      categorieAlerteId: sel.categorieId, sousCategorieAlerteId: sel.sousCategorieId,
      provinceIds: selectedProvinces, regionIds: selectedRegions,
      districtIds: selectedDistricts, villageIds: selectedVillages,
      repeatCount, repeatInterval: intervalInMinutes,
      sendingTimeAfterAlerte: buildScheduledDate(),
    })));
  }

  function resetAll() {
    setMode(null); setStep(0);
    setAlerteId(null); setAlerteTypeId(null);
    setCategorieId(null); setSousCategorieId(null);
    setSelections([]); setTmpCategorieId(null); setTmpSousCatId(null);
    setSelectedProvinces([]); setSelectedRegions([]); setSelectedDistricts([]); setSelectedVillages([]);
    setRepeatCount(1); setRepeatInterval(1); setIntervalUnit("min");
    setSchedule("now"); setSuccess(null);
  }

  function canNext() {
    if (mode === "simple") {
      switch (step) {
        case 0: return !!alerteId;
        case 1: return !!alerteTypeId;
        case 2: return !!categorieId;
        case 3: return !!sousCategorieId;
        case 4: return (selectedProvinces.length + selectedRegions.length + selectedDistricts.length + selectedVillages.length) > 0;
        case 5: return !!schedule && repeatCount >= 1;
        default: return true;
      }
    } else {
      switch (step) {
        case 0: return !!alerteId;
        case 1: return !!alerteTypeId;
        case 2: return selections.length > 0;
        case 3: return (selectedProvinces.length + selectedRegions.length + selectedDistricts.length + selectedVillages.length) > 0;
        case 4: return !!schedule && repeatCount >= 1;
        default: return true;
      }
    }
  }

  const isPending = sendSimpleMut.isPending || sendMultiMut.isPending;
  const isError   = sendSimpleMut.isError   || sendMultiMut.isError;
  const errMsg    = (sendSimpleMut.error || sendMultiMut.error as any)?.message;
  const STEPS     = mode === "multi" ? STEPS_MULTI : STEPS_SIMPLE;

  const zoneSummary = [
    selectedProvinces.length ? `${selectedProvinces.length} prov.` : null,
    selectedRegions.length   ? `${selectedRegions.length} rég.`    : null,
    selectedDistricts.length ? `${selectedDistricts.length} dist.` : null,
    selectedVillages.length  ? `${selectedVillages.length} vill.`  : null,
  ].filter(Boolean).join(" · ") || "—";

  if (success) {
    return (
      <AppLayout>
        <div className="sa-success-page">
          <div className="sa-success-card">
            <div className="sa-success-icon"><CheckCircle size={48} /></div>
            <h2>Alerte{success.mode === "multi" ? "s groupées" : ""} envoyée{success.mode === "multi" ? "s" : ""} avec succès</h2>
            <p>L'opération s'est déroulée correctement.</p>
            <div className="sa-success-stats">
              <div><span>{success.created}</span><label>Notifications créées</label></div>
              <div><span>{success.sent}</span><label>SMS envoyés</label></div>
              <div><span>{success.planned}</span><label>Planifiés</label></div>
            </div>
            <div className="sa-success-actions">
              <button className="btn-cancel" onClick={() => navigate("/notifications")}>Voir les notifications</button>
              <button className="btn-primary" onClick={resetAll}>Nouvelle alerte</button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!mode) {
    return (
      <AppLayout>
        <div className="sa-page"><ModeSelectionScreen onSelect={(m) => setMode(m)} /></div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="sa-page">
        <div className="sa-header">
          <div>
            <h1>
              {mode === "simple" ? "Envoi simple" : "Envoi groupé"}
              <span className={`sa-mode-pill${mode === "multi" ? " multi" : ""}`}>
                {mode === "simple" ? <><Send size={11} /> Simple</> : <><Layers size={11} /> Groupé</>}
              </span>
            </h1>
            <p>Configurez et envoyez une alerte aux sirènes ciblées</p>
          </div>
          <button className="btn-cancel" style={{ fontSize: "0.8rem" }} onClick={resetAll}>← Changer de mode</button>
        </div>

        <StepperBar steps={STEPS} step={step} />

        <div className="sa-card">
          <div className="sa-card-header">
            <h2>{STEPS[step].label}</h2>
            <p>{STEPS[step].desc}</p>
          </div>
          <div className="sa-card-body">

            {step === 0 && (
              <div className="sa-options-grid">
                {alertes.map((a: any) => (
                  <OptionCard key={a.id} selected={alerteId === a.id} title={a.name} icon={AlertTriangle}
                    onClick={() => { setAlerteId(a.id); setAlerteTypeId(null); setCategorieId(null); setSousCategorieId(null); setSelections([]); }} />
                ))}
              </div>
            )}

            {step === 1 && (
              <div className="sa-options-grid">
                {types.map((t: any) => (
                  <OptionCard key={t.id} selected={alerteTypeId === t.id} title={t.name}
                    onClick={() => { setAlerteTypeId(t.id); setCategorieId(null); setSousCategorieId(null); setSelections([]); setTmpCategorieId(null); setTmpSousCatId(null); }} />
                ))}
              </div>
            )}

            {mode === "simple" && step === 2 && (
              <div className="sa-options-grid sa-options-grid--single">
                {cats.map((c: any) => (
                  <OptionCard key={c.id} selected={categorieId === c.id} title={c.name}
                    onClick={() => { setCategorieId(c.id); setSousCategorieId(null); }} />
                ))}
              </div>
            )}

            {mode === "simple" && step === 3 && (
              <div className="sa-options-grid">
                {sousCats.filter((s: any) => Number(s.categorieAlerteId) === categorieId).map((s: any) => {
                  const audio = allAudios.find((a: any) => Number(a.sousCategorieAlerteId) === s.id);
                  const isSelected = sousCategorieId === s.id;
                  return (
                    <div key={s.id} className={`sa-sous-cat-card${isSelected ? " selected" : ""}`} onClick={() => setSousCategorieId(s.id)}>
                      <div className="sa-sous-cat-header">
                        <div className="sa-sous-cat-info">
                          <Music size={15} className="sa-sous-cat-icon" />
                          <div>
                            <span className="sa-option-title">{s.name}</span>
                            {audio ? <span className="sa-audio-name">{audio.name || audio.originalFilename}</span>
                                   : <span className="sa-no-audio">Aucun audio associé</span>}
                          </div>
                        </div>
                        {isSelected && <CheckCircle size={16} className="sa-option-check" />}
                      </div>
                      {audio && isSelected && <MiniPlayer url={alerteAudiosApi.audioUrl(audio.audio)} />}
                    </div>
                  );
                })}
              </div>
            )}

            {mode === "simple" && step === 4 && (
              <ZonesStep provinces={provinces} filteredRegions={filteredRegions} filteredDistricts={filteredDistricts}
                filteredVillages={filteredVillages} selectedProvinces={selectedProvinces} selectedRegions={selectedRegions}
                selectedDistricts={selectedDistricts} selectedVillages={selectedVillages}
                toggleFn={toggleZone} previewLoading={previewLoading} sireneCount={sireneCount} sirenePrev={sirenePrev} />
            )}

            {mode === "simple" && step === 5 && (
              <PlanificationStep
                schedule={schedule} setSchedule={setSchedule}
                repeatCount={repeatCount} setRepeatCount={setRepeatCount}
                repeatInterval={repeatInterval} setRepeatInterval={setRepeatInterval}
                intervalUnit={intervalUnit} setIntervalUnit={setIntervalUnit}
              />
            )}

            {mode === "simple" && step === 6 && (
              <div className="sa-confirm">
                <div className="sa-confirm-grid">
                  {[
                    ["Alerte",          alertes.find((a: any) => a.id === alerteId)?.name],
                    ["Type",            types.find((t: any) => t.id === alerteTypeId)?.name],
                    ["Catégorie",       cats.find((c: any) => c.id === categorieId)?.name],
                    ["Sous-catégorie",  sousCats.find((s: any) => s.id === sousCategorieId)?.name],
                    ["Zones",           zoneSummary],
                    ["Planification",   selSchedule?.label],
                    ["Répétitions",     repeatCount > 1
                      ? `${repeatCount} fois — ${displayInterval(repeatInterval, intervalUnit)} entre chaque`
                      : "1 fois (sans répétition)"],
                    ["Sirènes ciblées", previewLoading ? "…" : `${sireneCount} sirène${sireneCount > 1 ? "s" : ""}`],
                  ].map(([label, value]) => (
                    <div key={label as string} className="sa-confirm-item">
                      <span className="sa-confirm-label">{label}</span>
                      <span className="sa-confirm-value">{value || "—"}</span>
                    </div>
                  ))}
                </div>
                {linkedAudio && (
                  <div className="sa-confirm-audio">
                    <Music size={14} />
                    <span>Audio : <strong>{linkedAudio.name || linkedAudio.originalFilename}</strong> — mobileId : <code>{linkedAudio.mobileId}</code></span>
                    <MiniPlayer url={alerteAudiosApi.audioUrl(linkedAudio.audio)} />
                  </div>
                )}
                <div className="sa-confirm-message-preview">
                  <span className="sa-confirm-label">Message qui sera envoyé :</span>
                  <code className="sa-message-preview-code">
                    {linkedAudio?.mobileId ? buildMessage(linkedAudio.mobileId) : buildMessage(`ALERTE_${sousCategorieId}`)}
                  </code>
                </div>
                <div className="sa-confirm-warning">
                  <AlertTriangle size={15} />
                  <span>
                    {schedule === "now" ? `${sireneCount} SMS vont être envoyés immédiatement.` : `${sireneCount} SMS seront envoyés ${selSchedule?.label?.toLowerCase()}.`}
                    {repeatCount > 1 && ` L'audio sera répété ${repeatCount} fois, toutes les ${displayInterval(repeatInterval, intervalUnit)}.`}
                  </span>
                </div>
                {isError && <div className="form-error">{errMsg || "Erreur lors de l'envoi"}</div>}
              </div>
            )}

            {/* ── MODE MULTI ── */}

            {mode === "multi" && step === 2 && (
              <div className="sa-multi-select">
                <div className="sa-multi-picker">
                  <div className="sa-multi-picker-title"><Plus size={14} /> Ajouter une sous-catégorie</div>
                  <div className="sa-multi-picker-fields">
                    <div className="sirene-field">
                      <label>Catégorie</label>
                      <select value={tmpCategorieId ?? ""} onChange={e => { setTmpCategorieId(Number(e.target.value) || null); setTmpSousCatId(null); }}>
                        <option value="">— Choisir une catégorie —</option>
                        {cats.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="sirene-field">
                      <label>Sous-catégorie</label>
                      <select value={tmpSousCatId ?? ""} disabled={!tmpCategorieId}
                        onChange={e => setTmpSousCatId(Number(e.target.value) || null)}>
                        <option value="">{!tmpCategorieId ? "Choisir d'abord une catégorie" : "— Choisir —"}</option>
                        {tmpSousCatsFiltered.map((s: any) => {
                          // ← FIX : on désactive uniquement les sous-catégories DÉJÀ ajoutées
                          // pas toute la catégorie — plusieurs sous-cats de la même catégorie OK
                          const categorieDejaUtilisee = selections.some(sel => sel.categorieId === tmpCategorieId);
                          return (
                            <option key={s.id} value={s.id} disabled={categorieDejaUtilisee}>
                              {s.name}{categorieDejaUtilisee ? " (catégorie déjà sélectionnée)" : ""}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <button className="btn-primary sa-multi-add-btn" type="button"
                      disabled={!tmpCategorieId || !tmpSousCatId}
                      onClick={addSelection}>
                      <Plus size={14} /> Ajouter
                    </button>
                  </div>
                </div>

                <div className="sa-multi-list">
                  <div className="sa-multi-list-title">
                    <List size={14} />
                    {selections.length} sous-catégorie{selections.length > 1 ? "s" : ""} sélectionnée{selections.length > 1 ? "s" : ""}
                    {/* Résumé par catégorie */}
                    {selections.length > 0 && (
                      <span className="sa-multi-cat-summary">
                        {Object.entries(
                          selections.reduce<Record<string, number>>((acc, s) => {
                            acc[s.categorieName] = (acc[s.categorieName] ?? 0) + 1;
                            return acc;
                          }, {})
                        ).map(([cat, count]) => (
                          <span key={cat} className="sa-multi-cat-chip">{cat} × {count}</span>
                        ))}
                      </span>
                    )}
                  </div>
                  {selections.length === 0 && (
                    <p className="sa-multi-empty">Aucune sélection — ajoutez au moins une sous-catégorie ci-dessus.</p>
                  )}
                  {selections.map(sel => {
                    const audio = allAudios.find((a: any) => Number(a.sousCategorieAlerteId) === sel.sousCategorieId);
                    return (
                      <div key={sel.sousCategorieId} className="sa-multi-item">
                        <div className="sa-multi-item-info">
                          <Music size={13} className="sa-sous-cat-icon" />
                          <div>
                            <span className="sa-multi-item-cat">{sel.categorieName}</span>
                            <span className="sa-multi-item-sous">{sel.sousCategorieName}</span>
                            {audio ? <span className="sa-audio-name">{audio.name || audio.originalFilename} — <code>{audio.mobileId}</code></span>
                                   : <span className="sa-no-audio">Aucun audio associé</span>}
                          </div>
                        </div>
                        {audio && <MiniPlayer url={alerteAudiosApi.audioUrl(audio.audio)} />}
                        <button className="sa-multi-remove" onClick={() => removeSelection(sel.sousCategorieId)} title="Supprimer">
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {mode === "multi" && step === 3 && (
              <ZonesStep provinces={provinces} filteredRegions={filteredRegions} filteredDistricts={filteredDistricts}
                filteredVillages={filteredVillages} selectedProvinces={selectedProvinces} selectedRegions={selectedRegions}
                selectedDistricts={selectedDistricts} selectedVillages={selectedVillages}
                toggleFn={toggleZone} previewLoading={previewLoading} sireneCount={sireneCount} sirenePrev={sirenePrev} />
            )}

            {mode === "multi" && step === 4 && (
              <PlanificationStep
                schedule={schedule} setSchedule={setSchedule}
                repeatCount={repeatCount} setRepeatCount={setRepeatCount}
                repeatInterval={repeatInterval} setRepeatInterval={setRepeatInterval}
                intervalUnit={intervalUnit} setIntervalUnit={setIntervalUnit}
              />
            )}

            {mode === "multi" && step === 5 && (
              <div className="sa-confirm">
                <div className="sa-confirm-grid">
                  {[
                    ["Alerte",           alertes.find((a: any) => a.id === alerteId)?.name],
                    ["Type",             types.find((t: any) => t.id === alerteTypeId)?.name],
                    ["Sous-catégories",  `${selections.length} sélectionnée${selections.length > 1 ? "s" : ""}`],
                    ["Zones",            zoneSummary],
                    ["Planification",    selSchedule?.label],
                    ["Répétitions",      repeatCount > 1
                      ? `${repeatCount} fois — ${displayInterval(repeatInterval, intervalUnit)} entre chaque`
                      : "1 fois (sans répétition)"],
                    ["Sirènes ciblées",  previewLoading ? "…" : `${sireneCount} sirène${sireneCount > 1 ? "s" : ""}`],
                    ["SMS total estimé", previewLoading ? "…" : `${sireneCount * selections.length} SMS`],
                  ].map(([label, value]) => (
                    <div key={label as string} className="sa-confirm-item">
                      <span className="sa-confirm-label">{label}</span>
                      <span className="sa-confirm-value">{value || "—"}</span>
                    </div>
                  ))}
                </div>
                <div className="sa-multi-confirm-list">
                  {selections.map(sel => (
                    <div key={sel.sousCategorieId} className="sa-multi-confirm-item">
                      <Music size={12} />
                      <span>{sel.categorieName} → {sel.sousCategorieName}</span>
                      {sel.mobileId && <code>{buildMessage(sel.mobileId)}</code>}
                    </div>
                  ))}
                </div>
                <div className="sa-confirm-warning">
                  <AlertTriangle size={15} />
                  <span>
                    {selections.length} alerte{selections.length > 1 ? "s" : ""} × {sireneCount} sirène{sireneCount > 1 ? "s" : ""} = <strong>{sireneCount * selections.length} SMS</strong>
                    {schedule === "now" ? " envoyés immédiatement." : ` ${selSchedule?.label?.toLowerCase()}.`}
                    {repeatCount > 1 && ` Répété ${repeatCount} fois, toutes les ${displayInterval(repeatInterval, intervalUnit)}.`}
                  </span>
                </div>
                {isError && <div className="form-error">{errMsg || "Erreur lors de l'envoi"}</div>}
              </div>
            )}

          </div>
        </div>

        <div className="sa-nav">
          <button className="btn-cancel" onClick={() => step === 0 ? resetAll() : setStep(s => s - 1)}>
            <ChevronLeft size={15} /> {step === 0 ? "Changer de mode" : "Précédent"}
          </button>
          {step < STEPS.length - 1 ? (
            <button className="btn-primary" onClick={() => setStep(s => s + 1)} disabled={!canNext()}>
              Suivant <ChevronRight size={15} />
            </button>
          ) : (
            <button className="btn-send" disabled={isPending || sireneCount === 0}
              onClick={mode === "simple" ? handleSendSimple : handleSendMulti}>
              {isPending
                ? <><Loader2 size={15} className="spin" /> Envoi en cours…</>
                : <><Send size={15} /> Envoyer {mode === "multi" ? `(${selections.length} alertes)` : "l'alerte"}</>}
            </button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}