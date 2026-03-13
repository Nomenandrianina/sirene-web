import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { AlerteForm, AlerteFormData } from "@/components/alerte/Alerteform";
import { alertesApi } from "@/services/alertes.api";

export default function AlerteEdit() {
  const { id } = useParams<{id:string}>();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: raw, isLoading } = useQuery({
    queryKey: ["alerte", id],
    queryFn:  () => alertesApi.getById(Number(id)),
    enabled:  !!id,
  });

  const item = Array.isArray(raw) ? raw[0] : (raw as any)?.response ?? raw;

  const mutation = useMutation({
    mutationFn: (data: AlerteFormData) => alertesApi.update(Number(id), data),
    onSuccess: () => { qc.invalidateQueries({queryKey:["alertes"]}); navigate("/alertes"); },
  });

  if (isLoading) return <AppLayout><div className="empty-state"><p>Chargement…</p></div></AppLayout>;

  const initialData = item ? {
    ...item,
    id: item.id,
    customerIds: item.customers?.map((c:any)=>c.id) ?? [],
  } : undefined;

  return (
    <AppLayout>
      <AlerteForm
        initialData={initialData}
        onSubmit={async data => mutation.mutate(data)}
        loading={mutation.isPending}
        error={mutation.isError ? "Une erreur est survenue." : undefined}
      />
    </AppLayout>
  );
}