import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useNavigate, useParams }                from "react-router-dom";
import { AppLayout }                             from "@/components/AppLayout";
import { AudioAlerteBngrcForm }                  from "@/components/audio-alerte-bngrc/AudioAlerteBngrcForm";
import { audioAlerteBngrcApi }                   from "@/services/audioAlerteBngrc.api";


export function AudioAlerteBngrcCreate() {
  const navigate = useNavigate();
  const qc       = useQueryClient();

  const mutation = useMutation({
    mutationFn: (fd: FormData) => audioAlerteBngrcApi.create(fd),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ["audio-alerte-bngrc"] });
      navigate("/audio-alerte-bngrc");
    },
  });

  return (
    <AppLayout>
      <AudioAlerteBngrcForm
        onSubmit={async fd => mutation.mutate(fd)}
        loading={mutation.isPending}
        error={mutation.isError ? "Une erreur est survenue." : undefined}
      />
    </AppLayout>
  );
}
  