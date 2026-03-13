import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { AlerteAudioForm, AlerteAudioFormData } from "@/components/alerteaudio/AlerteAudioForm";
import { alerteAudiosApi } from "@/services/alerteaudio.api";

export default function AlerteAudioCreate() {
    const navigate = useNavigate();
    const qc = useQueryClient();
  
    const mutation = useMutation({
      mutationFn: ({ data, file }: { data: AlerteAudioFormData; file: File }) =>
        alerteAudiosApi.create({
          name:                  data.name || undefined,
          description:           data.description || undefined,
          mobileId:              data.mobileId,
          duration:              data.duration ? Number(data.duration) : undefined,
          sousCategorieAlerteId: data.sousCategorieAlerteId,
        }, file),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["alerte-audios"] });
        navigate("/alerte-audios");
      },
      onError: (e: any) => {
        console.error("Upload error:", e);
      },
    });
  
    // Extraire le vrai message d'erreur backend
    const errorMsg = mutation.isError
      ? (mutation.error as any)?.message
        || (mutation.error as any)?.response?.data?.message
        || "Erreur lors de l\'upload"
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