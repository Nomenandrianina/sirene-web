import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { AlerteTypeForm, AlerteTypeFormData } from "@/components/alerteType/AlertetypeForm";
import { alerteTypesApi } from "@/services/alertetypes.api";
export default function AlerteTypeEdit() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc       = useQueryClient();
 
  const { data: raw, isLoading } = useQuery({
    queryKey: ["alerte-type", id],
    queryFn:  () => alerteTypesApi.getById(Number(id)),
    enabled:  !!id,
  });
 
  const item = Array.isArray(raw) ? raw[0] : (raw as any)?.response ?? raw;
 
  const mutation = useMutation({
    mutationFn: (data: AlerteTypeFormData) => alerteTypesApi.update(Number(id), data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["alerte-types"] }); navigate("/alerte-types"); },
  });
 
  if (isLoading) return <AppLayout><div className="empty-state"><p>Chargement…</p></div></AppLayout>;
 
  const initialData = item ? {
    ...item,
    alerteId:    item.alerteId ?? item.alerte?.id ?? 0,
    customerIds: item.customers?.map((c: any) => c.id) ?? [],
  } : undefined;
 
  return (
    <AppLayout>
      <AlerteTypeForm
        initialData={initialData}
        onSubmit={async data => mutation.mutate(data)}
        loading={mutation.isPending}
        error={mutation.isError ? (mutation.error as any)?.message || "Erreur lors de la modification" : undefined}
      />
    </AppLayout>
  );
}
 