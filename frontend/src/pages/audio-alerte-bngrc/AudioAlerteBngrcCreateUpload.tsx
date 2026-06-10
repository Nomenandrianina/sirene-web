import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { AudioAlerteBngrcUploadForm, AudioAlerteBngrcUploadFormData } from "@/components/audio-alerte-bngrc/AudioAlerteBngrcUploadForm";
import { audioAlerteBngrcApi } from "@/services/audioAlerteBngrc.api";

// ── Create via upload ─────────────────────────────────────────────────────────
export function AudioAlerteBngrcCreateUpload() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ data, file }: { data: AudioAlerteBngrcUploadFormData; file: File }) => {
      const fd = new FormData();
      fd.append("audio",                    file);
      fd.append("categorieAlerteBngrcId",   String(data.categorieAlerteBngrcId));
      fd.append("sireneIds",                JSON.stringify(data.sireneIds));
      if (data.name)        fd.append("name",        data.name);
      if (data.description) fd.append("description", data.description);
      if (data.duration)    fd.append("duration",    String(data.duration));
      // mobileId NON envoyé — généré automatiquement côté backend
      return audioAlerteBngrcApi.create(fd);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["audio-alerte-bngrc"] });
      navigate("/audio-alerte-bngrc");
    },
  });

  const errorMsg = mutation.isError ? (mutation.error as any)?.message || (mutation.error as any)?.response?.data?.message || "Erreur lors de l'upload" : undefined;

  return (
    <AppLayout>
      <AudioAlerteBngrcUploadForm
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