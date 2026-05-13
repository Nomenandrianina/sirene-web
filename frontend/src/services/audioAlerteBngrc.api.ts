import { get, post, patch, del } from './base';

// ── Même pattern que alerteAudiosApi ─────────────────────────────────────────
const BASE  = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const token = () => localStorage.getItem("access_token") ?? "";

// ── Multipart POST — création ─────────────────────────────────────────────────
async function postAudioBngrc(formData: FormData): Promise<any> {
  const res = await fetch(`${BASE}/audio-alerte-bngrc`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${token()}` },
    body:    formData,
  });
  if (!res.ok) throw new Error((await res.json())?.message || 'Erreur création audio BNGRC');
  return res.json();
}

// ── Multipart PUT — mise à jour ───────────────────────────────────────────────
async function putAudioBngrc(id: number, formData: FormData): Promise<any> {
  const res = await fetch(`${BASE}/audio-alerte-bngrc/${id}`, {
    method:  'PUT',
    headers: { Authorization: `Bearer ${token()}` },
    body:    formData,
  });
  if (!res.ok) throw new Error((await res.json())?.message || 'Erreur mise à jour audio BNGRC');
  return res.json();
}

// ── API exportée ──────────────────────────────────────────────────────────────
export const audioAlerteBngrcApi = {
  getAll:         ()                              => get('/audio-alerte-bngrc'),
  getByCategorie: (categorieAlerteBngrcId: number) =>
                    get(`/audio-alerte-bngrc?categorieAlerteBngrcId=${categorieAlerteBngrcId}`),
  getById:        (id: number)                    => get(`/audio-alerte-bngrc/${id}`),

  create: postAudioBngrc,
  update: putAudioBngrc,

  validate: (id: number, dto: { status: string; rejectionComment?: string }) =>
    patch(`/audio-alerte-bngrc/${id}/validate`, dto),

  addSirenes:    (id: number, sireneIds: number[]) =>
    patch(`/audio-alerte-bngrc/${id}/sirenes/add`, { sireneIds }),

  removeSirenes: (id: number, sireneIds: number[]) =>
    patch(`/audio-alerte-bngrc/${id}/sirenes/remove`, { sireneIds }),

  remove: (id: number) => del(`/audio-alerte-bngrc/${id}`),

  // URL publique pour lecture audio — même logique qu'alerteAudiosApi.audioUrl
  audioUrl: (audioPath: string) => {
    const normalized = audioPath.replace(/\\/g, '/');
    return `${BASE.replace('/api', '')}/${normalized}`;
  },
};