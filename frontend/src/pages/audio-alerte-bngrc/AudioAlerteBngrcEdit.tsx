import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { AudioAlerteBngrcUploadForm, AudioAlerteBngrcUploadFormData } from "@/components/audio-alerte-bngrc/AudioAlerteBngrcUploadForm";
import { audioAlerteBngrcApi } from "@/services/audioAlerteBngrc.api";

export function AudioAlerteBngrcEdit() {
    const { id }   = useParams<{ id: string }>();
    const qc       = useQueryClient();
    const navigate = useNavigate();
  
    const { data: raw, isLoading } = useQuery({
      queryKey: ["audio-alerte-bngrc", id],
      queryFn:  () => audioAlerteBngrcApi.getById(Number(id)),
      enabled:  !!id,
    });
    const item = Array.isArray(raw) ? raw[0] : (raw as any)?.response ?? raw;
  
    const mutation = useMutation({
      mutationFn: ({ data, file }: { data: AudioAlerteBngrcUploadFormData; file?: File }) => {
        const fd = new FormData();
        if (file) fd.append("audio", file);
        fd.append("categorieAlerteBngrcId", String(data.categorieAlerteBngrcId));
        data.sireneIds.forEach(id => { fd.append("sireneIds[]", String(id));});

        if (data.name)        fd.append("name",        data.name);
        if (data.description) fd.append("description", data.description);
        // mobileId non modifiable — généré à la création, conservé tel quel
        return audioAlerteBngrcApi.update(Number(id), fd);
      },
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["audio-alerte-bngrc"] });
        navigate("/audio-alerte-bngrc");
      },
    });
  
    if (isLoading) return <AppLayout><div className="empty-state"><p>Chargement…</p></div></AppLayout>;
  
    const initialData = item ? {
      ...item,
      id:                     item.id,
      categorieAlerteBngrcId: item.categorieAlerteBngrcId,
      typeAlerteBngrcId:      item.categorie?.typeAlerteBngrcId ?? 0,
      alerteBngrcId:          item.categorie?.type?.alerteBngrcId ?? 0,
      sireneIds:              item.sirenes?.map((s: any) => s.id) ?? [],
      existingAudio:          item.audio,
      originalFilename:       item.originalFilename,
    } : undefined;
  
    const errorMsg = mutation.isError
      ? (mutation.error as any)?.message || "Erreur lors de la mise à jour"
      : undefined;

    return (
      <AppLayout>
        <AudioAlerteBngrcUploadForm
          initialData={initialData}
          onSubmit={async (data, file) => mutation.mutate({ data, file })}
          loading={mutation.isPending}
          error={errorMsg}
        />
      </AppLayout>
    );
}
  