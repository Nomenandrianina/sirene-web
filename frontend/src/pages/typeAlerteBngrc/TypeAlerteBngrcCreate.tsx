import { AppLayout } from "@/components/AppLayout";
import { TypeAlerteBngrcForm, TypeAlerteBngrcFormData } from "@/components/Typealertebngrc/Typealertebngrcform";
import { typeAlerteBngrcApi } from "@/services/typeAlerteBngrc.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
 
export function TypeAlerteBngrcCreate() {
  const navigate = useNavigate();
  const qc       = useQueryClient();
 
  const mutation = useMutation({
    mutationFn: (data: TypeAlerteBngrcFormData) =>
      typeAlerteBngrcApi.create({ ...data, alerteBngrcId: Number(data.alerteBngrcId) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["type-alerte-bngrc"] });
      navigate("/typealertebngrc");
    },
  });
 
  return (
    <AppLayout>
      <TypeAlerteBngrcForm
        onSubmit={async data => { mutation.mutate(data); }}
        loading={mutation.isPending}
        error={mutation.isError ? (mutation.error as any)?.message || "Une erreur est survenue." : undefined}
      />
    </AppLayout>
  );
}