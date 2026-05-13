import { useMutation, useQuery, useQueryClient }           from "@tanstack/react-query";
import { useNavigate, useParams }                           from "react-router-dom";
import { AppLayout }                             from "@/components/AppLayout";
import { AlerteBngrcForm, AlerteBngrcFormData }  from "@/components/alertebngrc/Alertebngrcform";
import { alerteBngrcApi }                        from "@/services/alertebngrc.api";


export function AlerteBngrcEdit() {
  const { id }   = useParams<{ id: string }>();
  const qc       = useQueryClient();
  const navigate = useNavigate();
 
  const { data: raw, isLoading } = useQuery({
    queryKey: ["alerte-bngrc", id],
    queryFn:  () => alerteBngrcApi.getById(Number(id)),
    enabled:  !!id,
  });
  const item = Array.isArray(raw) ? raw[0] : (raw as any)?.response ?? raw;
 
  const mutation = useMutation({
    mutationFn: (data: AlerteBngrcFormData) => alerteBngrcApi.update(Number(id), data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alerte-bngrc"] });
      navigate("/alerte-bngrc");
    },
  });
 
  if (isLoading)
    return <AppLayout><div className="empty-state"><p>Chargement…</p></div></AppLayout>;
 
  return (
    <AppLayout>
      <AlerteBngrcForm
        initialData={item ? { ...item, id: item.id } : undefined}
        onSubmit={async data => { mutation.mutate(data); }}
        loading={mutation.isPending}
        error={mutation.isError ? (mutation.error as any)?.message || "Une erreur est survenue." : undefined}
      />
    </AppLayout>
  );
}
 
// ─── AlerteBngrcDeleteDialog ──────────────────────────────────────────────────
