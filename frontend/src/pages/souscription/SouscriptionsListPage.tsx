import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { useRole } from '@/hooks/useRole';
import { Navigate } from 'react-router-dom';
import { souscriptionApi } from '@/services/diffusion.api';
import type { Souscription } from '@/types/diffusion';
import {
  Plus, Search, Filter, ChevronDown, Radio,
  CalendarDays, AlertTriangle, CheckCircle2,
  Clock, PauseCircle, BarChart3, RefreshCw,
  Eye, Ban,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Customer { id: number; name: string; company?: string }

function toArr<T>(r: unknown): T[] {
  if (!r) return [];
  if (Array.isArray(r)) return r as T[];
  if (typeof r === 'object') {
    for (const key of ['data','response','items','results','souscriptions']) {
      const val = (r as Record<string, unknown>)[key];
      if (Array.isArray(val)) return val as T[];
    }
    const first = Object.values(r as object).find(v => Array.isArray(v));
    if (first) return first as T[];
  }
  return [];
}

// ── Config statuts ────────────────────────────────────────────────────────────

const STATUS_CFG = {
  active:    { label: 'Actif',       Icon: CheckCircle2, color: '#059669', bg: '#d1fae5', border: '#6ee7b7' },
  expired:   { label: 'Expiré',      Icon: Clock,        color: '#dc2626', bg: '#fee2e2', border: '#fca5a5' },
  suspended: { label: 'Suspendu',    Icon: PauseCircle,  color: '#d97706', bg: '#fef3c7', border: '#fcd34d' },
  pending:   { label: 'En attente',  Icon: Clock,        color: '#6366f1', bg: '#eef2ff', border: '#a5b4fc' },
};

const PACK_CFG: Record<string, { color: string; bg: string; label: string }> = {
  premium: { color: '#92400e', bg: '#fef3c7', label: 'Premium' },
  medium:  { color: '#1e40af', bg: '#dbeafe', label: 'Medium'  },
  basique: { color: '#374151', bg: '#f3f4f6', label: 'Basique' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysLeft(endDate: string): number {
  return Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric' });
}

function QuotaBar({ used, total }: { used: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  const color = pct >= 80 ? '#ef4444' : pct >= 60 ? '#f59e0b' : '#10b981';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: 11, color, fontWeight: 700, minWidth: 32 }}>{pct}%</span>
    </div>
  );
}

// ── Carte souscription ────────────────────────────────────────────────────────

function SouscriptionRow({ s, onSuspend, onReactivate, onDetail }: {
  s: Souscription & { customer?: Customer };
  onSuspend:    (id: number) => void;
  onReactivate: (id: number) => void;
  onDetail:     (s: Souscription) => void;
}) {
  const cfg      = STATUS_CFG[s.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.pending;
  const packCfg  = PACK_CFG[s.packType?.name?.toLowerCase() ?? ''] ?? PACK_CFG.basique;
  const sirenes: any[] = (s as any).sirenes ?? [];
  const left     = daysLeft(s.endDate);
  const expiring = left <= 30 && left > 0 && s.status === 'active';
  const { Icon } = cfg;

  // Quotas fictifs basés sur la durée (à remplacer par les vrais champs)
  const totalDiff = (s.packType?.frequenceParJour ?? 1) * (s.packType?.joursParSemaine ?? 5) * 4;
  const usedDiff  = Math.floor(totalDiff * 0.4); // placeholder

  return (
    <div style={{
      background: '#fff',
      border: `1px solid ${expiring ? '#fde68a' : '#e8edf2'}`,
      borderLeft: `3px solid ${cfg.color}`,
      borderRadius: 10,
      padding: '14px 18px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      transition: 'box-shadow 0.15s',
    }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
    >
      {/* Avatar client */}
      <div style={{
        width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
        background: '#eff6ff', color: '#1d4ed8',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 15, fontWeight: 700,
      }}>
        {(s.customer?.name ?? 'C')[0].toUpperCase()}
      </div>

      {/* Client + contrat */}
      <div style={{ flex: '0 0 200px', minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {s.customer?.name ?? `Client #${(s as any).customerId}`}
        </div>
        {s.customer?.company && (
          <div style={{ fontSize: 11, color: '#94a3b8' }}>{s.customer.company}</div>
        )}
        <code style={{ fontSize: 10, color: '#94a3b8', background: '#f8fafc', padding: '1px 5px', borderRadius: 4 }}>
          SUB-{String(s.id).padStart(4, '0')}
        </code>
      </div>

      {/* Pack */}
      <div style={{ flex: '0 0 90px' }}>
        <span style={{
          fontSize: 11, fontWeight: 600,
          color: packCfg.color, background: packCfg.bg,
          padding: '3px 10px', borderRadius: 20,
        }}>
          {packCfg.label}
        </span>
      </div>

      {/* Période */}
      <div style={{ flex: '0 0 200px' }}>
        <div style={{ fontSize: 12, color: '#475569', display: 'flex', alignItems: 'center', gap: 5 }}>
          <CalendarDays size={12} style={{ color: '#94a3b8' }} />
          {fmtDate(s.startDate)} → {fmtDate(s.endDate)}
        </div>
        {expiring && (
          <div style={{ fontSize: 11, color: '#d97706', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <AlertTriangle size={10} /> {left}j restants
          </div>
        )}
        {left <= 0 && s.status === 'expired' && (
          <div style={{ fontSize: 11, color: '#dc2626', marginTop: 2 }}>Expiré</div>
        )}
      </div>

      {/* Quotas */}
      <div style={{ flex: 1, minWidth: 120 }}>
        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>
          {usedDiff}/{totalDiff} diffusions
        </div>
        <QuotaBar used={usedDiff} total={totalDiff} />
      </div>

      {/* Sirènes */}
      <div style={{ flex: '0 0 80px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'center' }}>
          <Radio size={13} style={{ color: '#6366f1' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{sirenes.length}</span>
        </div>
        <div style={{ fontSize: 10, color: '#94a3b8' }}>sirène{sirenes.length > 1 ? 's' : ''}</div>
      </div>

      {/* Statut */}
      <div style={{ flex: '0 0 110px' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          fontSize: 11, fontWeight: 600,
          color: cfg.color, background: cfg.bg,
          padding: '4px 10px', borderRadius: 20,
        }}>
          <Icon size={11} /> {cfg.label}
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button
          onClick={() => onDetail(s)}
          title="Détail"
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '5px 10px', borderRadius: 8,
            border: '1px solid #e2e8f0', background: '#f8fafc',
            color: '#475569', fontSize: 11, fontWeight: 500, cursor: 'pointer',
          }}
        >
          <Eye size={12} /> Détail
        </button>

        {s.status === 'active' && (
          <button
            onClick={() => onSuspend(s.id)}
            title="Suspendre"
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '5px 10px', borderRadius: 8,
              border: '1px solid #fde68a', background: '#fffbeb',
              color: '#92400e', fontSize: 11, fontWeight: 500, cursor: 'pointer',
            }}
          >
            <Ban size={12} /> Suspendre
          </button>
        )}
        {s.status === 'suspended' && (
          <button
            onClick={() => onReactivate(s.id)}
            title="Réactiver"
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '5px 10px', borderRadius: 8,
              border: '1px solid #6ee7b7', background: '#d1fae5',
              color: '#065f46', fontSize: 11, fontWeight: 500, cursor: 'pointer',
            }}
          >
            <RefreshCw size={12} /> Réactiver
          </button>
        )}
      </div>
    </div>
  );
}

// ── Modal détail ──────────────────────────────────────────────────────────────

function DetailModal({ s, onClose, onSuspend, onReactivate }: {
  s: Souscription & { customer?: Customer };
  onClose:      () => void;
  onSuspend:    (id: number) => void;
  onReactivate: (id: number) => void;
}) {
  const cfg     = STATUS_CFG[s.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.pending;
  const packCfg = PACK_CFG[s.packType?.name?.toLowerCase() ?? ''] ?? PACK_CFG.basique;
  const sirenes: any[] = (s as any).sirenes ?? [];
  const left    = daysLeft(s.endDate);
  const { Icon } = cfg;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }} onClick={onClose}>
      <div
        style={{
          background: '#fff', borderRadius: 16, width: '100%', maxWidth: 560,
          boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ background: '#0f172a', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              SUB-{String(s.id).padStart(4, '0')}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>
              {s.customer?.name ?? `Client #${(s as any).customerId}`}
            </div>
            {s.customer?.company && (
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{s.customer.company}</div>
            )}
          </div>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: 11, fontWeight: 600, color: cfg.color, background: cfg.bg,
            padding: '4px 12px', borderRadius: 20,
          }}>
            <Icon size={11} /> {cfg.label}
          </span>
        </div>

        {/* Body */}
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Pack + Période */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Offre</div>
              <span style={{
                fontSize: 13, fontWeight: 700,
                color: packCfg.color, background: packCfg.bg,
                padding: '4px 12px', borderRadius: 20,
              }}>
                {packCfg.label}
              </span>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 8 }}>
                {s.packType?.frequenceParJour}x/jour · {s.packType?.joursParSemaine}j/sem
              </div>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Période</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#1e293b' }}>
                {fmtDate(s.startDate)} → {fmtDate(s.endDate)}
              </div>
              <div style={{ fontSize: 11, marginTop: 4, color: left <= 0 ? '#dc2626' : left <= 30 ? '#d97706' : '#10b981', fontWeight: 500 }}>
                {left <= 0 ? 'Expiré' : `${left} jour${left > 1 ? 's' : ''} restant${left > 1 ? 's' : ''}`}
              </div>
            </div>
          </div>

          {/* Créneaux */}
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Créneaux de diffusion</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['7h00', '12h00', '16h00'].slice(0, s.packType?.frequenceParJour ?? 1).map(h => (
                <span key={h} style={{
                  fontSize: 12, fontWeight: 600,
                  color: '#1d4ed8', background: '#dbeafe',
                  padding: '4px 12px', borderRadius: 20,
                }}>
                  🕐 {h}
                </span>
              ))}
            </div>
          </div>

          {/* Sirènes */}
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Sirènes ({sirenes.length})
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 100, overflowY: 'auto' }}>
              {sirenes.map((sr: any) => (
                <span key={sr.id} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  fontSize: 11, fontWeight: 500,
                  color: '#6366f1', background: '#eef2ff',
                  padding: '3px 10px', borderRadius: 20,
                }}>
                  <Radio size={9} /> {sr.name ?? `#${sr.id}`}
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 18px', borderRadius: 10,
                border: '1px solid #e2e8f0', background: '#fff',
                fontSize: 13, color: '#475569', cursor: 'pointer', fontWeight: 500,
              }}
            >
              Fermer
            </button>
            {s.status === 'active' && (
              <button
                onClick={() => { onSuspend(s.id); onClose(); }}
                style={{
                  padding: '8px 18px', borderRadius: 10,
                  border: '1px solid #fde68a', background: '#fffbeb',
                  fontSize: 13, color: '#92400e', cursor: 'pointer', fontWeight: 500,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <Ban size={13} /> Suspendre
              </button>
            )}
            {s.status === 'suspended' && (
              <button
                onClick={() => { onReactivate(s.id); onClose(); }}
                style={{
                  padding: '8px 18px', borderRadius: 10,
                  border: '1px solid #6ee7b7', background: '#d1fae5',
                  fontSize: 13, color: '#065f46', cursor: 'pointer', fontWeight: 500,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <RefreshCw size={13} /> Réactiver
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function SouscriptionsListPage() {
  const { isSuperAdmin } = useRole();
  const navigate         = useNavigate();

  if (!isSuperAdmin) return <Navigate to="/" replace />;

  const [souscriptions, setSouscriptions] = useState<(Souscription & { customer?: Customer })[]>([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState('');
  const [statusFilter, setStatusFilter]   = useState('');
  const [packFilter, setPackFilter]       = useState('');
  const [detailItem, setDetailItem]       = useState<(Souscription & { customer?: Customer }) | null>(null);
  const [page, setPage]                   = useState(1);
  const PER_PAGE = 10;

  useEffect(() => {
    souscriptionApi.getAll({})
      .then((res: unknown) => setSouscriptions(toArr(res)))
      .catch(() => setSouscriptions([]))
      .finally(() => setLoading(false));
  }, []);

  const reload = () => {
    setLoading(true);
    souscriptionApi.getAll({})
      .then((res: unknown) => setSouscriptions(toArr(res)))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleSuspend = async (id: number) => {
    await souscriptionApi.suspend(id);
    reload();
  };

  const handleReactivate = async (id: number) => {
    await souscriptionApi.reactivate(id);
    reload();
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return souscriptions.filter(s => {
      const matchSearch = !q
        || s.customer?.name?.toLowerCase().includes(q)
        || s.customer?.company?.toLowerCase().includes(q)
        || `sub-${String(s.id).padStart(4,'0')}`.includes(q)
        || s.packType?.name?.toLowerCase().includes(q);
      const matchStatus = !statusFilter || s.status === statusFilter;
      const matchPack   = !packFilter   || s.packType?.name?.toLowerCase() === packFilter;
      return matchSearch && matchStatus && matchPack;
    });
  }, [souscriptions, search, statusFilter, packFilter]);

  // Reset page quand les filtres changent
  useEffect(() => { setPage(1); }, [search, statusFilter, packFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Compteurs
  const counts = useMemo(() => ({
    total:     souscriptions.length,
    active:    souscriptions.filter(s => s.status === 'active').length,
    expiring:  souscriptions.filter(s => s.status === 'active' && daysLeft(s.endDate) <= 30 && daysLeft(s.endDate) > 0).length,
    expired:   souscriptions.filter(s => s.status === 'expired').length,
    suspended: souscriptions.filter(s => s.status === 'suspended').length,
  }), [souscriptions]);

  return (
    <AppLayout>
      <div className="page-wrap">

        {/* ── Header ── */}
        <div className="page-header">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Gestion des souscriptions</h1>
            <p className="page-subtitle">Gérez les packs de diffusion attribués aux clients</p>
          </div>
          <button
            onClick={() => navigate('/souscription/new')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 18px', borderRadius: 10,
              background: '#1d4ed8', color: '#fff',
              border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Plus size={15} /> Nouvelle souscription
          </button>
        </div>

        {/* ── KPIs ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Total',           value: counts.total,     color: '#1e293b', bg: '#f8fafc', border: '#e2e8f0' },
            { label: 'Actifs',          value: counts.active,    color: '#065f46', bg: '#d1fae5', border: '#6ee7b7' },
            { label: 'Expire < 30j',    value: counts.expiring,  color: '#92400e', bg: '#fef3c7', border: '#fcd34d' },
            { label: 'Expirés',         value: counts.expired,   color: '#991b1b', bg: '#fee2e2', border: '#fca5a5' },
            { label: 'Suspendus',       value: counts.suspended, color: '#5b21b6', bg: '#ede9fe', border: '#c4b5fd' },
          ].map(k => (
            <div key={k.label} style={{
              background: k.bg, border: `1px solid ${k.border}`,
              borderRadius: 10, padding: '12px 16px',
            }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{k.value}</div>
              <div style={{ fontSize: 11, color: k.color, opacity: 0.7, marginTop: 2 }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* ── Alerte expiration ── */}
        {counts.expiring > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: '#fffbeb', border: '1px solid #fde68a',
            borderRadius: 10, padding: '10px 16px', marginBottom: 16,
            fontSize: 13, color: '#92400e',
          }}>
            <AlertTriangle size={16} style={{ color: '#d97706', flexShrink: 0 }} />
            <span><strong>{counts.expiring}</strong> souscription{counts.expiring > 1 ? 's' : ''} expire{counts.expiring > 1 ? 'nt' : ''} dans moins de 30 jours</span>
          </div>
        )}

        {/* ── Panel ── */}
        <div className="panel">

          {/* Filtres */}
          <div style={{
            display: 'flex', gap: 10, padding: '14px 16px',
            borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap',
          }}>
            {/* Recherche */}
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher client, contrat, offre…"
                style={{
                  width: '100%', paddingLeft: 34, paddingRight: 12,
                  paddingTop: 8, paddingBottom: 8,
                  border: '1px solid #e2e8f0', borderRadius: 8,
                  fontSize: 13, color: '#1e293b', outline: 'none',
                  background: '#fff', boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Filtre statut */}
            <div style={{ position: 'relative' }}>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{
                  appearance: 'none', paddingLeft: 32, paddingRight: 28,
                  paddingTop: 8, paddingBottom: 8,
                  border: '1px solid #e2e8f0', borderRadius: 8,
                  fontSize: 13, color: '#475569', background: '#fff',
                  cursor: 'pointer', outline: 'none',
                }}
              >
                <option value="">Tous statuts</option>
                <option value="active">Actif</option>
                <option value="suspended">Suspendu</option>
                <option value="expired">Expiré</option>
                <option value="pending">En attente</option>
              </select>
              <Filter size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
              <ChevronDown size={13} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
            </div>

            {/* Filtre pack */}
            <div style={{ position: 'relative' }}>
              <select
                value={packFilter}
                onChange={e => setPackFilter(e.target.value)}
                style={{
                  appearance: 'none', paddingLeft: 32, paddingRight: 28,
                  paddingTop: 8, paddingBottom: 8,
                  border: '1px solid #e2e8f0', borderRadius: 8,
                  fontSize: 13, color: '#475569', background: '#fff',
                  cursor: 'pointer', outline: 'none',
                }}
              >
                <option value="">Toutes offres</option>
                <option value="premium">Premium</option>
                <option value="medium">Medium</option>
                <option value="basique">Basique</option>
              </select>
              <BarChart3 size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
              <ChevronDown size={13} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
            </div>

            <span style={{ fontSize: 12, color: '#94a3b8', alignSelf: 'center', marginLeft: 'auto' }}>
              {filtered.length} souscription{filtered.length > 1 ? 's' : ''}
            </span>
          </div>

          {/* ── Entêtes colonnes ── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16,
            padding: '8px 18px', borderBottom: '1px solid #f1f5f9',
            fontSize: 11, fontWeight: 600, color: '#94a3b8',
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            <div style={{ width: 38 }} />
            <div style={{ flex: '0 0 200px' }}>Client</div>
            <div style={{ flex: '0 0 90px' }}>Offre</div>
            <div style={{ flex: '0 0 200px' }}>Période</div>
            <div style={{ flex: 1 }}>Quotas</div>
            <div style={{ flex: '0 0 80px', textAlign: 'center' }}>Sirènes</div>
            <div style={{ flex: '0 0 110px' }}>Statut</div>
            <div style={{ flex: '0 0 160px', textAlign: 'right' }}>Actions</div>
          </div>

          {/* ── Liste ── */}
          <div style={{ padding: '8px 16px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{
                  height: 66, borderRadius: 10,
                  background: 'linear-gradient(90deg, #f1f5f9 25%, #e8edf2 50%, #f1f5f9 75%)',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }} />
              ))
            ) : paginated.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8', fontSize: 13 }}>
                Aucune souscription trouvée
              </div>
            ) : (
              paginated.map(s => (
                <SouscriptionRow
                  key={s.id}
                  s={s}
                  onSuspend={handleSuspend}
                  onReactivate={handleReactivate}
                  onDetail={setDetailItem}
                />
              ))
            )}
          </div>

          {/* ── Pagination ── */}
          {!loading && filtered.length > PER_PAGE && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 18px', borderTop: '1px solid #f1f5f9',
            }}>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} sur {filtered.length}
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                {/* Précédent */}
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    border: '1px solid #e2e8f0', background: page === 1 ? '#f8fafc' : '#fff',
                    color: page === 1 ? '#cbd5e1' : '#475569',
                    cursor: page === 1 ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 600,
                  }}
                >
                  ‹
                </button>

                {/* Pages numérotées */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | '...')[]>((acc, p, i, arr) => {
                    if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) => p === '...'
                    ? (
                      <span key={`d${i}`} style={{
                        width: 32, height: 32, display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, color: '#94a3b8',
                      }}>…</span>
                    )
                    : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        style={{
                          width: 32, height: 32, borderRadius: 8,
                          border: `1px solid ${page === p ? '#1d4ed8' : '#e2e8f0'}`,
                          background: page === p ? '#1d4ed8' : '#fff',
                          color: page === p ? '#fff' : '#475569',
                          cursor: 'pointer', fontSize: 13, fontWeight: 600,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        {p}
                      </button>
                    )
                  )
                }

                {/* Suivant */}
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    border: '1px solid #e2e8f0', background: page === totalPages ? '#f8fafc' : '#fff',
                    color: page === totalPages ? '#cbd5e1' : '#475569',
                    cursor: page === totalPages ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 600,
                  }}
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal détail ── */}
      {detailItem && (
        <DetailModal
          s={detailItem}
          onClose={() => setDetailItem(null)}
          onSuspend={handleSuspend}
          onReactivate={handleReactivate}
        />
      )}
    </AppLayout>
  );
}