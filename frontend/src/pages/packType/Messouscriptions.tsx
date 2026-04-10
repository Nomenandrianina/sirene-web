import { useState, useEffect } from 'react';
import type { Souscription, DiffusionLog } from '@/types/diffusion';
import { souscriptionApi, diffusionLogApi } from '@/services/diffusion.api';

interface MesSouscriptionsProps {
  userId: number;
}

const STATUS_CONFIG = {
  active: { label: 'Actif', color: 'bg-green-100 text-green-800', dot: 'bg-green-400' },
  expired: { label: 'Expiré', color: 'bg-red-100 text-red-700', dot: 'bg-red-400' },
  suspended: { label: 'Suspendu', color: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-400' },
  pending: { label: 'En attente', color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
};

const CRENEAUX = ['7h00', '12h00', '16h00'];

export default function MesSouscriptions({ userId }: MesSouscriptionsProps) {
  const [souscriptions, setSouscriptions] = useState<Souscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [logs, setLogs] = useState<Record<number, DiffusionLog[]>>({});
  const [loadingLogs, setLoadingLogs] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchSouscriptions = async () => {
    try {
      const data = await souscriptionApi.getByUser(userId);
      setSouscriptions(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSouscriptions();
  }, [userId]);

  const toggleExpand = async (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (!logs[id]) {
      setLoadingLogs(id);
      try {
        const data = await diffusionLogApi.getBySubscription(id);
        setLogs((prev) => ({ ...prev, [id]: data }));
      } finally {
        setLoadingLogs(null);
      }
    }
  };

  const handleSuspend = async (id: number) => {
    setActionLoading(id);
    try {
      await souscriptionApi.suspend(id);
      await fetchSouscriptions();
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivate = async (id: number) => {
    setActionLoading(id);
    try {
      await souscriptionApi.reactivate(id);
      await fetchSouscriptions();
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (souscriptions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 p-10 text-center">
        <div className="text-3xl mb-2">📭</div>
        <p className="text-sm text-gray-500">Aucune souscription pour le moment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {souscriptions.map((s) => {
        const cfg = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.pending;
        const pack = s.packType;
        const joursRestants = s.joursRestants ?? 0;
        const creneauxAffiches = CRENEAUX.slice(0, pack?.frequenceParJour ?? 1);
        const isExpanded = expandedId === s.id;

        return (
          <div
            key={s.id}
            className="rounded-xl border border-gray-200 bg-white overflow-hidden"
          >
            {/* En-tête de la carte */}
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">
                    {pack?.name === 'premium' ? '🏆' : pack?.name === 'medium' ? '⭐' : '📻'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 capitalize">
                        Pack {pack?.name}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${cfg.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      Sirène #{s.sireneId} · Audio #{s.alerteAudioId}
                    </div>
                  </div>
                </div>

                {/* Jours restants */}
                <div className="text-right shrink-0">
                  {s.status === 'active' && (
                    <>
                      <div className={`text-sm font-semibold ${joursRestants <= 5 ? 'text-red-500' : 'text-gray-700'}`}>
                        {joursRestants} j restants
                      </div>
                      {joursRestants <= 5 && (
                        <div className="text-xs text-red-400">Expire bientôt</div>
                      )}
                    </>
                  )}
                  {s.status === 'expired' && (
                    <div className="text-xs text-red-400">Expiré le {s.dateFinFormatee}</div>
                  )}
                </div>
              </div>

              {/* Créneaux */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {creneauxAffiches.map((h) => (
                  <span key={h} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                    🕐 {h}
                  </span>
                ))}
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 border border-gray-100">
                  {pack?.joursParSemaine}j/sem · {pack?.dureeMaxMinutes}min/créneau
                </span>
              </div>

              {/* Barre de progression durée */}
              {s.status === 'active' && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>{s.dateFinFormatee ? `Fin : ${s.dateFinFormatee}` : ''}</span>
                    <span>{joursRestants}j restants</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-400 transition-all"
                      style={{
                        width: `${Math.min(100, Math.max(0, 100 - (joursRestants / 30) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => toggleExpand(s.id)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  {isExpanded ? 'Masquer historique' : 'Voir historique'}
                </button>

                {s.status === 'active' && (
                  <button
                    onClick={() => handleSuspend(s.id)}
                    disabled={actionLoading === s.id}
                    className="ml-auto text-xs px-3 py-1 rounded-lg border border-yellow-300 text-yellow-700 hover:bg-yellow-50 disabled:opacity-50"
                  >
                    Suspendre
                  </button>
                )}
                {s.status === 'suspended' && (
                  <button
                    onClick={() => handleReactivate(s.id)}
                    disabled={actionLoading === s.id}
                    className="ml-auto text-xs px-3 py-1 rounded-lg border border-green-300 text-green-700 hover:bg-green-50 disabled:opacity-50"
                  >
                    Réactiver
                  </button>
                )}
              </div>
            </div>

            {/* Historique des diffusions */}
            {isExpanded && (
              <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                <div className="text-xs font-medium text-gray-500 mb-2">
                  Historique des diffusions
                </div>

                {loadingLogs === s.id ? (
                  <div className="text-xs text-gray-400">Chargement…</div>
                ) : !logs[s.id]?.length ? (
                  <div className="text-xs text-gray-400">Aucune diffusion enregistrée.</div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {logs[s.id].map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center gap-2 text-xs"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            log.status === 'sent' ? 'bg-green-400' : 'bg-red-400'
                          }`}
                        />
                        <span className="text-gray-500">
                          {new Date(log.scheduledAt).toLocaleString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span
                          className={`font-medium ${
                            log.status === 'sent' ? 'text-green-600' : 'text-red-500'
                          }`}
                        >
                          {log.status === 'sent' ? 'Envoyé' : 'Échec'}
                        </span>
                        {log.error && (
                          <span className="text-red-400 truncate">{log.error}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}