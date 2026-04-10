import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import SouscriptionStepper from '@/components/souscription/Souscriptionstepper';
import { useRole } from '@/hooks/useRole';
import { Navigate } from 'react-router-dom';
import { souscriptionApi } from '@/services/diffusion.api';
import type { Souscription } from '@/types/diffusion';
import { customersApi } from '@/services/customers.api';

interface Customer { id: number; name: string; company?: string; users?: { id: number; email: string }[] }

const STATUS_CFG = {
  active:    { label: 'Actif',      dot: 'bg-green-400',  text: 'text-green-700',  bg: 'bg-green-50'  },
  expired:   { label: 'Expiré',     dot: 'bg-red-400',    text: 'text-red-700',    bg: 'bg-red-50'    },
  suspended: { label: 'Suspendu',   dot: 'bg-yellow-400', text: 'text-yellow-700', bg: 'bg-yellow-50' },
  pending:   { label: 'En attente', dot: 'bg-slate-400',  text: 'text-slate-600',  bg: 'bg-slate-50'  },
};

type View = 'list' | 'add';

/**
 * Normalise toute réponse API en tableau.
 * Gère : tableau direct, { data:[] }, { response:[] }, { customers:[] }, { items:[] }…
 */
function toArr<T>(r: unknown): T[] {
  if (!r) return [];
  if (Array.isArray(r)) return r as T[];
  if (typeof r === 'object') {
    for (const key of ['data', 'response', 'items', 'results', 'customers', 'souscriptions']) {
      const val = (r as Record<string, unknown>)[key];
      if (Array.isArray(val)) return val as T[];
    }
    // fallback : première valeur tableau trouvée
    const first = Object.values(r as object).find((v) => Array.isArray(v));
    if (first) return first as T[];
  }
  return [];
}

