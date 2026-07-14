import { useRef, useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { sirenesApi }            from "@/services/sirene.api";
import { notificationsBngrcApi } from "@/services/notificationBngrc.api";
import { AppLayout }             from "@/components/AppLayout";
import { Radio, MapPin, Activity, AlertTriangle, Layers, Map as MapIcon, Bell, Clock, } from "lucide-react";

// ─── helpers ──────────────────────────────────────────────────────────────────
const toArr = (r: any) =>
  Array.isArray(r) ? r : r?.response ?? r?.data ?? [];

const ALERT_GAP_MS     = 2_000;
const POLL_INTERVAL_MS = 10_000;

// Antananarivo bounds (au lieu de Madagascar entier)
const MDG_BOUNDS = { sw: [-19.05, 47.35], ne: [-18.75, 47.65] } as const;
const MDG_CENTER: [number, number] = [-18.8792, 47.5079]; // Antananarivo centre
const MDG_ZOOM   = 12;

// ─── Types ────────────────────────────────────────────────────────────────────
interface ActiveAlert {
  notificationId: number;
  sireneId: number;
  startAt: Date;
  endAt:   Date;
  notification: any;
}

// ─── Son d'alerte combiné : sirène oscillante + voix "Alerte" ────────────────
const ALERT_VOICE_REPEAT      = 4;
const ALERT_SOUND_DURATION_MS = 10_000;

function playSirenSound(sireneDuration = 3): void {
  try {
    const ctx        = new (window.AudioContext || (window as any).webkitAudioContext)();
    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
    masterGain.gain.setValueAtTime(0, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.45, ctx.currentTime + 0.1);
    masterGain.gain.setValueAtTime(0.45, ctx.currentTime + sireneDuration - 0.3);
    masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + sireneDuration);

    const cycleMs  = 0.8;
    const freqLow  = 600;
    const freqHigh = 1200;
    const cycles   = Math.ceil(sireneDuration / cycleMs);

    [0, 8].forEach(detune => {
      const osc = ctx.createOscillator();
      const g   = ctx.createGain();
      osc.connect(g); g.connect(masterGain);
      osc.type = "sawtooth";
      g.gain.setValueAtTime(detune === 0 ? 1 : 0.25, ctx.currentTime);
      for (let i = 0; i < cycles; i++) {
        const t = ctx.currentTime + i * cycleMs;
        osc.frequency.linearRampToValueAtTime(freqLow  + detune, t);
        osc.frequency.linearRampToValueAtTime(freqHigh + detune, t + cycleMs / 2);
        osc.frequency.linearRampToValueAtTime(freqLow  + detune, t + cycleMs);
      }
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + sireneDuration);
    });
    setTimeout(() => ctx.close(), (sireneDuration + 0.5) * 1_000);
  } catch (_) {}
}

function speakAlerte() {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  function getBestVoice(): SpeechSynthesisVoice | null {
    const voices = window.speechSynthesis.getVoices();
    return (
      voices.find(v => v.lang === "fr-FR" && !v.localService === false) ??
      voices.find(v => v.lang === "fr-FR") ??
      voices.find(v => v.lang.startsWith("fr")) ?? null
    );
  }
  function speak() {
    const voice = getBestVoice();
    const text  = Array(ALERT_VOICE_REPEAT).fill("Alerte").join(". ");
    const startedAt = Date.now();
    const make = () => {
      const utt = new SpeechSynthesisUtterance(text);
      if (voice) utt.voice = voice;
      utt.lang = "fr-FR"; utt.rate = 0.85; utt.pitch = 1.1; utt.volume = 1;
      return utt;
    };
    const utt = make();
    utt.onend = () => {
      if (Date.now() - startedAt < ALERT_SOUND_DURATION_MS - 1_500)
        setTimeout(() => window.speechSynthesis.speak(make()), 600);
    };
    window.speechSynthesis.speak(utt);
  }
  if (window.speechSynthesis.getVoices().length > 0) speak();
  else window.speechSynthesis.addEventListener("voiceschanged", speak, { once: true });
}

function playAlertSound() {
  playSirenSound(3);
  setTimeout(() => speakAlerte(), 800);
}

// ─── Icône SVG sirène ─────────────────────────────────────────────────────────
// Couleurs : actif = vert (#16a34a), alerte/scintillement = rouge (#dc2626), inactif = jaune (#eab308)
function sireneSVG(active: boolean, isOwned: boolean, isBlinking: boolean) {
  // isBlinking (alerte déclenchée) → rouge
  // active (actif sans alerte) → vert
  // inactif → jaune
  const fill = isBlinking ? "#dc2626" : (active ? "#16a34a" : "#eab308");
  const ring = isBlinking ? "#fecaca" : (active ? "#bbf7d0" : "#fef9c3");
  return `
    <div class="sirene-map-icon ${active ? "active" : "inactive"} ${isBlinking ? "blinking-alert" : ""}">
      <div class="sirene-pulse-ring" style="background:${ring}"></div>
      ${isBlinking ? `<div class="sirene-alert-ring"></div>` : ""}
      <div class="sirene-marker" style="background:${fill}">
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
      <div class="sirene-pin-tail" style="background:${fill}"></div>
    </div>`;
}

