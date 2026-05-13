import { AppLayout } from "@/components/AppLayout";
import { TypeAlerteBngrcForm, TypeAlerteBngrcFormData } from "@/components/Typealertebngrc/Typealertebngrcform";
import { typeAlerteBngrcApi } from "@/services/typeAlerteBngrc.api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
 
export function TypeAlerteBngrcEdit() {
  const { id }   = useParams<{ id: string }>();
  const qc       = useQueryClient();
  const navigate = useNavigate();
 
  const { data: raw, isLoading } = useQuery({
    queryKey: ["type-alerte-bngrc", id],
    queryFn:  () => typeAlerteBngrcApi.getById(Number(id)),
    enabled:  !!id,
  });
  const item = Array.isArray(raw) ? raw[0] : (raw as any)?.response ?? raw;
 
  const mutation = useMutation({
    mutationFn: (data: TypeAlerteBngrcFormData) =>
      typeAlerteBngrcApi.update(Number(id), { ...data, alerteBngrcId: Number(data.alerteBngrcId) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["type-alerte-bngrc"] });
      navigate("/typealertebngrc");
    },
  });
 
  if (isLoading)
    return <AppLayout><div className="empty-state"><p>Chargement…</p></div></AppLayout>;
 
  return (
    <AppLayout>
      <TypeAlerteBngrcForm
        initialData={item ? { ...item, id: item.id } : undefined}
        onSubmit={async data => { mutation.mutate(data); }}
        loading={mutation.isPending}
        error={mutation.isError ? (mutation.error as any)?.message || "Une erreur est survenue." : undefined}
      />
    </AppLayout>
  );
}