export default function AdminSouscriptionsPage() {
  const { isSuperAdmin } = useRole();

  if (!isSuperAdmin) return <Navigate to="/" replace />;

  const [view, setView]                         = useState<View>('list');
  const [customers, setCustomers]               = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [souscriptions, setSouscriptions]       = useState<Souscription[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingSubs, setLoadingSubs]           = useState(false);
  const [customerFilter, setCustomerFilter]     = useState('');

  // Charger tous les customers — toArr() protège contre les réponses enveloppées
  useEffect(() => {
    customersApi.getAll()
      .then((res: unknown) => setCustomers(toArr<Customer>(res)))
      .catch(() => setCustomers([]))
      .finally(() => setLoadingCustomers(false));
  }, []);

  // Charger les souscriptions du customer sélectionné
  useEffect(() => {
    if (!selectedCustomer) { setSouscriptions([]); return; }
    setLoadingSubs(true);
    souscriptionApi.getAll({ customerId: selectedCustomer.id })
      .then((res: unknown) => setSouscriptions(toArr<Souscription>(res)))
      .catch(() => setSouscriptions([]))
      .finally(() => setLoadingSubs(false));
  }, [selectedCustomer]);

  const reloadSubs = () => {
    if (!selectedCustomer) return;
    souscriptionApi.getAll({ customerId: selectedCustomer.id })
      .then((res: unknown) => setSouscriptions(toArr<Souscription>(res)));
  };

  const filteredCustomers = customers.filter((c) =>
    !customerFilter ||
    c.name?.toLowerCase().includes(customerFilter.toLowerCase()) ||
    c.company?.toLowerCase().includes(customerFilter.toLowerCase())
  );

  const targetUserId = selectedCustomer?.users?.[0]?.id ?? 0;

  return (
    <AppLayout>
      <div className="page-wrap">
        <div className="page-header">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Gestion des souscriptions</h1>
            <p className="page-subtitle">Attribuez des packs de diffusion aux clients</p>
          </div>
          {view === 'list' && selectedCustomer && (
            <button onClick={() => setView('add')}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
              + Ajouter un pack
            </button>
          )}
          {view === 'add' && (
            <button onClick={() => setView('list')}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
              ← Retour à la liste
            </button>
          )}
        </div>

        <div className="mt-6 flex gap-6" style={{ minHeight: 500 }}>

          {/* ── Sidebar liste des clients ── */}
          <div className="w-64 shrink-0">
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden h-full">
              <div className="px-3 py-2.5 border-b border-slate-100 bg-slate-50">
                <input value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)}
                  placeholder="Rechercher un client…"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs
                    focus:outline-none focus:ring-2 focus:ring-blue-200" />
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: 520 }}>
                {loadingCustomers ? (
                  <div className="space-y-2 p-3">
                    {[1,2,3,4].map((i) => <div key={i} className="h-10 rounded-lg bg-slate-100 animate-pulse" />)}
                  </div>
                ) : filteredCustomers.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">Aucun client</p>
                ) : (
                  filteredCustomers.map((c) => (
                    <button key={c.id}
                      onClick={() => { setSelectedCustomer(c); setView('list'); }}
                      className={`w-full text-left px-3 py-2.5 border-b border-slate-50 transition-colors
                        ${selectedCustomer?.id === c.id ? 'bg-blue-50 border-l-2 border-l-blue-500' : 'hover:bg-slate-50'}`}>
                      <div className="text-xs font-semibold text-slate-800 truncate">{c.name}</div>
                      {c.company && <div className="text-xs text-slate-400 truncate">{c.company}</div>}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ── Zone principale ── */}
          <div className="flex-1 min-w-0">
            {!selectedCustomer ? (
              <div className="rounded-xl border border-dashed border-slate-200 py-24 text-center">
                <p className="text-sm text-slate-400">Sélectionnez un client pour voir ses souscriptions</p>
              </div>

            ) : view === 'list' ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-slate-700">
                    Souscriptions de <span className="text-blue-600">{selectedCustomer.name}</span>
                  </h2>
                  <span className="text-xs text-slate-400">({souscriptions.length})</span>
                </div>

                {loadingSubs ? (
                  <div className="space-y-3">
                    {[1,2].map((i) => <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse" />)}
                  </div>
                ) : souscriptions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 py-14 text-center">
                    <p className="text-sm text-slate-400 mb-3">Aucune souscription pour ce client.</p>
                    <button onClick={() => setView('add')} className="text-sm text-blue-600 hover:underline">
                      Ajouter le premier pack
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {souscriptions.map((s) => {
                      const cfg = STATUS_CFG[s.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.pending;
                      const sirenes: any[] = (s as any).sirenes ?? [];
                      return (
                        <div key={s.id} className="rounded-xl border border-slate-200 bg-white px-5 py-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-slate-800 capitalize">
                                  Pack {s.packType?.name}
                                </span>
                                <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.text}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                  {cfg.label}
                                </span>
                              </div>
                              <div className="text-xs text-slate-400 mt-0.5">
                                {sirenes.length} sirène{sirenes.length > 1 ? 's' : ''}
                                {' '}· Du {new Date(s.startDate).toLocaleDateString('fr-FR')}
                                {' '}au {new Date(s.endDate).toLocaleDateString('fr-FR')}
                              </div>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              {s.status === 'active' && (
                                <button
                                  onClick={async () => {
                                    await souscriptionApi.suspend(s.id);
                                    reloadSubs();
                                  }}
                                  className="text-xs px-2.5 py-1 rounded-lg border border-yellow-200 text-yellow-700 hover:bg-yellow-50">
                                  Suspendre
                                </button>
                              )}
                              {s.status === 'suspended' && (
                                <button
                                  onClick={async () => {
                                    await souscriptionApi.reactivate(s.id);
                                    reloadSubs();
                                  }}
                                  className="text-xs px-2.5 py-1 rounded-lg border border-green-200 text-green-700 hover:bg-green-50">
                                  Réactiver
                                </button>
                              )}
                            </div>
                          </div>
                          {sirenes.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {sirenes.map((sr: any) => (
                                <span key={sr.id} className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                  📡 {sr.name ?? `#${sr.id}`}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            ) : (
              /* ── Vue ajout pack via stepper ── */
              <div>
                <p className="text-sm text-slate-500 mb-5">
                  Attribution d'un pack à <strong>{selectedCustomer.name}</strong>
                </p>
                <SouscriptionStepper
                  userId={targetUserId}
                  customerId={selectedCustomer.id}
                  onSuccess={() => { setView('list'); reloadSubs(); }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}