// ─── CSS ─────────────────────────────────────────────────────────────────────
const MAP_CSS = `
  .sirene-map-icon { position:relative; width:44px; height:54px; display:flex; flex-direction:column; align-items:center; cursor:pointer; }
  .sirene-pulse-ring { position:absolute; top:0; left:50%; transform:translateX(-50%); width:44px; height:44px; border-radius:50%; animation:sirene-pulse 2.4s ease-out infinite; opacity:0; }
  .sirene-map-icon.inactive .sirene-pulse-ring { animation:none; opacity:0.15; }
  .sirene-alert-ring { position:absolute; top:-4px; left:50%; transform:translateX(-50%); width:52px; height:52px; border-radius:50%; border:3px solid #dc2626; animation:alert-ring-pulse 0.6s ease-in-out infinite alternate; z-index:3; }
  @keyframes alert-ring-pulse { 0%{transform:translateX(-50%) scale(0.9);opacity:1} 100%{transform:translateX(-50%) scale(1.2);opacity:0.3} }
  .blinking-alert .sirene-marker { animation:sirene-blink 0.5s ease-in-out infinite alternate !important; }
  @keyframes sirene-blink { 0%{box-shadow:0 4px 14px rgba(0,0,0,0.22),0 0 0 3px white,0 0 20px #dc2626;transform:scale(1)} 100%{box-shadow:0 4px 24px rgba(220,38,38,0.8),0 0 0 4px #fee2e2,0 0 35px #dc2626;transform:scale(1.15)} }
  .blinking-alert .sirene-pulse-ring { background:#fca5a5 !important; animation:sirene-pulse-fast 0.8s ease-out infinite !important; }
  @keyframes sirene-pulse-fast { 0%{transform:translateX(-50%) scale(0.6);opacity:0.9} 100%{transform:translateX(-50%) scale(2);opacity:0} }
  @keyframes sirene-pulse { 0%{transform:translateX(-50%) scale(0.6);opacity:0.7} 100%{transform:translateX(-50%) scale(1.6);opacity:0} }
  .sirene-marker { position:relative; z-index:2; width:38px; height:38px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 14px rgba(0,0,0,0.22),0 0 0 3px white; transition:transform 0.15s ease; }
  .sirene-map-icon:hover .sirene-marker { transform:scale(1.12); }
  .sirene-pin-tail { width:3px; height:12px; border-radius:0 0 3px 3px; margin-top:-2px; z-index:1; }
  .leaflet-popup-content-wrapper { border-radius:14px !important; padding:0 !important; overflow:hidden; box-shadow:0 8px 32px rgba(0,0,0,0.14) !important; border:0.5px solid #e2e8f0 !important; }
  .leaflet-popup-content { margin:0 !important; min-width:240px; }
  .leaflet-popup-tip-container { display:none; }
`;

