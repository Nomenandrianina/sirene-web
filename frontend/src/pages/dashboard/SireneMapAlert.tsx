import { useRef, useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { sirenesApi }            from "@/services/sirene.api";
import { provincesApi }          from "@/services/province.api";
import { regionsApi }            from "@/services/region.api";
import { notificationsBngrcApi } from "@/services/notificationBngrc.api";
import { AppLayout }             from "@/components/AppLayout";
import {
  Radio, MapPin, Activity, AlertTriangle,
  Layers, Map as MapIcon, ChevronDown, RotateCcw, Bell, Clock, User,
} from "lucide-react";

// ─── helpers ──────────────────────────────────────────────────────────────────
const toArr = (r: any) =>
  Array.isArray(r) ? r : r?.response ?? r?.data ?? [];

const ALERT_GAP_MS     = 2_000;
const POLL_INTERVAL_MS = 10_000;

// Madagascar bounds
const MDG_BOUNDS = { sw: [-26.0, 43.0], ne: [-11.5, 51.0] } as const;
const MDG_CENTER: [number, number] = [-19.5, 46.9];
const MDG_ZOOM   = 6;

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
function sireneSVG(active: boolean, isOwned: boolean, isBlinking: boolean) {
  const fill = !isOwned ? "#eab308" : active ? "#16a34a" : "#dc2626";
  const ring = isBlinking ? "#fbbf24" : active ? "#bbf7d0" : "#fecaca";
  return `
    <div class="sirene-map-icon ${active ? "active" : "inactive"} ${isBlinking ? "blinking-alert" : ""}">
      <div class="sirene-pulse-ring" style="background:${ring}"></div>
      ${isBlinking ? `<div class="sirene-alert-ring"></div>` : ""}
      <div class="sirene-marker" style="background:${isBlinking ? "#f59e0b" : fill}">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <rect x="9" y="13" width="6" height="5" rx="1" fill="white" opacity="0.95"/>
          <rect x="10" y="14" width="1.2" height="3" rx="0.4" fill="${isBlinking ? "#f59e0b" : fill}"/>
          <rect x="12.4" y="14" width="1.2" height="3" rx="0.4" fill="${isBlinking ? "#f59e0b" : fill}"/>
          <path d="M7.5 10.5 C6.5 11.8 6.5 13.2 7.5 14.5" stroke="white" stroke-width="1.4" stroke-linecap="round" fill="none" opacity="0.8"/>
          <path d="M5.5 8.5 C3.8 10.5 3.8 14.5 5.5 16.5" stroke="white" stroke-width="1.4" stroke-linecap="round" fill="none" opacity="0.5"/>
          <path d="M16.5 10.5 C17.5 11.8 17.5 13.2 16.5 14.5" stroke="white" stroke-width="1.4" stroke-linecap="round" fill="none" opacity="0.8"/>
          <path d="M18.5 8.5 C20.2 10.5 20.2 14.5 18.5 16.5" stroke="white" stroke-width="1.4" stroke-linecap="round" fill="none" opacity="0.5"/>
          <ellipse cx="12" cy="11" rx="3.5" ry="2.5" fill="white" opacity="0.95"/>
          <ellipse cx="12" cy="11" rx="2" ry="1.4" fill="${isBlinking ? "#f59e0b" : fill}"/>
          <circle cx="12" cy="11" r="0.8" fill="white" opacity="0.9"/>
          <rect x="10.5" y="18" width="3" height="1.2" rx="0.5" fill="white" opacity="0.8"/>
        </svg>
      </div>
      <div class="sirene-pin-tail" style="background:${isBlinking ? "#f59e0b" : fill}"></div>
    </div>`;
}

// ─── CSS ─────────────────────────────────────────────────────────────────────
const MAP_CSS = `
  .sirene-map-icon { position:relative; width:44px; height:54px; display:flex; flex-direction:column; align-items:center; cursor:pointer; }
  .sirene-pulse-ring { position:absolute; top:0; left:50%; transform:translateX(-50%); width:44px; height:44px; border-radius:50%; animation:sirene-pulse 2.4s ease-out infinite; opacity:0; }
  .sirene-map-icon.inactive .sirene-pulse-ring { animation:none; opacity:0.15; }
  .sirene-alert-ring { position:absolute; top:-4px; left:50%; transform:translateX(-50%); width:52px; height:52px; border-radius:50%; border:3px solid #f59e0b; animation:alert-ring-pulse 0.6s ease-in-out infinite alternate; z-index:3; }
  @keyframes alert-ring-pulse { 0%{transform:translateX(-50%) scale(0.9);opacity:1} 100%{transform:translateX(-50%) scale(1.2);opacity:0.3} }
  .blinking-alert .sirene-marker { animation:sirene-blink 0.5s ease-in-out infinite alternate !important; }
  @keyframes sirene-blink { 0%{box-shadow:0 4px 14px rgba(0,0,0,0.22),0 0 0 3px white,0 0 20px #f59e0b;transform:scale(1)} 100%{box-shadow:0 4px 24px rgba(245,158,11,0.8),0 0 0 4px #fef3c7,0 0 35px #f59e0b;transform:scale(1.15)} }
  .blinking-alert .sirene-pulse-ring { background:#fde68a !important; animation:sirene-pulse-fast 0.8s ease-out infinite !important; }
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
function buildPopupHTML(s: any, alert?: ActiveAlert) {
  const fill = alert ? "#f59e0b" : s.isActive ? "#16a34a" : "#dc2626";
  const row  = (k: string, v: string) => `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
      <span style="color:#64748b;font-size:11px;white-space:nowrap;">${k}</span>
      <span style="color:#1e293b;font-weight:500;font-size:11px;text-align:right;">${v}</span>
    </div>`;

  // Section alerte : localisation + aléa (TypeAlerteBngrc) au lieu de durée/email
  const alertSection = alert ? (() => {
    const n    = alert.notification;
    // Remonte la hiérarchie : notification → categorieAlerteBngrc → type (TypeAlerteBngrc) → name
    const typeName = n.categorieAlerteBngrc?.type?.name          // TypeAlerteBngrc.name
      ?? n.categorieAlerteBngrc?.alerte?.name                    // fallback AlerteBngrc
      ?? "—";
    const categName = n.categorieAlerteBngrc?.name ?? "—";
    const senderName = n.user
      ? (`${n.user.firstName ?? ""} ${n.user.lastName ?? ""}`.trim() || "—")
      : "—";
    const region   = s.village?.region?.name   ?? s.village?.district?.region?.name ?? "—";
    const district = s.village?.district?.name ?? "—";

    return `
      <div style="background:#fffbeb;border-top:1px solid #fde68a;padding:10px 14px;">
        <div style="color:#92400e;font-size:11px;font-weight:700;text-transform:uppercase;
                    letter-spacing:0.05em;margin-bottom:8px;display:flex;align-items:center;gap:5px;">
          <span style="width:7px;height:7px;border-radius:50%;background:#f59e0b;display:inline-block;
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
      <div style="background:${fill};padding:12px 14px;">
        <div style="color:white;font-weight:700;font-size:14px;margin-bottom:2px;">
          ${s.name ?? s.imei ?? `Sirène #${s.id}`}
        </div>
        <div style="color:rgba(255,255,255,0.8);font-size:11px;">
          📍 ${s.village?.name ?? "Village inconnu"}
        </div>
      </div>
      <div style="padding:10px 14px;display:flex;flex-direction:column;gap:6px;">
        ${s.village?.district ? row("District", s.village.district.name) : ""}
        ${s.village?.region   ? row("Région",   s.village.region.name)   : ""}
        ${s.village?.province ? row("Province", s.village.province.name) : ""}
      </div>
      ${alertSection}
    </div>`;
}

// ─── Liste latérale : dernières 24h ──────────────────────────────────────────
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

function NotifSideList({ notifs, onSelect }: { notifs: any[]; onSelect: (n: any) => void }) {
  if (!notifs.length) return (
    <div style={{ padding: "24px 16px", textAlign: "center", color: "#94a3b8", fontFamily: "system-ui,sans-serif" }}>
      <Clock size={24} style={{ margin: "0 auto 8px", display: "block", opacity: 0.4 }} />
      <div style={{ fontSize: 12 }}>Aucune alerte dans les 24 dernières heures</div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {notifs.map((n, i) => {
        const typeName  = n.categorieAlerteBngrc?.type?.name ?? "—";
        const catName   = n.categorieAlerteBngrc?.name ?? "—";
        const sirenName = n.sirene?.name ?? n.sirene?.imei ?? `#${n.sireneId}`;
        const region    = n.sirene?.village?.region?.name ?? n.sirene?.village?.district?.region?.name ?? "—";
        const district  = n.sirene?.village?.district?.name ?? "—";
        const sender    = n.user
          ? (`${n.user.firstName ?? ""} ${n.user.lastName ?? ""}`.trim() || "—")
          : "—";

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
            {/* Ligne 1 : aléa + heure */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
              <span style={{
                fontSize: 11, fontWeight: 700, color: "#ea580c",
                background: "#fff7ed", padding: "1px 7px", borderRadius: 8,
              }}>
                🌀 {typeName}
              </span>
              <span style={{ fontSize: 10, color: "#94a3b8", fontFamily: "monospace" }}>
                {fmtDate(n.sendingTime)} {fmtTime(n.sendingTime)}
              </span>
            </div>
            {/* Ligne 2 : sirène */}
            <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b", marginBottom: 2 }}>
              📡 {sirenName}
            </div>
            {/* Ligne 3 : catégorie + lieu */}
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 2 }}>
              {catName} · {district}, {region}
            </div>
            {/* Ligne 4 : expéditeur + il y a X */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 10, color: "#94a3b8" }}>👤 {sender}</span>
              <span style={{ fontSize: 10, color: "#94a3b8" }}>{timeAgo(n.sendingTime)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Composants UI ────────────────────────────────────────────────────────────
function FilterSelect({ label, value, options, onChange, disabled = false }: {
  label: string; value: string;
  options: { id: string | number; name: string }[];
  onChange: (v: string) => void; disabled?: boolean;
}) {
  return (
    <div style={{ position: "relative", minWidth: 140 }}>
      <select disabled={disabled} value={value} onChange={e => onChange(e.target.value)} style={{
        appearance: "none", width: "100%", padding: "7px 28px 7px 10px", fontSize: 13,
        color: value ? "#1e293b" : "#94a3b8", background: "#fff",
        border: `1.5px solid ${value ? "#3b82f6" : "#e2e8f0"}`,
        borderRadius: 8, cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1, outline: "none", fontFamily: "inherit",
      }}>
        <option value="">{label}</option>
        {options.map(o => <option key={o.id} value={String(o.id)}>{o.name}</option>)}
      </select>
      <ChevronDown size={13} color="#94a3b8"
        style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
    </div>
  );
}

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
          background: "rgba(245,158,11,0.95)", borderRadius: 8, padding: "5px 12px",
          fontSize: 11, fontWeight: 700, color: "white", textAlign: "center",
          letterSpacing: "0.04em", boxShadow: "0 2px 8px rgba(245,158,11,0.4)",
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
        const region      = sirene?.village?.region?.name ?? "—";
        const district    = sirene?.village?.district?.name ?? "—";
        const typeName    = n.categorieAlerteBngrc?.type?.name ?? "—";
        const catName     = n.categorieAlerteBngrc?.name ?? "—";
        const sender      = n.user
          ? (`${n.user.firstName ?? ""} ${n.user.lastName ?? ""}`.trim() || "—")
          : "—";
        const totalSecs = Math.round((a.endAt.getTime() - a.startAt.getTime()) / 1_000);
        const progress  = totalSecs > 0 ? Math.max(0, Math.min(1, secs / totalSecs)) : 0;

        return (
          <div key={a.notificationId} style={{
            background: "rgba(255,255,255,0.97)", border: "1.5px solid #f59e0b",
            borderRadius: 12, boxShadow: "0 4px 20px rgba(245,158,11,0.25)",
            fontFamily: "system-ui,sans-serif", width: 270, overflow: "hidden",
            animation: "slideInRight 0.3s ease",
          }}>
            <div style={{ background: "#f59e0b", padding: "9px 12px", display: "flex", alignItems: "center", gap: 8 }}>
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
            <div style={{ height: 3, background: "#fde68a" }}>
              <div style={{ height: "100%", background: "#f59e0b", width: `${progress * 100}%`, transition: "width 1s linear" }} />
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
  const seenNotifIds = useRef<Map<number, number>>(new Map());

  const [searchParams] = useSearchParams();
  const focusId = searchParams.get("id") ? Number(searchParams.get("id")) : null;
  const focusDoneRef = useRef(false);

  const [mapReady,     setMapReady]     = useState(false);
  const [mapMode,      setMapMode]      = useState<"map" | "satellite">("map");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [selProvince,  setSelProvince]  = useState("");
  const [selRegion,    setSelRegion]    = useState("");
  const [selDistrict,  setSelDistrict]  = useState("");
  const [selCommune,   setSelCommune]   = useState("");
  const [selFokontany, setSelFokontany] = useState("");
  const [selVillage,   setSelVillage]   = useState("");

  const [activeAlerts, setActiveAlerts] = useState<Map<number, ActiveAlert>>(new Map());
  const [bannerAlerts, setBannerAlerts] = useState<ActiveAlert[]>([]);

  // ── Données ──────────────────────────────────────────────────────────────────
  const { data: rawSirenes, isLoading } = useQuery({
    queryKey: ["sirenes"], queryFn: () => sirenesApi.getAllForMap(),
  });
  const { data: rawProvinces } = useQuery({
    queryKey: ["provinces"], queryFn: () => provincesApi.getAll(),
  });
  const { data: rawRegions } = useQuery({
    queryKey: ["regions"], queryFn: () => regionsApi.getAll(),
  });
  const { data: rawActiveNotifs } = useQuery({
    queryKey: ["active-notifications-bngrc"],
    queryFn:  () => notificationsBngrcApi.getActive(),
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
  });
  // Dernières 24h pour la liste latérale
  const { data: rawRecent } = useQuery({
    queryKey: ["recent-notifications-bngrc-24h"],
    queryFn:  () => notificationsBngrcApi.getActive(1440, 0), // 24h en arrière, 0 futur
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
  });

  const sirenes    = useMemo(() => toArr(rawSirenes),   [rawSirenes]);
  const provinces  = useMemo(() => toArr(rawProvinces), [rawProvinces]);
  const allRegions = useMemo(() => toArr(rawRegions),   [rawRegions]);

  // Liste 24h triée par sendingTime DESC
  const recentNotifs = useMemo(() => {
    const arr = toArr(rawRecent);
    return [...arr].sort((a: any, b: any) =>
      new Date(b.sendingTime).getTime() - new Date(a.sendingTime).getTime()
    );
  }, [rawRecent]);

  // ── Traitement alertes actives ────────────────────────────────────────────────
  useEffect(() => {
    const notifs: any[] = toArr(rawActiveNotifs);
    if (!notifs.length) return;
    const now = Date.now();

    seenNotifIds.current.forEach((endAt, id) => {
      if (now - endAt > 2 * 3_600_000) seenNotifIds.current.delete(id);
    });

    const bySirene = new Map<number, any[]>();
    notifs.forEach(n => {
      const sid = n.sireneId ?? n.sirene?.id;
      if (!sid) return;
      if (!bySirene.has(sid)) bySirene.set(sid, []);
      bySirene.get(sid)!.push(n);
    });

    const newActive: Map<number, ActiveAlert> = new Map();
    const newBanner: ActiveAlert[] = [];
    const timers: ReturnType<typeof setTimeout>[] = [];

    bySirene.forEach((sireneNotifs, sireneId) => {
      sireneNotifs.sort((a, b) => new Date(a.sendingTime).getTime() - new Date(b.sendingTime).getTime());
      let cursor = new Date(sireneNotifs[0].sendingTime).getTime();

      sireneNotifs.forEach(n => {
        const sendingTime   = new Date(n.sendingTime).getTime();
        // Scintillement = 10 secondes fixes (indépendant de la durée audio)
        const duration      = ALERT_SOUND_DURATION_MS;
        const start         = Math.max(sendingTime, cursor);
        const end           = start + duration;

        const seenEnd = seenNotifIds.current.get(n.id);
        if (seenEnd !== undefined && now >= seenEnd) { cursor = end + ALERT_GAP_MS; return; }

        if (start <= now && now < end) {
          seenNotifIds.current.set(n.id, end);
          const alert: ActiveAlert = { notificationId: n.id, sireneId, startAt: new Date(start), endAt: new Date(end), notification: n };
          newActive.set(sireneId, alert);
          newBanner.push(alert);
          if (seenEnd === undefined) playAlertSound();
        }

        if (start > now) {
          timers.push(setTimeout(() => {
            const s2 = seenNotifIds.current.get(n.id);
            if (s2 !== undefined && Date.now() >= s2) return;
            seenNotifIds.current.set(n.id, end);
            const alert: ActiveAlert = { notificationId: n.id, sireneId, startAt: new Date(start), endAt: new Date(end), notification: n };
            setActiveAlerts(prev => { const m = new Map(prev); m.set(sireneId, alert); return m; });
            setBannerAlerts(prev => [...prev.filter(a => a.sireneId !== sireneId), alert]);
            playAlertSound();
          }, start - now));
        }
        cursor = end + ALERT_GAP_MS;
      });
    });

    setActiveAlerts(newActive);
    setBannerAlerts(newBanner);
    return () => timers.forEach(t => clearTimeout(t));
  }, [rawActiveNotifs]);

  // ── Géographie ────────────────────────────────────────────────────────────────
  const geoTree = useMemo(() => {
    const districts: Map<string,any> = new Map();
    const communes:  Map<string,any> = new Map();
    const fokontanys:Map<string,any> = new Map();
    const villages:  Map<string,any> = new Map();
    sirenes.forEach((s: any) => {
      const v = s.village; if (!v) return;
      const vId=String(v.id??""), fId=String(v.fokontany?.id??""), fNm=v.fokontany?.name??"";
      const cId=String(v.commune?.id??""), cNm=v.commune?.name??"";
      const dId=String(v.district?.id??""), dNm=v.district?.name??"";
      const rId=String(v.region?.id??"");
      if(dId&&dNm) districts.set(dId, {id:dId,name:dNm,regionId:rId});
      if(cId&&cNm) communes.set(cId,  {id:cId,name:cNm,districtId:dId});
      if(fId&&fNm) fokontanys.set(fId,{id:fId,name:fNm,communeId:cId});
      if(vId&&v.name) villages.set(vId,{id:vId,name:v.name,fokontanyId:fId});
    });
    return { districts: Array.from(districts.values()), communes: Array.from(communes.values()), fokontanys: Array.from(fokontanys.values()), villages: Array.from(villages.values()) };
  }, [sirenes]);

  const filteredRegions    = useMemo(() => selProvince  ? allRegions.filter((r:any)=>String(r.provinceId??r.province?.id??r.province_id)===selProvince) : allRegions,  [allRegions,selProvince]);
  const filteredDistricts  = useMemo(() => selRegion    ? geoTree.districts.filter(d=>d.regionId===selRegion)    : geoTree.districts,   [geoTree,selRegion]);
  const filteredCommunes   = useMemo(() => selDistrict  ? geoTree.communes.filter(c=>c.districtId===selDistrict) : geoTree.communes,    [geoTree,selDistrict]);
  const filteredFokontanys = useMemo(() => selCommune   ? geoTree.fokontanys.filter(f=>f.communeId===selCommune) : geoTree.fokontanys,  [geoTree,selCommune]);
  const filteredVillages   = useMemo(() => selFokontany ? geoTree.villages.filter(v=>v.fokontanyId===selFokontany): geoTree.villages,   [geoTree,selFokontany]);

  const handleProvince  = (v:string)=>{setSelProvince(v); setSelRegion(""); setSelDistrict(""); setSelCommune(""); setSelFokontany(""); setSelVillage("");};
  const handleRegion    = (v:string)=>{setSelRegion(v);    setSelDistrict(""); setSelCommune(""); setSelFokontany(""); setSelVillage("");};
  const handleDistrict  = (v:string)=>{setSelDistrict(v);  setSelCommune(""); setSelFokontany(""); setSelVillage("");};
  const handleCommune   = (v:string)=>{setSelCommune(v);   setSelFokontany(""); setSelVillage("");};
  const handleFokontany = (v:string)=>{setSelFokontany(v); setSelVillage("");};
  const hasGeoFilter    = !!(selProvince||selRegion||selDistrict||selCommune||selFokontany||selVillage);
  const resetAllFilters = ()=>{setStatusFilter("all");setSelProvince("");setSelRegion("");setSelDistrict("");setSelCommune("");setSelFokontany("");setSelVillage("");};

  const visibleSirenes = useMemo(() => sirenes.filter((s:any) => {
    if(statusFilter==="active"   && !s.isActive) return false;
    if(statusFilter==="inactive" &&  s.isActive) return false;
    const v = s.village;
    if(!v) return !selVillage&&!selFokontany&&!selCommune&&!selDistrict&&!selRegion&&!selProvince;
    const vId=String(v.id??""), fId=String(v.fokontany?.id??""), cId=String(v.commune?.id??"");
    const dId=String(v.district?.id??""), rId=String(v.region?.id??""), pId=String(v.province?.id??"");
    if(selVillage   && vId!==selVillage)   return false;
    if(selFokontany && fId!==selFokontany) return false;
    if(selCommune   && cId!==selCommune)   return false;
    if(selDistrict  && dId!==selDistrict)  return false;
    if(selRegion    && rId!==selRegion)    return false;
    if(selProvince  && pId!==selProvince)  return false;
    return true;
  }), [sirenes,statusFilter,selVillage,selFokontany,selCommune,selDistrict,selRegion,selProvince]);

  // ── TOUTES les sirènes avec coords (plus de filtre alerte) ───────────────────
  const withCoords = useMemo(
    () => visibleSirenes.filter((s:any) => s.latitude && s.longitude),
    [visibleSirenes]
  );
  const allWithCoords = useMemo(
    () => sirenes.filter((s:any) => s.latitude && s.longitude),
    [sirenes]
  );

  // ── Init Leaflet — centré Madagascar, bounds bloqués ─────────────────────────
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
        // Bloquer les bounds sur Madagascar
        maxBounds: L.latLngBounds(
          L.latLng(MDG_BOUNDS.sw[0], MDG_BOUNDS.sw[1]),
          L.latLng(MDG_BOUNDS.ne[0], MDG_BOUNDS.ne[1])
        ),
        maxBoundsViscosity: 1.0,
        minZoom: 5,
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

  // ── Markers — toutes les sirènes, scintillent si alerte ──────────────────────
  useEffect(() => {
    if (!mapReady || !leafletRef.current) return;
    import("leaflet").then((L: any) => {
      const map = leafletRef.current;
      markersRef.current.forEach(m => m.remove());
      markersRef.current.clear();

      withCoords.forEach((s: any) => {
        const isBlinking   = activeAlerts.has(s.id);
        const currentAlert = activeAlerts.get(s.id);

        const icon = L.divIcon({
          className: "",
          html: sireneSVG(!!s.isActive, !!s.isOwned, isBlinking),
          iconSize: [44, 54], iconAnchor: [22, 54], popupAnchor: [0, -56],
        });
        const marker = L.marker([parseFloat(s.latitude), parseFloat(s.longitude)], { icon }).addTo(map);
        marker.bindPopup(buildPopupHTML(s, currentAlert), { maxWidth: 280, minWidth: 240, closeButton: false });
        marker.on("click", () => {
          // Pas de flyTo — juste ouvrir le popup
          marker.openPopup();
        });
        markersRef.current.set(s.id, marker);

        if (isBlinking && currentAlert) {
          const delay = currentAlert.endAt.getTime() - Date.now();
          if (delay > 0) {
            const prev = blinkTimers.current.get(s.id);
            if (prev) clearTimeout(prev);
            const t = setTimeout(() => {
              const m = markersRef.current.get(s.id);
              if (m) {
                m.setIcon(L.divIcon({ className: "", html: sireneSVG(!!s.isActive, !!s.isOwned, false), iconSize: [44,54], iconAnchor:[22,54], popupAnchor:[0,-56] }));
                m.setPopupContent(buildPopupHTML(s, undefined));
              }
              setActiveAlerts(prev => { const n = new Map(prev); n.delete(s.id); return n; });
              setBannerAlerts(prev => prev.filter(a => a.sireneId !== s.id));
            }, delay);
            blinkTimers.current.set(s.id, t);
          }
        }
      });

      // Initial fitBounds sur Madagascar (une seule fois au chargement)
      if (!focusDoneRef.current && withCoords.length > 0 && !focusId) {
        // Ne pas faire fitBounds — garder la vue Madagascar définie à l'init
      }
      // Focus si ?id= présent
      if (focusId && !focusDoneRef.current) {
        const target = withCoords.find((s: any) => s.id === focusId);
        if (target) {
          focusDoneRef.current = true;
          // Léger pan sans zoom agressif
          setTimeout(() => {
            leafletRef.current?.panTo([parseFloat(target.latitude), parseFloat(target.longitude)]);
            setTimeout(() => markersRef.current.get(focusId)?.openPopup(), 400);
          }, 300);
        }
      }
    });
  }, [mapReady, withCoords, activeAlerts]);

  // ─────────────────────────────────────────────────────────────────────────────
  const activeCount   = sirenes.filter((s: any) =>  s.isActive).length;
  const inactiveCount = sirenes.filter((s: any) => !s.isActive).length;
  const isFiltered    = statusFilter !== "all" || hasGeoFilter;
  const blinkCount    = activeAlerts.size;

  // Sélection depuis la liste latérale → pan vers la sirène
  function handleSelectFromList(n: any) {
    const sid = n.sireneId ?? n.sirene?.id;
    const sirene = sirenes.find((s: any) => s.id === sid);
    if (!sirene?.latitude || !leafletRef.current) return;
    leafletRef.current.panTo([parseFloat(sirene.latitude), parseFloat(sirene.longitude)]);
    setTimeout(() => markersRef.current.get(sid)?.openPopup(), 400);
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
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 20, padding: "4px 12px" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b", animation: "blink-bg 0.5s infinite alternate" }} />
                <span style={{ fontSize: 12, color: "#92400e", fontWeight: 600 }}>{blinkCount} alerte{blinkCount > 1 ? "s" : ""} en cours</span>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Activity size={13} color={activeCount === sirenes.length ? "#22c55e" : "#f59e0b"} />
              <span style={{ fontSize: 12, color: "#64748b" }}><strong style={{ color: "#1e293b" }}>{activeCount}</strong>/{sirenes.length} actives</span>
            </div>
          </div>
        </div>

        {/* ── Toolbar filtres ── */}
        <div style={{ padding: "10px 24px", background: "#fafbfc", borderBottom: "0.5px solid #e2e8f0", flexShrink: 0, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginRight: 2 }}>Statut</span>
            <StatusChip value="active"   current={statusFilter} label={`Actives (${activeCount})`}     color="#16a34a" bg="#f0fdf4" onClick={setStatusFilter} />
            <StatusChip value="inactive" current={statusFilter} label={`Inactives (${inactiveCount})`} color="#dc2626" bg="#fef2f2" onClick={setStatusFilter} />
          </div>
          <div style={{ width: 1, height: 22, background: "#e2e8f0", margin: "0 4px", flexShrink: 0 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginRight: 2 }}>Zone</span>
            <FilterSelect label="Province"   value={selProvince}  options={provinces.map((p:any)=>({id:p.id,name:p.name}))}       onChange={handleProvince} />
            <FilterSelect label="Région"     value={selRegion}    options={filteredRegions.map((r:any)=>({id:r.id,name:r.name}))} onChange={handleRegion}    disabled={!selProvince && provinces.length > 0} />
            <FilterSelect label="District"   value={selDistrict}  options={filteredDistricts.map(d=>({id:d.id,name:d.name}))}     onChange={handleDistrict}  disabled={!selRegion} />
            <FilterSelect label="Commune"    value={selCommune}   options={filteredCommunes.map(c=>({id:c.id,name:c.name}))}      onChange={handleCommune}   disabled={!selDistrict} />
            <FilterSelect label="Fokontany"  value={selFokontany} options={filteredFokontanys.map(f=>({id:f.id,name:f.name}))}   onChange={handleFokontany} disabled={!selCommune} />
            <FilterSelect label="Village"    value={selVillage}   options={filteredVillages.map(v=>({id:v.id,name:v.name}))}     onChange={setSelVillage}   disabled={!selFokontany} />
          </div>
          {isFiltered && (
            <button onClick={resetAllFilters} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
              <RotateCcw size={12} /> Réinitialiser
            </button>
          )}
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

            {isFiltered && (
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

          {/* ── Liste latérale 24h ── */}
          <div style={{ width: 300, flexShrink: 0, borderLeft: "0.5px solid #e2e8f0", background: "#fff", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Header liste */}
            <div style={{ padding: "12px 14px", borderBottom: "0.5px solid #f1f5f9", background: "#fafbfc", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <AlertTriangle size={13} color="#ea580c" />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>Alertes récentes</span>
                {recentNotifs.length > 0 && (
                  <span style={{ marginLeft: "auto", background: "#eff6ff", color: "#3b82f6", fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 10 }}>
                    {recentNotifs.length}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>Dernières 24 heures · temps réel</div>
            </div>
            {/* Scroll liste */}
            <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "thin" }}>
              <NotifSideList notifs={recentNotifs} onSelect={handleSelectFromList} />
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