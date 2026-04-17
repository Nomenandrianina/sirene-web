import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ChevronRight, Check, MapPin, Radio, X } from 'lucide-react';
import type { PackType } from '@/types/diffusion';
import { packTypeApi, souscriptionApi } from '@/services/diffusion.api';
import { sirenesApi } from '../../services/sirene.api'; // adaptez le chemin

interface Sirene {
  id: number;
  name: string | null;
  imei: string | null;
  latitude: string | null;
  longitude: string | null;
  phoneNumberBrain: string | null;
  isActive: number | boolean;
  village?: { name?: string; fokontany?: { name?: string; commune?: { name?: string; district?: { name?: string; region?: { name?: string } } } } };
}

interface StepperProps {
  userId: number;
  customerId: number;
  onSuccess?: () => void;
}

const STEPS = ['Pack', 'Sirènes', 'Confirmation'] as const;

const PACK_STYLE: Record<string, { icon: string; accent: string; light: string; badge: string }> = {
  premium: { icon: '🏆', accent: '#d97706', light: '#fffbeb', badge: '#fef3c7' },
  medium:  { icon: '⭐', accent: '#2563eb', light: '#eff6ff', badge: '#dbeafe' },
  basique: { icon: '📻', accent: '#64748b', light: '#f8fafc', badge: '#f1f5f9' },
};

const MARKER_CSS = `
  .ss-icon{position:relative;width:40px;height:50px;display:flex;flex-direction:column;align-items:center;cursor:pointer;}
  .ss-pulse{position:absolute;top:0;left:50%;transform:translateX(-50%);width:40px;height:40px;border-radius:50%;animation:ss-pulse 2.4s ease-out infinite;opacity:0;}
  .ss-pulse.off{animation:none;opacity:.12;}
  @keyframes ss-pulse{0%{transform:translateX(-50%) scale(.6);opacity:.7;}100%{transform:translateX(-50%) scale(1.6);opacity:0;}}
  .ss-dot{position:relative;z-index:2;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;
    box-shadow:0 3px 10px rgba(0,0,0,.22),0 0 0 3px white;transition:transform .15s,box-shadow .15s;}
  .ss-icon:hover .ss-dot{transform:scale(1.12);}
  .ss-icon.sel .ss-dot{box-shadow:0 3px 10px rgba(0,0,0,.3),0 0 0 3px #fff,0 0 0 6px #2563eb;}
  .ss-tail{width:3px;height:10px;border-radius:0 0 3px 3px;margin-top:-1px;z-index:1;}
  .leaflet-popup-content-wrapper{border-radius:12px!important;padding:0!important;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,.13)!important;border:.5px solid #e2e8f0!important;}
  .leaflet-popup-content{margin:0!important;min-width:200px;}
  .leaflet-popup-tip-container{display:none;}
`;

function mkMarker(s: Sirene, sel: boolean) {
  const active = !!s.isActive;
  const fill = sel ? '#2563eb' : active ? '#16a34a' : '#dc2626';
  const ring = sel ? '#bfdbfe' : active ? '#bbf7d0' : '#fecaca';
  return `<div class="ss-icon${sel?' sel':''}">
    <div class="ss-pulse${!active?' off':''}" style="background:${ring}"></div>
    <div class="ss-dot" style="background:${fill}">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <rect x="9" y="13" width="6" height="5" rx="1" fill="white" opacity=".95"/>
        <ellipse cx="12" cy="11" rx="3.5" ry="2.5" fill="white" opacity=".95"/>
        <ellipse cx="12" cy="11" rx="2" ry="1.4" fill="${fill}"/>
        <circle cx="12" cy="11" r=".7" fill="white" opacity=".9"/>
        <path d="M7.5 10.5C6.5 11.8 6.5 13.2 7.5 14.5" stroke="white" stroke-width="1.3" stroke-linecap="round" fill="none" opacity=".8"/>
        <path d="M16.5 10.5C17.5 11.8 17.5 13.2 16.5 14.5" stroke="white" stroke-width="1.3" stroke-linecap="round" fill="none" opacity=".8"/>
      </svg>
    </div>
    <div class="ss-tail" style="background:${fill}"></div>
  </div>`;
}