// ─── Popup HTML — localisation + aléa ────────────────────────────────────────
// Quand alerte active : header rouge, détails alertes en rouge
// Sans alerte : vert si actif, jaune si inactif
function buildPopupHTML(s: any, alert?: ActiveAlert) {
  const headerFill = alert ? "#dc2626" : (s.isActive ? "#16a34a" : "#eab308");
  const row  = (k: string, v: string) => `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
      <span style="color:#64748b;font-size:11px;white-space:nowrap;">${k}</span>
      <span style="color:#1e293b;font-weight:500;font-size:11px;text-align:right;">${v}</span>
    </div>`;

  const alertSection = alert ? (() => {
    const n    = alert.notification;
    const typeName = n.categorieAlerteBngrc?.type?.name ?? "—";
    const categName = n.categorieAlerteBngrc?.name ?? "—";
    const senderName = n.user
      ? (`${n.user.first_name ?? ""} ${n.user.last_name ?? ""}`.trim() || "—")
      : "—";
    const region   = (s.village?.region?.name   ?? s.village?.district?.region?.name ?? "—").toUpperCase();
    const district = (s.village?.district?.name ?? "—").toUpperCase();

    return `
      <div style="background:#fef2f2;border-top:1px solid #fecaca;padding:10px 14px;">
        <div style="color:#991b1b;font-size:11px;font-weight:700;text-transform:uppercase;
                    letter-spacing:0.05em;margin-bottom:8px;display:flex;align-items:center;gap:5px;">
          <span style="width:7px;height:7px;border-radius:50%;background:#dc2626;display:inline-block;
                       animation:blink-dot 0.5s infinite alternate;"></span>
          ALERTE EN COURS
        </div>
        <div style="display:flex;flex-direction:column;gap:5px;">
          ${row("Aléa",      typeName)}
          ${row("Catégorie", categName)}
          ${row("Région",    region)}
          ${row("District",  district)}
          ${n.sendingTime ? row("Heure d'envoi", new Date(n.sendingTime).toLocaleTimeString("fr-FR")) : ""}
          ${row("Envoyé par", senderName)}
        </div>
      </div>
      <style>@keyframes blink-dot{0%{opacity:1}100%{opacity:0.2}}</style>`;
  })() : "";

  return `
    <div style="font-family:system-ui,sans-serif;font-size:13px;">
      <div style="background:${headerFill};padding:12px 14px;">
        <div style="color:white;font-weight:700;font-size:14px;margin-bottom:2px;">
          ${s.name ?? s.imei ?? `Sirène #${s.id}`}
        </div>
        <div style="color:rgba(255,255,255,0.8);font-size:11px;">
          📍 ${s.village?.name ?? "Village inconnu"}
        </div>
      </div>
      <div style="padding:10px 14px;display:flex;flex-direction:column;gap:6px;">
        ${s.village?.district ? row("District", s.village.district.name.toUpperCase()) : ""}
        ${s.village?.region   ? row("Région",   s.village.region.name.toUpperCase())   : ""}
        ${s.village?.province ? row("Province", s.village.province.name.toUpperCase()) : ""}
      </div>
      ${alertSection}
    </div>`;
}

// ─── Popup HTML depuis la liste latérale (clic sur alerte récente) ────────────
// Fond gris, aléa en gras, zones, référence sirène en bas
function buildListPopupHTML(s: any, n: any) {
  const typeName  = n.categorieAlerteBngrc?.type?.name ?? "—";
  const categName = n.categorieAlerteBngrc?.name ?? "—";
  const region    = (s.village?.region?.name   ?? s.village?.district?.region?.name ?? "—").toUpperCase();
  const district  = (s.village?.district?.name ?? "—").toUpperCase();
  const commune   = (s.village?.commune?.name  ?? "—").toUpperCase();
  const sireneName = s.name ?? s.imei ?? `Sirène #${s.id}`;
  const senderName = n.user
    ? (`${n.user.first_name ?? ""} ${n.user.last_name ?? ""}`.trim() || "—")
    : "—";

  const row = (k: string, v: string) => `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:3px 0;">
      <span style="color:#64748b;font-size:11px;white-space:nowrap;">${k}</span>
      <span style="color:#374151;font-weight:500;font-size:11px;text-align:right;">${v}</span>
    </div>`;

  return `
    <div style="font-family:system-ui,sans-serif;font-size:13px;min-width:240px;">
      <!-- Header gris -->
      <div style="background:#475569;padding:12px 14px;">
        <div style="color:white;font-weight:800;font-size:15px;margin-bottom:3px;letter-spacing:0.01em;">
          🌀 ${typeName}
        </div>
        <div style="color:rgba(255,255,255,0.75);font-size:11px;font-weight:500;">${categName}</div>
      </div>
      <!-- Zones -->
      <div style="padding:10px 14px;background:#f8fafc;border-bottom:0.5px solid #e2e8f0;">
        <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Zone</div>
        ${row("Région",   region)}
        ${row("District", district)}
        ${row("Commune",  commune)}
        ${s.village?.name ? row("Village", s.village.name.toUpperCase()) : ""}
      </div>
      <!-- Détails envoi -->
      <div style="padding:8px 14px;background:#f8fafc;border-bottom:0.5px solid #e2e8f0;">
        ${n.sendingTime ? row("Envoyé le", new Date(n.sendingTime).toLocaleString("fr-FR", {day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})) : ""}
        ${row("Envoyé par", senderName)}
      </div>
      <!-- Référence sirène -->
      <div style="padding:8px 14px;background:#fff;">
        <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Référence sirène</div>
        <div style="font-size:12px;color:#64748b;display:flex;align-items:center;gap:5px;">
          📡 ${sireneName}
          ${s.village?.name ? `<span style="color:#94a3b8">· ${s.village.name}</span>` : ""}
        </div>
      </div>
    </div>`;
}

// ─── Helpers heure ────────────────────────────────────────────────────────────
function fmtTime(d: string | Date) {
  return new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}
