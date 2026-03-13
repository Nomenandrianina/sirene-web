import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { AlerteAudioForm, AlerteAudioFormData } from "@/components/alerteaudio/AlerteAudioForm";
import { alerteAudiosApi } from "@/services/alerteaudio.api";

export default function AlerteAudioEdit() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: raw, isLoading } = useQuery({
    queryKey: ["alerte-audio", id],
    queryFn:  () => alerteAudiosApi.getById(Number(id)),
    enabled:  !!id,
  });

  const item = Array.isArray(raw) ? raw[0] : (raw as any)?.response ?? raw;

  const mutation = useMutation({
    mutationFn: ({ data, file }: { data: AlerteAudioFormData; file?: File }) =>
      alerteAudiosApi.update(Number(id), {
        name:                  data.name || undefined,
        description:           data.description || undefined,
        mobileId:              data.mobileId,
        duration:              data.duration ? Number(data.duration) : undefined,
        sousCategorieAlerteId: data.sousCategorieAlerteId,
      }, file),
    onSuccess: () => { qc.invalidateQueries({queryKey:["alerte-audios"]}); navigate("/alerte-audios"); },
  });

  if (isLoading) return <AppLayout><div className="empty-state"><p>Chargement…</p></div></AppLayout>;

  // Reconstituer la cascade depuis les relations imbriquées
  const initialData = item ? {
    ...item,
    id:                    item.id,
    duration:              item.duration ? String(item.duration) : "",
    sousCategorieAlerteId: item.sousCategorieAlerteId ?? item.sousCategorie?.id ?? 0,
    categorieAlerteId:     item.sousCategorie?.categorieAlerteId ?? item.sousCategorie?.categorieAlerte?.id ?? 0,
    alerteTypeId:          item.sousCategorie?.alerteTypeId ?? item.sousCategorie?.alerteType?.id ?? 0,
    alerteId:              item.sousCategorie?.alerteId ?? item.sousCategorie?.alerte?.id ?? 0,
    existingAudio:         item.audio,
    originalFilename:      item.originalFilename,
  } : undefined;

  return (
    <AppLayout>
      <AlerteAudioForm
        initialData={initialData}
        onSubmit={async (data, file) => mutation.mutate({ data, file })}
        loading={mutation.isPending}
        error={mutation.isError ? "Une erreur est survenue." : undefined}
      />
    </AppLayout>
  );
}