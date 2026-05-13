import { AppLayout } from "@/components/AppLayout";
import { CategorieAlerteBngrcForm, CategorieAlerteBngrcFormData } from "@/components/categoriealertebngrc/Categoriealertebngrcform";
import { categorieAlerteBngrcApi } from "@/services/categorieAlerteBngrc.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
   
  export function CategorieAlerteBngrcCreate() {
    const navigate = useNavigate();
    const qc       = useQueryClient();
   
    const mutation = useMutation({
      mutationFn: (data: CategorieAlerteBngrcFormData) =>
        categorieAlerteBngrcApi.create({
          ...data,
          alerteBngrcId:     Number(data.alerteBngrcId)     || undefined,
          typeAlerteBngrcId: Number(data.typeAlerteBngrcId),
        }),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["categorie-alerte-bngrc"] });
        navigate("/categorie-alerte-bngrc");
      },
    });
   
    return (
      <AppLayout>
        <CategorieAlerteBngrcForm
          onSubmit={async data => { mutation.mutate(data); }}
          loading={mutation.isPending}
          error={mutation.isError ? (mutation.error as any)?.message || "Une erreur est survenue." : undefined}
        />
      </AppLayout>
    );
  }
   