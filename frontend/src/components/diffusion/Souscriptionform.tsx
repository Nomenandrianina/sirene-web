import { useState, useEffect } from 'react';
import type { PackType, Sirene, AlerteAudio } from '@/types/diffusion';
import { packTypeApi, souscriptionApi } from '@/services/diffusion.api';
import { alerteAudiosApi } from '@/services/alerteaudio.api'; // ← votre API existante

interface SouscriptionFormProps {
  userId: number;
  /** Sirènes déjà filtrées par le backend (liées au customer de l'user connecté) */
  sirenes: Sirene[];
  onSuccess?: () => void;
}

const PACK_ICONS: Record<string, string> = {
  premium: '🏆',
  medium: '⭐',
  basique: '📻',
};

const PACK_COLORS: Record<string, { bg: string; border: string; badge: string }> = {
  premium: { bg: 'bg-amber-50', border: 'border-amber-400', badge: 'bg-amber-100 text-amber-800' },
  medium:  { bg: 'bg-blue-50',  border: 'border-blue-400',  badge: 'bg-blue-100 text-blue-800'  },
  basique: { bg: 'bg-gray-50',  border: 'border-gray-300',  badge: 'bg-gray-100 text-gray-700'  },
};

export default function SouscriptionForm({ userId, sirenes, onSuccess }: SouscriptionFormProps) {
  const [packs, setPacks]                       = useState<PackType[]>([]);
  const [selectedPack, setSelectedPack]         = useState<PackType | null>(null);
  const [selectedSireneId, setSelectedSireneId] = useState<number | null>(null);
  const [selectedAudioId, setSelectedAudioId]   = useState<number | null>(null);

  // Audios chargés via alerteAudiosApi.getBySirene dès qu'une sirène est sélectionnée
  const [audios, setAudios]               = useState<AlerteAudio[]>([]);
  const [loadingAudios, setLoadingAudios] = useState(false);

  const [loadingPacks, setLoadingPacks] = useState(true);
  const [saving, setSaving]             = useState(false);
  const [success, setSuccess]           = useState(false);
  const [error, setError]               = useState<string | null>(null);

  // Charger les packs actifs au montage
  useEffect(() => {
    packTypeApi.getAll(true)
      .then(setPacks)
      .finally(() => setLoadingPacks(false));
  }, []);

  // Charger les audios dès qu'une sirène est sélectionnée
  useEffect(() => {
    if (!selectedSireneId) {
      setAudios([]);
      setSelectedAudioId(null);
      return;
    }
    setLoadingAudios(true);
    setSelectedAudioId(null);
    alerteAudiosApi
      .getBySirene(selectedSireneId)
      .then((data: AlerteAudio[]) => setAudios(data))
      .finally(() => setLoadingAudios(false));
  }, [selectedSireneId]);

  const handleSireneSelect = (id: number) => {
    // Reset audio si on change de sirène
    setSelectedAudioId(null);
    setSelectedSireneId(id);
  };

  const handleSubmit = async () => {
    if (!selectedPack || !selectedSireneId || !selectedAudioId) return;
    setSaving(true);
    setError(null);
    try {
      await souscriptionApi.create({
        userId,
        packTypeId: selectedPack.id,
        sireneId: selectedSireneId,
        alerteAudioId: selectedAudioId,
      });
      setSuccess(true);
      onSuccess?.();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Erreur lors de la souscription');
    } finally {
      setSaving(false);
    }
  };

  const canSubmit = !!selectedPack && !!selectedSireneId && !!selectedAudioId && !saving;

  // ── Écran de succès ──────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center">
        <div className="text-4xl mb-3">✅</div>
        <h3 className="text-lg font-medium text-green-800 mb-1">Souscription activée !</h3>
        <p className="text-green-600 text-sm">
          Votre pack <strong>{selectedPack?.name}</strong> est actif.
          Les diffusions démarreront au prochain créneau.
        </p>
        <button
          onClick={() => {
            setSuccess(false);
            setSelectedPack(null);
            setSelectedSireneId(null);
            setSelectedAudioId(null);
            setAudios([]);
          }}
          className="mt-4 text-sm text-green-700 underline"
        >
          Souscrire un autre pack
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* ── Étape 1 : Pack ─────────────────────────────────────────────── */}
      <section>
        <h2 className="text-base font-medium text-slate-800 mb-3">
          1. Choisissez votre pack
        </h2>
        {loadingPacks ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {packs.map((pack) => {
              const colors    = PACK_COLORS[pack.name] ?? PACK_COLORS.basique;
              const isSelected = selectedPack?.id === pack.id;
              return (
                <button
                  key={pack.id}
                  onClick={() => setSelectedPack(pack)}
                  className={`relative rounded-xl border-2 p-5 text-left transition-all
                    ${colors.bg}
                    ${isSelected ? colors.border + ' shadow-md' : 'border-transparent hover:border-slate-200'}`}
                >
                  {isSelected && (
                    <span className="absolute top-3 right-3 text-xs font-medium px-2 py-0.5 rounded-full bg-white border border-slate-200">
                      ✓ Sélectionné
                    </span>
                  )}
                  <div className="text-2xl mb-2">{PACK_ICONS[pack.name] ?? '📦'}</div>
                  <div className="font-medium text-slate-900 capitalize mb-1">Pack {pack.name}</div>
                  <div className="text-xs text-slate-500 mb-3 leading-relaxed">{pack.description}</div>
                  <div className="flex flex-wrap gap-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${colors.badge}`}>
                      {pack.frequenceParJour}x / jour
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${colors.badge}`}>
                      {pack.joursParSemaine}j / sem.
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${colors.badge}`}>
                      {pack.dureeMaxMinutes} min / créneau
                    </span>
                  </div>
                  <div className="mt-4 text-lg font-semibold text-slate-900">
                    {Number(pack.prix).toLocaleString('fr-FR')} Ar
                    <span className="text-xs font-normal text-slate-400 ml-1">
                      / {pack.periode === 'monthly' ? 'mois' : 'semaine'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Étape 2 : Sirène ───────────────────────────────────────────── */}
      <section>
        <h2 className="text-base font-medium text-slate-800 mb-3">
          2. Choisissez la sirène
        </h2>
        {sirenes.length === 0 ? (
          <p className="text-sm text-slate-400">Aucune sirène disponible pour votre compte.</p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {sirenes.map((sirene) => (
              <button
                key={sirene.id}
                onClick={() => handleSireneSelect(sirene.id)}
                className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all
                  ${selectedSireneId === sirene.id
                    ? 'border-blue-400 bg-blue-50 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'}`}
              >
                <div className="text-xl">📡</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">
                    {sirene.name ?? `Sirène #${sirene.id}`}
                  </div>
                  <div className="text-xs text-slate-400">{sirene.phoneNumberBrain}</div>
                </div>
                {selectedSireneId === sirene.id && (
                  <span className="text-blue-500 text-sm shrink-0">✓</span>
                )}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ── Étape 3 : Audio — chargé par sirène via alerteAudiosApi ────── */}
      {selectedSireneId && (
        <section>
          <h2 className="text-base font-medium text-slate-800 mb-3">
            3. Choisissez l'audio à diffuser
          </h2>

          {loadingAudios ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-14 rounded-lg bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : audios.length === 0 ? (
            <p className="text-sm text-slate-400">
              Aucun audio disponible pour cette sirène.
            </p>
          ) : (
            <div className="space-y-2">
              {audios.map((audio) => (
                <button
                  key={audio.id}
                  onClick={() => setSelectedAudioId(audio.id)}
                  className={`w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-all
                    ${selectedAudioId === audio.id
                      ? 'border-purple-400 bg-purple-50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                >
                  <div className="text-xl">🎵</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">
                      {audio.name ?? `Audio #${audio.id}`}
                    </div>
                    <div className="text-xs text-slate-400">
                      {audio.duration
                        ? `Durée : ${Math.round(audio.duration)}s`
                        : 'Durée inconnue'}
                    </div>
                  </div>
                  {selectedAudioId === audio.id && (
                    <span className="text-purple-500 text-sm shrink-0">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Récapitulatif + confirmation ────────────────────────────────── */}
      {selectedPack && selectedSireneId && selectedAudioId && (
        <section className="rounded-xl bg-slate-50 border border-slate-200 p-5">
          <h3 className="text-sm font-medium text-slate-700 mb-3">Récapitulatif</h3>
          <div className="space-y-1 text-sm text-slate-600 mb-4">
            <div>
              Pack : <strong className="capitalize">{selectedPack.name}</strong>
            </div>
            <div>
              Créneaux :{' '}
              <strong>
                {['7h', '12h', '16h'].slice(0, selectedPack.frequenceParJour).join(', ')}
              </strong>
            </div>
            <div>
              Sirène :{' '}
              <strong>
                {sirenes.find((s) => s.id === selectedSireneId)?.name ?? `#${selectedSireneId}`}
              </strong>
            </div>
            <div>
              Audio :{' '}
              <strong>
                {audios.find((a) => a.id === selectedAudioId)?.name ?? `#${selectedAudioId}`}
              </strong>
            </div>
            <div>
              Durée :{' '}
              <strong>{selectedPack.periode === 'monthly' ? '1 mois' : '1 semaine'}</strong>
            </div>
            <div>
              Prix :{' '}
              <strong>{Number(selectedPack.prix).toLocaleString('fr-FR')} Ar</strong>
            </div>
          </div>

          {error && (
            <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white
              hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Activation en cours…' : 'Confirmer la souscription'}
          </button>
        </section>
      )}
    </div>
  );
}