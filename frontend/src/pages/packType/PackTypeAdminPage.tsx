import { useState, useEffect } from 'react';
import type { PackType } from '@/types/diffusion';
import { packTypeApi } from '@/services/diffusion.api';
import { AppLayout } from "@/components/AppLayout";

type FormState = Omit<PackType, 'id' | 'isActive'>;

const DEFAULT_FORM: FormState = {
  name: '',
  description: '',
  frequenceParJour: 1,
  joursParSemaine: 7,
  joursAutorises: null,
  dureeMaxMinutes: 15,
  prix: 0,
  periode: 'monthly',
  creneaux: [{ heure: 7, minute: 0 }],
};

export default function PackTypeAdminPage() {
  const [packs, setPacks] = useState<PackType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    try {
      const data = await packTypeApi.getAll();
      setPacks(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(DEFAULT_FORM);
    setError(null);
    setShowForm(true);
  };

  const openEdit = (pack: PackType) => {
    setEditingId(pack.id);
    setForm({
      name: pack.name,
      description: pack.description ?? '',
      frequenceParJour: pack.frequenceParJour,
      joursParSemaine: pack.joursParSemaine,
      joursAutorises: pack.joursAutorises,
      dureeMaxMinutes: pack.dureeMaxMinutes,
      prix: pack.prix,
      periode: pack.periode,
      creneaux: pack.creneaux ?? [{ heure: 7, minute: 0 }],
    });
    setError(null);
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await packTypeApi.update(editingId, form);
      } else {
        await packTypeApi.create(form);
      }
      setShowForm(false);
      await fetch();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Désactiver ce pack ?')) return;
    await packTypeApi.remove(id);
    await fetch();
  };

  const handleSeed = async () => {
    if (!confirm('Initialiser les 3 packs de base (premium, medium, basique) ?')) return;
    // await packTypeApi.seed();
    await fetch();
  };

  const set = (key: keyof FormState, val: any) =>
    setForm((f) => ({ ...f, [key]: val }));

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-medium text-gray-900">Gestion des packs</h1>
          <div className="flex gap-2">
            <button
              onClick={handleSeed}
              className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              Seed packs de base
            </button>
            <button
              onClick={openCreate}
              className="text-sm px-4 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              + Nouveau pack
            </button>
          </div>
        </div>

        {/* Liste */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs">Nom</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs">Fréquence</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs">Jours/sem.</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs">Créneau max</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs">Prix</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs">Statut</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {packs.map((pack) => (
                  <tr key={pack.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800 capitalize">{pack.name}</td>
                    {/* <td className="px-4 py-3 text-gray-600">{pack.frequenceParJour}x / jour</td> */}
                    <td className="px-4 py-3 text-gray-600">
                        {pack.creneaux?.length
                          ? pack.creneaux.map(c =>
                              `${String(c.heure).padStart(2,'0')}h${String(c.minute).padStart(2,'0')}`
                            ).join(', ')
                          : `${pack.frequenceParJour}x`
                        }
                      </td>
                    <td className="px-4 py-3 text-gray-600">{pack.joursParSemaine}j</td>
                    <td className="px-4 py-3 text-gray-600">{pack.dureeMaxMinutes} min</td>
                    <td className="px-4 py-3 text-gray-600">{pack.prix.toLocaleString('fr-FR')} Ar</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${pack.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {pack.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEdit(pack)} className="text-xs text-blue-600 hover:underline mr-3">
                        Modifier
                      </button>
                      <button onClick={() => handleDelete(pack.id)} className="text-xs text-red-400 hover:underline">
                        Désactiver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal formulaire */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
              <h2 className="text-base font-medium text-gray-900 mb-5">
                {editingId ? 'Modifier le pack' : 'Nouveau pack'}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nom</label>
                  <input
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="ex: premium"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                  <textarea
                    value={form.description ?? ''}
                    onChange={(e) => set('description', e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Diffusions / jour
                    </label>
                    <select
                      value={form.frequenceParJour}
                      onChange={(e) => set('frequenceParJour', Number(e.target.value))}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none"
                    >
                      <option value={1}>1x (7h)</option>
                      <option value={2}>2x (7h, 12h)</option>
                      <option value={3}>3x (7h, 12h, 16h)</option>
                    </select>
                  </div> */}

                  {/* Créneaux — remplace le select "Diffusions / jour" */ }
                    <div className="col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-medium text-gray-600">
                          Créneaux d'envoi ({form.creneaux?.length ?? 0}x / jour)
                        </label>
                        <button
                          type="button"
                          onClick={() => set('creneaux', [...(form.creneaux ?? []), { heure: 7, minute: 0 }])}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          + Ajouter
                        </button>
                      </div>
                      <div className="flex flex-col gap-2">
                        {(form.creneaux ?? []).map((c, i) => (
                          <div key={i} className="flex items-center gap-2">
                            {/* Heure */}
                            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                              <button
                                type="button"
                                className="text-slate-400 hover:text-blue-600 text-xs"
                                onClick={() => {
                                  const next = [...(form.creneaux ?? [])];
                                  next[i] = { ...next[i], heure: (next[i].heure + 1) % 24 };
                                  set('creneaux', next);
                                }}
                              >▲</button>
                              <span className="w-6 text-center text-sm font-semibold tabular-nums">
                                {String(c.heure).padStart(2, '0')}
                              </span>
                              <button
                                type="button"
                                className="text-slate-400 hover:text-blue-600 text-xs"
                                onClick={() => {
                                  const next = [...(form.creneaux ?? [])];
                                  next[i] = { ...next[i], heure: (next[i].heure - 1 + 24) % 24 };
                                  set('creneaux', next);
                                }}
                              >▼</button>
                            </div>

                            <span className="text-gray-400 font-semibold">:</span>

                            {/* Minute */}
                            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                              <button
                                type="button"
                                className="text-slate-400 hover:text-blue-600 text-xs"
                                onClick={() => {
                                  const next = [...(form.creneaux ?? [])];
                                  next[i] = { ...next[i], minute: (next[i].minute + 5) % 60 };
                                  set('creneaux', next);
                                }}
                              >▲</button>
                              <span className="w-6 text-center text-sm font-semibold tabular-nums">
                                {String(c.minute).padStart(2, '0')}
                              </span>
                              <button
                                type="button"
                                className="text-slate-400 hover:text-blue-600 text-xs"
                                onClick={() => {
                                  const next = [...(form.creneaux ?? [])];
                                  next[i] = { ...next[i], minute: (next[i].minute - 5 + 60) % 60 };
                                  set('creneaux', next);
                                }}
                              >▼</button>
                            </div>

                            <span className="text-xs text-gray-400 flex-1">
                              → {String(c.heure).padStart(2,'0')}h{String(c.minute).padStart(2,'0')}
                            </span>

                            {/* Supprimer */}
                            {(form.creneaux?.length ?? 0) > 1 && (
                              <button
                                type="button"
                                onClick={() => set('creneaux', (form.creneaux ?? []).filter((_, j) => j !== i))}
                                className="text-xs text-red-400 hover:text-red-600"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Jours / semaine
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={7}
                      value={form.joursParSemaine}
                      onChange={(e) => set('joursParSemaine', Number(e.target.value))}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Durée max créneau (min)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={60}
                      value={form.dureeMaxMinutes}
                      onChange={(e) => set('dureeMaxMinutes', Number(e.target.value))}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Prix (Ar)</label>
                    <input
                      type="number"
                      min={0}
                      value={form.prix}
                      onChange={(e) => set('prix', Number(e.target.value))}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Période</label>
                  <div className="flex gap-3">
                    {(['monthly', 'weekly'] as const).map((p) => (
                      <label key={p} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="periode"
                          value={p}
                          checked={form.periode === p}
                          onChange={() => set('periode', p)}
                        />
                        <span className="text-sm text-gray-700">
                          {p === 'monthly' ? 'Mensuel' : 'Hebdomadaire'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.name}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}