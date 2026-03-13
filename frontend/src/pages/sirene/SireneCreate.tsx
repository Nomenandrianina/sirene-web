import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sirenesApi, CreateSireneDto } from "@/services/sirene.api";
import { SireneForm } from "@/components/sirene/Sireneform";
import { AppLayout } from "@/components/AppLayout";

export default function SireneCreate() {
  const navigate    = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: CreateSireneDto) => sirenesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sirenes"] });
      navigate("/sirenes");
    },
  });

  return (
    <AppLayout>
    <SireneForm
      onSubmit={async (data) => mutation.mutate(data)}
      loading={mutation.isPending}
      error={mutation.isError ? "Une erreur est survenue." : undefined}
    />
    </AppLayout>
  );
}