function mkPopup(s: Sirene, sel: boolean) {
  const active = !!s.isActive;
  const fill = sel ? '#2563eb' : active ? '#16a34a' : '#dc2626';
  return `<div style="font-family:system-ui,sans-serif;font-size:13px;">
    <div style="background:${fill};padding:10px 13px;">
      <div style="color:white;font-weight:700;">${s.name ?? s.imei ?? `Sirène #${s.id}`}</div>
      <div style="color:rgba(255,255,255,.8);font-size:11px;margin-top:2px;">📍 ${s.village?.name ?? '—'}</div>
    </div>
    <div style="padding:8px 13px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
        <span style="color:#64748b;font-size:11px;">Statut</span>
        <span style="color:${fill};font-size:11px;font-weight:600;">${sel ? 'Sélectionnée ✓' : active ? 'Active' : 'Inactive'}</span>
      </div>
      <div style="display:flex;justify-content:space-between;">
        <span style="color:#64748b;font-size:11px;">N° Brain</span>
        <span style="color:#1e293b;font-size:11px;font-family:monospace;">${s.phoneNumberBrain ?? '—'}</span>
      </div>
      <div style="margin-top:8px;text-align:center;font-size:11px;color:${fill};font-weight:500;">
        Cliquer pour ${sel ? 'désélectionner' : 'sélectionner'}
      </div>
    </div>
  </div>`;
}

// ── Carte Leaflet embarquée ───────────────────────────────────────────────────
function MapPicker({ sirenes, selected, onToggle }: { sirenes: Sirene[]; selected: Set<number>; onToggle: (id: number) => void }) {
  const mapRef     = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<any>(null);
  const markersRef = useRef<Map<number, any>>(new Map());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!document.getElementById('lf-css')) {
      const l = document.createElement('link'); l.id='lf-css'; l.rel='stylesheet';
      l.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(l);
    }
    if (!document.getElementById('ss-css')) {
      const s = document.createElement('style'); s.id='ss-css'; s.textContent=MARKER_CSS; document.head.appendChild(s);
    }
    if (leafletRef.current || !mapRef.current) return;
    import('leaflet').then((L: any) => {
      if (leafletRef.current || !mapRef.current) return;
      const map = L.map(mapRef.current, { center: [-18.9, 47.5], zoom: 6, zoomControl: false });
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        { attribution: '© OpenStreetMap © CARTO', maxZoom: 19 }).addTo(map);
      leafletRef.current = map;
      setReady(true);
    });
    return () => { if (leafletRef.current) { leafletRef.current.remove(); leafletRef.current = null; markersRef.current.clear(); } };
  }, []);

  useEffect(() => {
    if (!ready || !leafletRef.current) return;
    import('leaflet').then((L: any) => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();
      const coords = sirenes.filter((s) => s.latitude && s.longitude);
      coords.forEach((s) => {
        const isSel = selected.has(s.id);
        const icon = L.divIcon({ className:'', html: mkMarker(s, isSel), iconSize:[40,50], iconAnchor:[20,50], popupAnchor:[0,-52] });
        const m = L.marker([parseFloat(s.latitude!), parseFloat(s.longitude!)], { icon }).addTo(leafletRef.current);
        m.bindPopup(mkPopup(s, isSel), { maxWidth:230, minWidth:200, closeButton:false });
        m.on('click', () => { onToggle(s.id); m.closePopup(); });
        markersRef.current.set(s.id, m);
      });
      if (coords.length > 0) {
        leafletRef.current.fitBounds(
          L.latLngBounds(coords.map((s) => [parseFloat(s.latitude!), parseFloat(s.longitude!)])),
          { padding: [60, 60] }
        );
      }
    });
  }, [ready, sirenes, selected, onToggle]);

  return <div ref={mapRef} style={{ width:'100%', height:'100%' }} />;
}

// ── Stepper ───────────────────────────────────────────────────────────────────
export default function SouscriptionStepper({ userId, customerId, onSuccess }: StepperProps) {
  const [step, setStep]             = useState(0);
  const [packs, setPacks]           = useState<PackType[]>([]);
  const [sirenes, setSirenes]       = useState<Sirene[]>([]);
  const [selectedPack, setSelectedPack] = useState<PackType | null>(null);
  const [selectedIds, setSelectedIds]   = useState<Set<number>>(new Set());
  const [loadingPacks, setLoadingPacks] = useState(true);
  const [loadingSirenes, setLoadingSirenes] = useState(false);
  const [zoneFilter, setZoneFilter] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [done, setDone]             = useState(false);

  useEffect(() => {
    packTypeApi.getAll(true).then(setPacks).finally(() => setLoadingPacks(false));
  }, []);

  useEffect(() => {
    if (step !== 1 || sirenes.length) return;
    setLoadingSirenes(true);
    sirenesApi.getAllwithoutfilter().then(setSirenes).finally(() => setLoadingSirenes(false));
  }, [step]);

  const toggleSirene = useCallback((id: number) => {
    setSelectedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);


  const filteredSirenes = useMemo(() => {
    if (!zoneFilter.trim()) return sirenes;
    const q = zoneFilter.toLowerCase();
    return sirenes.filter((s) =>
      s.name?.toLowerCase().includes(q) ||
      s.village?.name?.toLowerCase().includes(q) ||
      s.village?.fokontany?.commune?.district?.name?.toLowerCase().includes(q) ||
      s.village?.fokontany?.commune?.district?.region?.name?.toLowerCase().includes(q)
    );
  }, [sirenes, zoneFilter]);

  const selectedSirenes = useMemo(() => sirenes.filter((s) => selectedIds.has(s.id)), [sirenes, selectedIds]);

  const handleSubmit = async () => {
    if (!selectedPack || !selectedIds.size) return;
    setSubmitting(true); setError(null);
    try {
      await souscriptionApi.create({ userId, customerId, packTypeId: selectedPack.id, sireneIds: Array.from(selectedIds) });
      setDone(true); onSuccess?.();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Erreur lors de la souscription');
    } finally { setSubmitting(false); }
  };

  const reset = () => { setDone(false); setStep(0); setSelectedPack(null); setSelectedIds(new Set()); setError(null); };

  if (done) return (
    <div className="rounded-2xl border border-green-200 bg-green-50 p-10 text-center">
      <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
        <Check size={28} className="text-green-600" />
      </div>
      <h3 className="text-lg font-semibold text-green-800 mb-1">Souscription activée !</h3>
      <p className="text-sm text-green-600 mb-1">
        Pack <strong className="capitalize">{selectedPack?.name}</strong> activé sur{' '}
        <strong>{selectedIds.size}</strong> sirène{selectedIds.size > 1 ? 's' : ''}.
      </p>
      <p className="text-xs text-green-500 mt-1">
        Associez vos audios aux sirènes souscrites depuis la gestion des audios.
      </p>
      <button onClick={reset} className="mt-5 text-sm text-green-700 underline">Nouvelle souscription</button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* ── Progress bar ── */}
      <div className="flex items-center">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all
                ${i < step ? 'bg-blue-600 text-white' : i === step ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-slate-100 text-slate-400'}`}>
                {i < step ? <Check size={15} /> : i + 1}
              </div>
              <span className={`text-xs whitespace-nowrap ${i === step ? 'text-blue-600 font-medium' : 'text-slate-400'}`}>{label}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 mb-4 ${i < step ? 'bg-blue-600' : 'bg-slate-200'}`} />}
          </div>
        ))}
      </div>

      {/* ══ ÉTAPE 1 : Pack ═══════════════════════════════════════════════════ */}
      {step === 0 && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-slate-800">Choisissez votre pack</h2>
          {loadingPacks ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[1,2,3].map((i) => <div key={i} className="h-48 rounded-xl bg-slate-100 animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {packs.map((pack) => {
                const st = PACK_STYLE[pack.name] ?? PACK_STYLE.basique;
                const active = selectedPack?.id === pack.id;
                return (
                  <button key={pack.id} onClick={() => setSelectedPack(pack)}
                    className="relative rounded-xl border-2 p-5 text-left transition-all"
                    style={{ background: st.light, borderColor: active ? st.accent : 'transparent',
                      boxShadow: active ? `0 0 0 1px ${st.accent}` : 'none', outline:'none' }}>
                    {active && (
                      <span className="absolute top-3 right-3 text-xs font-semibold px-2 py-0.5 rounded-full bg-white border"
                        style={{ borderColor: st.accent, color: st.accent }}>✓ Sélectionné</span>
                    )}
                    <div className="text-2xl mb-2">{st.icon}</div>
                    <div className="font-semibold text-slate-900 capitalize mb-1">Pack {pack.name}</div>
                    <div className="text-xs text-slate-500 mb-3 leading-relaxed">{pack.description}</div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {[`${pack.frequenceParJour}x / jour`, `${pack.joursParSemaine}j / sem.`, `${pack.dureeMaxMinutes} min / créneau`].map((t) => (
                        <span key={t} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: st.badge, color: st.accent }}>{t}</span>
                      ))}
                    </div>
                    <div className="text-xl font-bold text-slate-900">
                      {Number(pack.prix).toLocaleString('fr-FR')} Ar
                      <span className="text-xs font-normal text-slate-400 ml-1">/ {pack.periode === 'monthly' ? 'mois' : 'semaine'}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          <div className="flex justify-end pt-2">
            <button onClick={() => setStep(1)} disabled={!selectedPack}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium
                hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Choisir les sirènes <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ══ ÉTAPE 2 : Carte + sélection ══════════════════════════════════════ */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-800">Sélectionnez les sirènes</h2>
            {selectedIds.size > 0 && (
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                {selectedIds.size} sélectionnée{selectedIds.size > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Filtre texte */}
          <div className="relative">
            <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={zoneFilter} onChange={(e) => setZoneFilter(e.target.value)}
              placeholder="Filtrer par nom, village, district, région…"
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 text-sm
                focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400" />
          </div>

          {/* Carte */}
          <div className="rounded-xl overflow-hidden border border-slate-200" style={{ height: 420, position:'relative' }}>
            {loadingSirenes ? (
              <div className="w-full h-full bg-slate-100 animate-pulse flex items-center justify-center">
                <div className="text-sm text-slate-400">Chargement des sirènes…</div>
              </div>
            ) : (
              <MapPicker sirenes={filteredSirenes} selected={selectedIds} onToggle={toggleSirene} />
            )}
            {/* Légende */}
            <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 rounded-lg border border-slate-200 px-3 py-2 text-xs flex gap-3 shadow-sm">
              {[['bg-green-500','Active'],['bg-red-500','Inactive'],['bg-blue-600','Sélectionnée']].map(([c,l]) => (
                <span key={l} className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${c} shrink-0`} />{l}
                </span>
              ))}
            </div>
            {/* Compteur */}
            <div className="absolute top-3 right-3 z-[1000] bg-white/90 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 shadow-sm flex items-center gap-1.5">
              <Radio size={11} />{filteredSirenes.filter((s) => s.latitude && s.longitude).length} affichées
            </div>
          </div>

          {/* Tags sirènes sélectionnées */}
          {selectedIds.size > 0 && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
              <p className="text-xs font-semibold text-blue-700 mb-2">Sirènes sélectionnées ({selectedIds.size})</p>
              <div className="flex flex-wrap gap-2">
                {selectedSirenes.map((s) => (
                  <span key={s.id} className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white border border-blue-200 text-blue-700">
                    📡 {s.name ?? `Sirène #${s.id}`}
                    <button onClick={() => toggleSirene(s.id)} className="text-blue-400 hover:text-red-500 transition-colors">
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between pt-2">
            <button onClick={() => setStep(0)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors">
              ← Retour
            </button>
            <button onClick={() => setStep(2)} disabled={selectedIds.size === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium
                hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Voir le récapitulatif <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ══ ÉTAPE 3 : Récap ══════════════════════════════════════════════════ */}
      {step === 2 && (
        <div className="space-y-5">
          <h2 className="text-base font-semibold text-slate-800">Récapitulatif</h2>
          <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
            {/* Pack */}
            <div className="px-5 py-4 flex items-center gap-3">
              <span className="text-2xl">{PACK_STYLE[selectedPack?.name ?? '']?.icon ?? '📦'}</span>
              <div className="flex-1">
                <div className="text-sm font-semibold text-slate-800 capitalize">Pack {selectedPack?.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">{selectedPack?.description}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-slate-900">{Number(selectedPack?.prix).toLocaleString('fr-FR')} Ar</div>
                <div className="text-xs text-slate-400">/ {selectedPack?.periode === 'monthly' ? 'mois' : 'semaine'}</div>
              </div>
            </div>
            {/* Créneaux */}
            <div className="px-5 py-4">
              <div className="text-xs font-medium text-slate-500 mb-2">Créneaux de diffusion</div>
              <div className="flex gap-2 flex-wrap">
                {['7h00','12h00','16h00'].slice(0, selectedPack?.frequenceParJour ?? 1).map((h) => (
                  <span key={h} className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">🕐 {h}</span>
                ))}
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-50 text-slate-500 border border-slate-100">
                  {selectedPack?.joursParSemaine}j / sem. · {selectedPack?.dureeMaxMinutes} min / créneau
                </span>
              </div>
            </div>
            {/* Sirènes */}
            <div className="px-5 py-4">
              <div className="text-xs font-medium text-slate-500 mb-2">
                {selectedIds.size} sirène{selectedIds.size > 1 ? 's' : ''} sélectionnée{selectedIds.size > 1 ? 's' : ''}
              </div>
              <div className="space-y-1 max-h-36 overflow-y-auto">
                {selectedSirenes.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 text-xs text-slate-700">
                    <span className="text-slate-400">📡</span>
                    <span className="font-medium">{s.name ?? `Sirène #${s.id}`}</span>
                    {s.village?.name && <span className="text-slate-400">— {s.village.name}</span>}
                  </div>
                ))}
              </div>
            </div>
            {/* Total */}
            <div className="px-5 py-4 flex justify-between items-center">
              <div>
                <div className="text-xs font-medium text-slate-500">Durée</div>
                <div className="text-sm font-semibold text-slate-800 mt-0.5">
                  {selectedPack?.periode === 'monthly' ? '1 mois' : '1 semaine'}
                  <span className="text-slate-400 font-normal text-xs ml-1">(à partir d'aujourd'hui)</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-medium text-slate-500">Total</div>
                <div className="text-lg font-bold text-slate-900">{Number(selectedPack?.prix).toLocaleString('fr-FR')} Ar</div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700 flex gap-2">
            <span className="shrink-0 mt-0.5">💡</span>
            <span>Après confirmation, associez vos audios aux sirènes souscrites depuis la gestion des audios.</span>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <div className="flex justify-between pt-2">
            <button onClick={() => setStep(1)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors">
              ← Retour
            </button>
            <button onClick={handleSubmit} disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold
                hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {submitting ? 'Activation…' : '✓ Confirmer la souscription'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}