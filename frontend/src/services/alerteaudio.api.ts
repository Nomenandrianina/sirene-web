import { AlerteAudio, UsedCombination } from '@/types/alerteAudio';
import { get, post, patch, del } from './base';
const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const token = () => localStorage.getItem("access_token") ?? "";

// multipart/form-data — on construit le FormData nous-mêmes
// On définit un type étendu pour la création qui inclut les sirènes
  type CreateAudioDTO = Omit<AlerteAudio, "id" | "audio" | "sousCategorie" | "createdAt"> & { 
    sireneIds?: number[] 
  };

  async function postAudio(dto: CreateAudioDTO, file: File): Promise<AlerteAudio> {
      const fd = new FormData();
      fd.append("file", file);
      
      // Ajout important : Boucler sur les sireneIds
      if (dto.sireneIds && Array.isArray(dto.sireneIds)) {
          dto.sireneIds.forEach(id => {
              fd.append("sireneIds", String(id));
          });
      }

      fd.append("mobileId", dto.mobileId || "");
      fd.append("sousCategorieAlerteId", String(dto.sousCategorieAlerteId));
      
      if (dto.name)         fd.append("name", dto.name);
      if (dto.description)  fd.append("description", dto.description);
      if (dto.duration)     fd.append("duration", String(dto.duration));
    
      const res = await fetch(`${BASE}/alerte-audios`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}` },
        body: fd,
      });
      
      if (!res.ok) throw new Error((await res.json())?.message || "Erreur création");
      return res.json();
  }

  async function patchAudio( id: number, dto: Partial<CreateAudioDTO>, file?: File): Promise<AlerteAudio> {
      const fd = new FormData();
      if (file) fd.append("file", file);
      
      // En modification, on peut envoyer un sireneIds (souvent [id])
      if (dto.sireneIds && Array.isArray(dto.sireneIds)) {
          dto.sireneIds.forEach(sid => fd.append("sireneIds", String(sid)));
      }

      if (dto.mobileId) fd.append("mobileId", dto.mobileId);
      if (dto.sousCategorieAlerteId) fd.append("sousCategorieAlerteId", String(dto.sousCategorieAlerteId));
      if (dto.name !== undefined)        fd.append("name", dto.name ?? "");
      if (dto.description !== undefined) fd.append("description", dto.description ?? "");
      if (dto.duration !== undefined)    fd.append("duration", String(dto.duration));
    
      const res = await fetch(`${BASE}/alerte-audios/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token()}` },
        body: fd,
      });
      if (!res.ok) throw new Error((await res.json())?.message || "Erreur modification");
      return res.json();
  }

  
export const alerteAudiosApi = {
    getAll:   (sousCategorieAlerteId?: number) =>
      get(`/alerte-audios${sousCategorieAlerteId ? `?sousCategorieAlerteId=${sousCategorieAlerteId}` : ""}`),
    getById:  (id: number) => get(`/alerte-audios/${id}`),
    create:   postAudio,
    update:   patchAudio,
    remove:   (id: number) => del(`/alerte-audios/${id}`),
    getUsedSousCategorieIds: () => get("/alerte-audios/used-sous-categories"),

    // URL publique du fichier audio
    audioUrl: (audioPath: string) => {
      const normalized = audioPath.replace(/\\/g, "/");
      return `${BASE.replace("/api", "")}/${normalized}`;
    },

    getUsedCombinations: () => get<UsedCombination[]>("/alerte-audios/used-combinations"),

};
