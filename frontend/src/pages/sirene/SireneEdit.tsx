import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sirenesApi, CreateSireneDto } from "@/services/sirene.api";
import { SireneForm } from "@/components/sirene/Sireneform";
import { AppLayout } from "@/components/AppLayout";

export default function SireneEdit() {
  const { id }      = useParams<{ id: string }>();
  const navigate    = useNavigate();
  const queryClient = useQueryClient();

  const { data: sirene, isLoading } = useQuery({
    queryKey: ["sirene", id],
    queryFn:  () => sirenesApi.getById(Number(id)),
    enabled:  !!id,
  });

  const mutation = useMutation({
    mutationFn: (data: CreateSireneDto) => sirenesApi.update(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sirenes"] });
      navigate("/sirenes");
    },
  });

  if (isLoading) return <div className="sirene-loading">Chargement…</div>;

  // Mapper customers[] (objets) → customerIds[] (ids) pour SireneForm
  const initialData = sirene ? {
    ...sirene,
    id:          sirene.id,
    customerIds: sirene.customers?.map((c: any) => c.id) ?? [],
  } : undefined;

  return (
    <AppLayout>
      <SireneForm
        initialData={initialData}
        onSubmit={async (data) => mutation.mutate(data)}
        loading={mutation.isPending}
        error={mutation.isError ? "Une erreur est survenue." : undefined}
      />
    </AppLayout>
  );
}