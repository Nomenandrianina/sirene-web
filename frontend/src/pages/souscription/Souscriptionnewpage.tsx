import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { useRole } from '@/hooks/useRole';
import { Navigate } from 'react-router-dom';
import SouscriptionStepper from '@/components/souscription/Souscriptionstepper';
import { customersApi } from '@/services/customers.api';
import { ChevronLeft, Search, Building2, Users } from 'lucide-react';

interface Customer {
  id: number;
  name: string;
  company?: string;
  users?: { id: number; email: string }[];
}

function toArr<T>(r: unknown): T[] {
  if (!r) return [];
  if (Array.isArray(r)) return r as T[];
  if (typeof r === 'object') {
    for (const key of ['data','response','items','results','customers']) {
      const val = (r as Record<string, unknown>)[key];
      if (Array.isArray(val)) return val as T[];
    }
  }
  return [];
}

export default function SouscriptionNewPage() {
  const { isSuperAdmin } = useRole();
  const navigate         = useNavigate();

  if (!isSuperAdmin) return <Navigate to="/" replace />;

  const [customers, setCustomers]               = useState<Customer[]>([]);
  const [loading, setLoading]                   = useState(true);
  const [search, setSearch]                     = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    customersApi.getAll()
      .then((res: unknown) => setCustomers(toArr<Customer>(res)))
      .catch(() => setCustomers([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return customers.filter(c =>
      !q ||
      c.name?.toLowerCase().includes(q) ||
      c.company?.toLowerCase().includes(q)
    );
  }, [customers, search]);

  const targetUserId = selectedCustomer?.users?.[0]?.id ?? 0;

  return (
    <AppLayout>
      <div className="page-wrap">

        {/* ── Header ── */}
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={() => navigate('/souscription')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 13, color: '#64748b', background: 'none',
              border: 'none', cursor: 'pointer', marginBottom: 12,
              padding: 0,
            }}
          >
            <ChevronLeft size={15} /> Retour à la liste
          </button>
          <h1 className="text-xl font-semibold text-slate-900">Nouvelle souscription</h1>
          <p className="page-subtitle">
            {selectedCustomer
              ? `Attribution d'un pack à ${selectedCustomer.name}`
              : 'Sélectionnez d\'abord un client'}
          </p>
        </div>

        {/* ── Stepper visuel de progression ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28 }}>
          {['Choisir le client', 'Configurer le pack'].map((label, i) => {
            const done = i === 0 && !!selectedCustomer;
            const active = i === 0 ? !selectedCustomer : !!selectedCustomer;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < 1 ? 1 : undefined }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700,
                    background: done ? '#1d4ed8' : active ? '#dbeafe' : '#f1f5f9',
                    color: done ? '#fff' : active ? '#1d4ed8' : '#94a3b8',
                    border: active ? '2px solid #1d4ed8' : '2px solid transparent',
                  }}>
                    {done ? '✓' : i + 1}
                  </div>
                  <span style={{
                    fontSize: 13, fontWeight: active || done ? 600 : 400,
                    color: active || done ? '#1e293b' : '#94a3b8',
                  }}>
                    {label}
                  </span>
                </div>
                {i === 0 && (
                  <div style={{ flex: 1, height: 2, background: selectedCustomer ? '#1d4ed8' : '#e2e8f0', margin: '0 16px' }} />
                )}
              </div>
            );
          })}
        </div>

        {/* ── Étape 1 : choisir le client ── */}
        {!selectedCustomer && (
          <div className="panel">
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher un client par nom ou entreprise…"
                  style={{
                    width: '100%', paddingLeft: 34, paddingRight: 12,
                    paddingTop: 9, paddingBottom: 9,
                    border: '1px solid #e2e8f0', borderRadius: 8,
                    fontSize: 13, outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ padding: '8px 16px 16px' }}>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} style={{
                      height: 60, borderRadius: 10,
                      background: '#f1f5f9', animation: 'pulse 1.5s ease-in-out infinite',
                    }} />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: 13 }}>
                  Aucun client trouvé
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {filtered.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCustomer(c)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '12px 16px', borderRadius: 10,
                        border: '1px solid #e8edf2', background: '#fff',
                        cursor: 'pointer', textAlign: 'left',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = '#93c5fd';
                        e.currentTarget.style.background = '#f0f7ff';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = '#e8edf2';
                        e.currentTarget.style.background = '#fff';
                      }}
                    >
                      {/* Avatar */}
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                        background: '#dbeafe', color: '#1d4ed8',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16, fontWeight: 700,
                      }}>
                        {c.name[0].toUpperCase()}
                      </div>

                      {/* Infos */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{c.name}</div>
                        {c.company && (
                          <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                            <Building2 size={11} /> {c.company}
                          </div>
                        )}
                      </div>

                      {/* Users */}
                      {c.users && c.users.length > 0 && (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          fontSize: 11, color: '#6366f1', background: '#eef2ff',
                          padding: '3px 10px', borderRadius: 20,
                        }}>
                          <Users size={10} /> {c.users.length} user{c.users.length > 1 ? 's' : ''}
                        </div>
                      )}

                      <div style={{ fontSize: 12, color: '#3b82f6', fontWeight: 500 }}>
                        Sélectionner →
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Étape 2 : stepper existant ── */}
        {selectedCustomer && (
          <div>
            {/* Résumé client sélectionné */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: '#eff6ff', border: '1px solid #bfdbfe',
              borderRadius: 10, padding: '12px 16px', marginBottom: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: '#dbeafe', color: '#1d4ed8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, fontWeight: 700,
                }}>
                  {selectedCustomer.name[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1e40af' }}>{selectedCustomer.name}</div>
                  {selectedCustomer.company && (
                    <div style={{ fontSize: 12, color: '#3b82f6' }}>{selectedCustomer.company}</div>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                style={{
                  fontSize: 12, color: '#3b82f6', background: 'none',
                  border: '1px solid #93c5fd', borderRadius: 8,
                  padding: '5px 12px', cursor: 'pointer', fontWeight: 500,
                }}
              >
                Changer de client
              </button>
            </div>

            {/* Stepper */}
            <SouscriptionStepper
              userId={targetUserId}
              customerId={selectedCustomer.id}
              onSuccess={() => navigate('/souscription')}
            />
          </div>
        )}
      </div>
    </AppLayout>
  );
}