function fmtDate(d: string | Date) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}
function timeAgo(d: string | Date) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)  return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${Math.floor(h / 24)}j`;
}

// ─── Calcul plage 01h00–23h59 du jour courant ─────────────────────────────────
function getTodayRange(): { startDate: string; endDate: string } {
  const now  = new Date();
  const year = now.getFullYear();
  const m    = String(now.getMonth() + 1).padStart(2, "0");
  const d    = String(now.getDate()).padStart(2, "0");
  const startDate = `${year}-${m}-${d}T01:00:00`;
  const endDate   = `${year}-${m}-${d}T23:59:59`;
  return { startDate, endDate };
}

// ─── Liste latérale : alertes du jour ────────────────────────────────────────
function NotifSideList({ notifs, onSelect, sirenes = [] }: { notifs: any[]; onSelect: (n: any) => void; sirenes?: any[] }) {
  if (!notifs.length) return (
    <div style={{ padding: "24px 16px", textAlign: "center", color: "#94a3b8", fontFamily: "system-ui,sans-serif" }}>
      <Clock size={24} style={{ margin: "0 auto 8px", display: "block", opacity: 0.4 }} />
      <div style={{ fontSize: 12 }}>Aucune alerte aujourd'hui</div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {notifs.map((n) => {
        const typeName  = n.categorieAlerteBngrc?.type?.name ?? "—";
        const catName   = n.categorieAlerteBngrc?.name ?? "—";
        const sid       = n.sireneId ?? n.sirene?.id;
        // Enrichir avec la sirène complète depuis le store (getAllForMap) qui a toutes les relations
        const fullSirene = sirenes.find((s: any) => s.id === sid);
        const v         = fullSirene?.village ?? n.sirene?.village;
        const sirenName = fullSirene?.name ?? fullSirene?.imei ?? n.sirene?.name ?? n.sirene?.imei ?? `#${n.sireneId}`;
        const region    = (v?.region?.name   ?? v?.district?.region?.name ?? "—").toUpperCase();
        const district  = (v?.district?.name ?? "—").toUpperCase();
        const commune   = (v?.commune?.name  ?? "—").toUpperCase();

        return (
          <div
            key={n.id}
            onClick={() => onSelect(n)}
            style={{
              padding: "10px 14px",
              borderBottom: "0.5px solid #f1f5f9",
              cursor: "pointer",
              transition: "background 0.1s",
              fontFamily: "system-ui,sans-serif",
            }}
            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "#fafbfc"}
            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}
          >
            {/* Ligne 1 : type alerte en gras + heure */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#dc2626" }}>
                🌀 {typeName}
              </span>
              <span style={{ fontSize: 10, color: "#94a3b8", fontFamily: "monospace" }}>
                {fmtTime(n.sendingTime)}
              </span>
            </div>
            {/* Ligne 2 : catégorie (non gras) */}
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>
              {catName}
            </div>
            {/* Ligne 3 : Zones en gras */}
            <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>
              {region} · {district} · {commune}
            </div>
            {/* Ligne 4 : référence sirène, non gras, discret */}
            <div style={{ fontSize: 11, color: "#94a3b8" }}>
              📡 {sirenName}
            </div>
          </div>
        );
      })}
    </div>
  );
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

function StatusChip({ value, current, label, color, bg, onClick }: any) {
  const active = current === value;
  return (
    <button onClick={() => onClick(active ? "all" : value)} style={{
      display: "flex", alignItems: "center", gap: 5, padding: "5px 12px",
      borderRadius: 20, border: "none",
      background: active ? bg : "#f8fafc", color: active ? color : "#64748b",
      fontSize: 12, fontWeight: active ? 600 : 400, cursor: "pointer",
      boxShadow: active ? `inset 0 0 0 1.5px ${color}` : "inset 0 0 0 1px #e2e8f0",
      transition: "all .15s", fontFamily: "inherit",
    }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: active ? color : "#cbd5e1", flexShrink: 0 }} />
      {label}
    </button>
  );
}

