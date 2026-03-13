import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { AlerteTypeForm, AlerteTypeFormData } from "@/components/alerteType/AlertetypeForm";
import { alerteTypesApi } from "@/services/alertetypes.api";

export default function AlerteTypeEdit() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: raw, isLoading } = useQuery({
    queryKey: ["alerte-type", id],
    queryFn:  () => alerteTypesApi.getById(Number(id)),
    enabled:  !!id,
  });

  const item = Array.isArray(raw) ? raw[0] : (raw as any)?.response ?? raw;

  const mutation = useMutation({
    mutationFn: (data: AlerteTypeFormData) => alerteTypesApi.update(Number(id), data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alerte-types"] });
      navigate("/alerte-types");
    },
  });

  if (isLoading) return <AppLayout><div className="empty-state"><p>Chargement…</p></div></AppLayout>;

  // L'API retourne alerte (objet imbriqué) → extraire alerteId
  const initialData = item ? {
    ...item,
    id:       item.id,
    alerteId: item.alerteId ?? item.alerte?.id ?? 0,
  } : undefined;

  return (
    <AppLayout>
      <AlerteTypeForm
        initialData={initialData}
        onSubmit={async data => mutation.mutate(data)}
        loading={mutation.isPending}
        error={mutation.isError ? "Une erreur est survenue." : undefined}
      />
    </AppLayout>
  );
}