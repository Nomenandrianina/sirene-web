import { useMutation, useQueryClient }           from "@tanstack/react-query";
import { useNavigate }                           from "react-router-dom";
import { AppLayout }                             from "@/components/AppLayout";
import { AlerteBngrcForm, AlerteBngrcFormData }  from "@/components/alertebngrc/Alertebngrcform";
import { alerteBngrcApi }                        from "@/services/alertebngrc.api";
 
export function AlerteBngrcCreate() {
  const navigate = useNavigate();
  const qc       = useQueryClient();
 
  const mutation = useMutation({
    mutationFn: (data: AlerteBngrcFormData) => alerteBngrcApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alerte-bngrc"] });
      navigate("/alerte-bngrc");
    },
  });
 
  return (
    <AppLayout>
      <AlerteBngrcForm
        onSubmit={async data => { mutation.mutate(data); }}
        loading={mutation.isPending}
        error={mutation.isError ? (mutation.error as any)?.message || "Une erreur est survenue." : undefined}
      />
    </AppLayout>
  );
  
}