// ─── Panneau alertes en cours (côté droit de la carte) ───────────────────────
function AlertPanel({ alerts, sirenes }: { alerts: ActiveAlert[]; sirenes: any[] }) {
  const [remaining, setRemaining] = useState<Map<number, number>>(new Map());

  useEffect(() => {
    if (!alerts.length) return;
    const tick = () => {
      const now = Date.now();
      const next = new Map<number, number>();
      alerts.forEach(a => next.set(a.notificationId, Math.max(0, Math.round((a.endAt.getTime() - now) / 1_000))));
      setRemaining(next);
    };
    tick();
    const t = setInterval(tick, 1_000);
    return () => clearInterval(t);
  }, [alerts]);

  if (!alerts.length) return null;

  return (
    <div style={{
      position: "absolute", top: 12, right: 12, zIndex: 1200,
      display: "flex", flexDirection: "column", gap: 8,
      maxHeight: "calc(100% - 24px)", overflowY: "auto", scrollbarWidth: "thin",
    }}>
      {alerts.length > 1 && (
        <div style={{
          background: "rgba(220,38,38,0.95)", borderRadius: 8, padding: "5px 12px",
          fontSize: 11, fontWeight: 700, color: "white", textAlign: "center",
          letterSpacing: "0.04em", boxShadow: "0 2px 8px rgba(220,38,38,0.4)",
        }}>
          🔊 {alerts.length} ALERTES EN COURS SIMULTANÉES
        </div>
      )}
      {alerts.map(a => {
        const n           = a.notification;
        const secs        = remaining.get(a.notificationId) ?? 0;
        const sirene      = sirenes.find((s: any) => s.id === a.sireneId);
        const sireneName  = sirene?.name ?? sirene?.imei ?? `Sirène #${a.sireneId}`;
        const villageName = sirene?.village?.name ?? "—";
        const region      = (sirene?.village?.region?.name ?? "—").toUpperCase();
        const district    = (sirene?.village?.district?.name ?? "—").toUpperCase();
        const typeName    = n.categorieAlerteBngrc?.type?.name ?? "—";
        const catName     = n.categorieAlerteBngrc?.name ?? "—";
        const sender      = n.user
          ? (`${n.user.first_name ?? ""} ${n.user.last_name ?? ""}`.trim() || "—")
          : "—";
        const totalSecs = Math.round((a.endAt.getTime() - a.startAt.getTime()) / 1_000);
        const progress  = totalSecs > 0 ? Math.max(0, Math.min(1, secs / totalSecs)) : 0;

        return (
          <div key={a.notificationId} style={{
            background: "rgba(255,255,255,0.97)", border: "1.5px solid #dc2626",
            borderRadius: 12, boxShadow: "0 4px 20px rgba(220,38,38,0.25)",
            fontFamily: "system-ui,sans-serif", width: 270, overflow: "hidden",
            animation: "slideInRight 0.3s ease",
          }}>
            <div style={{ background: "#dc2626", padding: "9px 12px", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 26, height: 26, borderRadius: "50%", background: "rgba(255,255,255,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                animation: "blink-bg 0.5s infinite alternate",
              }}>
                <Bell size={13} color="white" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "white", fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  🔊 {sireneName}
                </div>
                <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 10 }}>📍 {villageName}</div>
              </div>
              <div style={{ background: "rgba(0,0,0,0.18)", borderRadius: 6, padding: "2px 7px", color: "white", fontSize: 11, fontWeight: 700, fontFamily: "monospace", flexShrink: 0 }}>
                {String(Math.floor(secs / 60)).padStart(2, "0")}:{String(secs % 60).padStart(2, "0")}
              </div>
            </div>
            <div style={{ height: 3, background: "#fecaca" }}>
              <div style={{ height: "100%", background: "#dc2626", width: `${progress * 100}%`, transition: "width 1s linear" }} />
            </div>
            <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 5 }}>
              {[
                ["Aléa",      typeName],
                ["Catégorie", catName],
                ["Région",    region],
                ["District",  district],
                ["Envoyé à",  n.sendingTime ? new Date(n.sendingTime).toLocaleTimeString("fr-FR") : "—"],
                ["Envoyé par", sender],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 10, color: "#94a3b8" }}>{k}</span>
                  <span style={{ fontSize: 11, color: "#1e293b", fontWeight: k === "Aléa" ? 600 : 400, textAlign: "right", maxWidth: 155, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function SireneMapAlert() {
  const mapRef      = useRef<HTMLDivElement>(null);
  const leafletRef  = useRef<any>(null);
  const markersRef  = useRef<Map<number, any>>(new Map());
  const tileRef     = useRef<any>(null);
  const blinkTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const seenNotifIds = useRef<Map<number, number>>((() => {
    try {
      const stored = sessionStorage.getItem("seen_notif_bngrc");
      if (stored) {
        const entries: [number, number][] = JSON.parse(stored);
        const _now = Date.now();
        const fresh = entries.filter(([, endAt]) => _now - endAt < 35 * 60_000);
        return new Map<number, number>(fresh);
      }
    } catch (_) {}
    return new Map<number, number>();
  })());

  const [searchParams] = useSearchParams();
  const focusId = searchParams.get("id") ? Number(searchParams.get("id")) : null;
  const focusDoneRef = useRef(false);

  const [mapReady,     setMapReady]     = useState(false);
  const [mapMode,      setMapMode]      = useState<"map" | "satellite">("map");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const [activeAlerts, setActiveAlerts] = useState<Map<number, ActiveAlert>>(new Map());
  const [bannerAlerts, setBannerAlerts] = useState<ActiveAlert[]>([]);

  // ── Données ──────────────────────────────────────────────────────────────────
  const { data: rawSirenes, isLoading } = useQuery({
    queryKey: ["sirenes"], queryFn: () => sirenesApi.getAllForMap(),
  });

  const { data: rawActiveNotifs } = useQuery({
    queryKey: ["active-notifications-bngrc"],
    queryFn:  () => notificationsBngrcApi.getActive(),
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
  });

  // Alertes du jour courant : 01h00 → 23h59
  const todayRange = useMemo(() => getTodayRange(), []);
  const { data: rawToday } = useQuery({
    queryKey: ["today-notifications-bngrc", todayRange.startDate, todayRange.endDate],
    queryFn:  () => notificationsBngrcApi.getAll({
      startDate: todayRange.startDate,
      endDate:   todayRange.endDate,
      status:    "sent",
    }),
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
  });

  const sirenes = useMemo(() => toArr(rawSirenes), [rawSirenes]);

  // Liste du jour triée par sendingTime DESC
  const todayNotifs = useMemo(() => {
    const arr = toArr(rawToday);
    return [...arr].sort((a: any, b: any) =>
      new Date(b.sendingTime).getTime() - new Date(a.sendingTime).getTime()
    );
  }, [rawToday]);

  // ── Traitement alertes actives ────────────────────────────────────────────────
  useEffect(() => {
    const notifs: any[] = toArr(rawActiveNotifs);
    if (!notifs.length) return;
    const now = Date.now();

    seenNotifIds.current.forEach((endAt, id) => {
      if (now - endAt > 35 * 60_000) seenNotifIds.current.delete(id);
    });
    try {
      sessionStorage.setItem("seen_notif_bngrc",
        JSON.stringify(Array.from(seenNotifIds.current.entries()))
      );
    } catch (_) {}

    const bySirene = new Map<number, any[]>();
    notifs.forEach(n => {
      const sid = n.sireneId ?? n.sirene?.id;
      if (!sid) return;
      if (!bySirene.has(sid)) bySirene.set(sid, []);
      bySirene.get(sid)!.push(n);
    });

    const startTimers: ReturnType<typeof setTimeout>[] = [];

    const persistSeen = () => {
      try {
        const entries = Array.from(seenNotifIds.current.entries());
        sessionStorage.setItem("seen_notif_bngrc", JSON.stringify(entries));
      } catch (_) {}
    };

    const activateAlert = (n: any, sireneId: number, start: number, end: number) => {
      seenNotifIds.current.set(n.id, end);
      persistSeen();
      const alert: ActiveAlert = {
        notificationId: n.id, sireneId,
        startAt: new Date(start), endAt: new Date(end),
        notification: n,
      };
      setActiveAlerts(prev => { const m = new Map(prev); m.set(sireneId, alert); return m; });
      setBannerAlerts(prev => [...prev.filter(a => a.sireneId !== sireneId), alert]);
      playAlertSound();

      const prev = blinkTimers.current.get(sireneId);
      if (prev) clearTimeout(prev);
      const tEnd = setTimeout(() => {
        setActiveAlerts(p => { const m = new Map(p); m.delete(sireneId); return m; });
        setBannerAlerts(p => p.filter(a => a.sireneId !== sireneId));
        blinkTimers.current.delete(sireneId);
      }, end - Date.now());
      blinkTimers.current.set(sireneId, tEnd);
    };

    bySirene.forEach((sireneNotifs, sireneId) => {
      sireneNotifs.forEach(n => {
        const seenEnd = seenNotifIds.current.get(n.id);
        if (seenEnd !== undefined) return;
        const alertStart = now;
        const alertEnd   = now + ALERT_SOUND_DURATION_MS;
        activateAlert(n, sireneId, alertStart, alertEnd);
      });
    });

    return () => startTimers.forEach(t => clearTimeout(t));
  }, [rawActiveNotifs]);

  // ── Filtre statut ─────────────────────────────────────────────────────────────
  const visibleSirenes = useMemo(() => sirenes.filter((s: any) => {
    if (statusFilter === "active"   && !s.isActive) return false;
    if (statusFilter === "inactive" &&  s.isActive) return false;
    return true;
  }), [sirenes, statusFilter]);

  const withCoords = useMemo(
    () => visibleSirenes.filter((s: any) => s.latitude && s.longitude),
    [visibleSirenes]
  );
  const allWithCoords = useMemo(
    () => sirenes.filter((s: any) => s.latitude && s.longitude),
    [sirenes]
  );

  // ── Init Leaflet ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!document.getElementById("lf-css")) {
      const l = document.createElement("link"); l.id="lf-css"; l.rel="stylesheet";
      l.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; document.head.appendChild(l);
    }
    if (!document.getElementById("sirene-alert-css")) {
      const s = document.createElement("style"); s.id="sirene-alert-css"; s.textContent=MAP_CSS; document.head.appendChild(s);
    }
    if (!mapRef.current || leafletRef.current) return;
    import("leaflet").then((L: any) => {
      if (!mapRef.current || leafletRef.current) return;
      const map = L.map(mapRef.current, {
        center: MDG_CENTER,
        zoom:   MDG_ZOOM,
        zoomControl: false,
        maxBounds: L.latLngBounds(
          L.latLng(MDG_BOUNDS.sw[0], MDG_BOUNDS.sw[1]),
          L.latLng(MDG_BOUNDS.ne[0], MDG_BOUNDS.ne[1])
        ),
        maxBoundsViscosity: 1.0,
        minZoom: 11, // au lieu de 5
      });
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
        blinkTimers.current.forEach(t => clearTimeout(t)); blinkTimers.current.clear();
      }
    };
  }, []);

  // ── Tile switch ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !leafletRef.current) return;
    import("leaflet").then((L: any) => {
      if (tileRef.current) leafletRef.current.removeLayer(tileRef.current);
      const url  = mapMode === "satellite"
        ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
      tileRef.current = L.tileLayer(url, { attribution: mapMode === "satellite" ? "© Esri" : "© OpenStreetMap © CARTO", maxZoom: 19 }).addTo(leafletRef.current);
    });
  }, [mapMode, mapReady]);

  // ── Markers ───────────────────────────────────────────────────────────────────
  const activeAlertsRef = useRef(activeAlerts);
  useEffect(() => { activeAlertsRef.current = activeAlerts; }, [activeAlerts]);

  useEffect(() => {
    if (!mapReady || !leafletRef.current) return;
    import("leaflet").then((L: any) => {
      const map = leafletRef.current;
      markersRef.current.forEach(m => m.remove());
      markersRef.current.clear();

      withCoords.forEach((s: any) => {
        const isBlinking   = activeAlertsRef.current.has(s.id);
        const currentAlert = activeAlertsRef.current.get(s.id);

        const icon = L.divIcon({
          className: "",
          html: sireneSVG(!!s.isActive, !!s.isOwned, isBlinking),
          iconSize: [44, 54], iconAnchor: [22, 54], popupAnchor: [0, -56],
        });
        const marker = L.marker([parseFloat(s.latitude), parseFloat(s.longitude)], { icon }).addTo(map);
        marker.bindPopup(buildPopupHTML(s, currentAlert), { maxWidth: 280, minWidth: 240, closeButton: false });
        marker.on("click", () => marker.openPopup());
        markersRef.current.set(s.id, marker);
      });

      if (focusId && !focusDoneRef.current) {
        const target = withCoords.find((s: any) => s.id === focusId);
        if (target) {
          focusDoneRef.current = true;
          setTimeout(() => {
            leafletRef.current?.panTo([parseFloat(target.latitude), parseFloat(target.longitude)]);
            setTimeout(() => markersRef.current.get(focusId)?.openPopup(), 400);
          }, 300);
        }
      }
    });
  }, [mapReady, withCoords]);

  // ── Mise à jour chirurgicale des markers quand les alertes changent ──────────
  useEffect(() => {
    if (!mapReady || !leafletRef.current) return;
    import("leaflet").then((L: any) => {
      markersRef.current.forEach((marker, sireneId) => {
        const s            = withCoords.find((x: any) => x.id === sireneId);
        if (!s) return;
        const isBlinking   = activeAlerts.has(sireneId);
        const currentAlert = activeAlerts.get(sireneId);

        marker.setIcon(L.divIcon({
          className: "",
          html: sireneSVG(!!s.isActive, !!s.isOwned, isBlinking),
          iconSize: [44, 54], iconAnchor: [22, 54], popupAnchor: [0, -56],
        }));
        marker.setPopupContent(buildPopupHTML(s, currentAlert));
      });
    });
  }, [activeAlerts]);

  // ─────────────────────────────────────────────────────────────────────────────
  const activeCount   = sirenes.filter((s: any) =>  s.isActive).length;
  const inactiveCount = sirenes.filter((s: any) => !s.isActive).length;
  const blinkCount    = activeAlerts.size;

  // Clic sur liste latérale → pan + popup détails alerte (fond gris)
  function handleSelectFromList(n: any) {
    const sid = n.sireneId ?? n.sirene?.id;
    const sirene = sirenes.find((s: any) => s.id === sid);
    if (!sirene?.latitude || !leafletRef.current) return;

    import("leaflet").then((L: any) => {
      const marker = markersRef.current.get(sid);
      if (!marker) return;

      // Remplacer temporairement le contenu du popup par les détails de l'alerte (fond gris)
      marker.setPopupContent(buildListPopupHTML(sirene, n));
      leafletRef.current.panTo([parseFloat(sirene.latitude), parseFloat(sirene.longitude)]);
      setTimeout(() => marker.openPopup(), 400);

      // Quand le popup se ferme, restaurer le popup normal
      marker.once("popupclose", () => {
        const isBlinking   = activeAlerts.has(sid);
        const currentAlert = activeAlerts.get(sid);
        marker.setPopupContent(buildPopupHTML(sirene, currentAlert));
      });
    });
  }

  return (
    <AppLayout>
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 64px)" }}>

        {/* ── Header ── */}
        <div style={{ padding: "14px 24px", display: "flex", alignItems: "center", gap: 12, borderBottom: "0.5px solid #e2e8f0", background: "#fff", flexShrink: 0 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Radio size={17} color="#3b82f6" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1e293b" }}>Surveillance des alertes — Carte temps réel</h1>
            <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>
              {allWithCoords.length} sirène{allWithCoords.length > 1 ? "s" : ""} · polling toutes les {POLL_INTERVAL_MS / 1_000}s
            </p>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
            {blinkCount > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 20, padding: "4px 12px" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#dc2626", animation: "blink-bg 0.5s infinite alternate" }} />
                <span style={{ fontSize: 12, color: "#991b1b", fontWeight: 600 }}>{blinkCount} alerte{blinkCount > 1 ? "s" : ""} en cours</span>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Activity size={13} color={activeCount === sirenes.length ? "#22c55e" : "#f59e0b"} />
              <span style={{ fontSize: 12, color: "#64748b" }}><strong style={{ color: "#1e293b" }}>{activeCount}</strong>/{sirenes.length} actives</span>
            </div>
          </div>
        </div>

        {/* ── Toolbar (statut + basemap, sans filtres zone) ── */}
        <div style={{ padding: "10px 24px", background: "#fafbfc", borderBottom: "0.5px solid #e2e8f0", flexShrink: 0, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginRight: 2 }}>Statut</span>
            <StatusChip value="active"   current={statusFilter} label={`Actives (${activeCount})`}     color="#16a34a" bg="#f0fdf4" onClick={setStatusFilter} />
            <StatusChip value="inactive" current={statusFilter} label={`Inactives (${inactiveCount})`} color="#eab308" bg="#fefce8" onClick={setStatusFilter} />
          </div>
          <div style={{ marginLeft: "auto" }}>
            <MapToggle mode={mapMode} onChange={setMapMode} />
          </div>
        </div>

        {/* ── Corps principal : carte + liste latérale ── */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

          {/* Carte */}
          <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
            <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

            <AlertPanel alerts={bannerAlerts} sirenes={sirenes} />

            {statusFilter !== "all" && (
              <div style={{ position: "absolute", top: 12, left: 12, zIndex: 1000, background: "rgba(255,255,255,0.95)", border: "0.5px solid #e2e8f0", borderRadius: 8, padding: "6px 12px", fontSize: 12, color: "#1e293b", fontWeight: 600, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", display: "flex", alignItems: "center", gap: 6 }}>
                <Radio size={12} color="#3b82f6" />
                {visibleSirenes.length} sirène{visibleSirenes.length > 1 ? "s" : ""} filtrée{visibleSirenes.length > 1 ? "s" : ""}
              </div>
            )}

            {sirenes.length > allWithCoords.length && (
              <div style={{ position: "absolute", bottom: 14, left: 14, zIndex: 1000, background: "rgba(255,251,235,0.95)", border: "0.5px solid #fcd34d", borderRadius: 8, padding: "6px 11px", fontSize: 12, color: "#b45309", display: "flex", alignItems: "center", gap: 5 }}>
                <MapPin size={11} />
                {sirenes.length - allWithCoords.length} sirène{sirenes.length - allWithCoords.length > 1 ? "s" : ""} sans GPS
              </div>
            )}

            {isLoading && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.85)", zIndex: 2000 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", border: "3px solid #dbeafe", borderTop: "3px solid #3b82f6", animation: "spin 0.9s linear infinite", margin: "0 auto 10px" }} />
                  <div style={{ fontSize: 13, color: "#64748b" }}>Chargement…</div>
                </div>
              </div>
            )}
          </div>

          {/* ── Liste latérale : alertes du jour (01h–23h59) ── */}
          <div style={{ width: 300, flexShrink: 0, borderLeft: "0.5px solid #e2e8f0", background: "#fff", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "12px 14px", borderBottom: "0.5px solid #f1f5f9", background: "#fafbfc", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <AlertTriangle size={13} color="#dc2626" />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>Alertes du jour</span>
                {todayNotifs.length > 0 && (
                  <span style={{ marginLeft: "auto", background: "#fef2f2", color: "#dc2626", fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 10 }}>
                    {todayNotifs.length}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>
                01h00 – 23h59 · {new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "thin" }}>
              <NotifSideList notifs={todayNotifs} onSelect={handleSelectFromList} sirenes={sirenes} />
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes spin         { to { transform: rotate(360deg); } }
        @keyframes blink-bg     { 0%{opacity:1} 100%{opacity:0.3} }
        @keyframes slideInRight { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
      `}</style>
    </AppLayout>
  );
}