import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { AlerteAudioForm, AlerteAudioFormData } from "@/components/alerteaudio/AlerteAudioForm";
import { alerteAudiosApi } from "@/services/alerteaudio.api";
import { useRole } from "@/hooks/useRole"; // ← ajout

export default function AlerteAudioCreate() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { isSuperAdmin, customerId } = useRole(); // ← ajout

  const mutation = useMutation({
    mutationFn: ({ data, file }: { data: AlerteAudioFormData; file: File }) =>
      alerteAudiosApi.create({
        name:                  data.name || undefined,
        description:           data.description || undefined,
        mobileId:              data.mobileId,
        sireneIds:             data.sireneIds,
        duration:              data.duration ? Number(data.duration) : undefined,
        sousCategorieAlerteId: data.sousCategorieAlerteId,
        categorieAlerteId : data.categorieAlerteId,
        customerId: isSuperAdmin ? (data.customerId ?? null) : customerId,
        alerteTypeId:      data.alerteTypeId,   // ← ajout
        alerteId:          data.alerteId,    
        newSousCatName:        data.newSousCatName || undefined, // ← ajout

      }, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alerte-audios"] });
      navigate("/alerte-audios");
    },
    onError: (e: any) => {
      console.error("Upload error:", e);
    },
  });

  const errorMsg = mutation.isError
    ? (mutation.error as any)?.message
      || (mutation.error as any)?.response?.data?.message
      || "Erreur lors de l'upload"
    : undefined;

  return (
    <AppLayout>
      <AlerteAudioForm
        onSubmit={async (data, file) => {
          if (!file) return;
          mutation.mutate({ data, file });
        }}
        loading={mutation.isPending}
        error={errorMsg}
      />
    </AppLayout>
  );
}