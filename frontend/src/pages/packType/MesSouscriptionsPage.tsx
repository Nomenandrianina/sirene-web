import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import SouscriptionStepper from '@/components/souscription/Souscriptionstepper';
import MesSouscriptions from './Messouscriptions';
import { useRole } from '@/hooks/useRole';
import { Navigate } from 'react-router-dom';

type Tab = 'liste' | 'souscrire';

export default function MesSouscriptionsPage() {
  const { isClient, isSuperAdmin, userId, customerId } = useRole();
  const [tab, setTab] = useState<Tab>('liste');

  // Seul un client (user avec customer) ou superadmin peut accéder
  if (!isClient && !isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  // Le superadmin ne gère pas ses propres souscriptions ici
  // Il utilise AdminSouscriptionsPage
  if (isSuperAdmin && !isClient) {
    return <Navigate to="/souscriptionsadmins" replace />;
  }

  return (
    <AppLayout>
      <div className="page-wrap">
        <div className="page-header">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Mes diffusions</h1>
            <p className="page-subtitle">
              Gérez vos packs de diffusion et vos souscriptions actives
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 border-b border-slate-200">
          <nav className="flex gap-6">
            {([
              { key: 'liste',      label: 'Mes souscriptions' },
              { key: 'souscrire', label: 'Souscrire un pack'  },
            ] as { key: Tab; label: string }[]).map(({ key, label }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors -mb-px
                  ${tab === key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-6">
          {tab === 'liste' && userId && (
            <MesSouscriptions userId={userId} />
          )}

          {tab === 'souscrire' && userId && customerId && (
            <div className="max-w-3xl">
              <SouscriptionStepper
                userId={userId}
                customerId={customerId}
                onSuccess={() => setTab('liste')}
              />
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}