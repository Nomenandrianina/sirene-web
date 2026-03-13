import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { CategorieAlerteForm, CategorieAlerteFormData } from "@/components/categorieAlerte/CategorieAlerteForm";
import { categorieAlertesApi } from "@/services/categoriealertes.api";

export default function CategorieAlerteCreate() {
  const navigate=useNavigate(); const qc=useQueryClient();
  const mutation=useMutation({mutationFn:(data:CategorieAlerteFormData)=>categorieAlertesApi.create(data),onSuccess:()=>{qc.invalidateQueries({queryKey:["categorie-alertes"]});navigate("/categorie-alertes");}});
  return <AppLayout>
        <CategorieAlerteForm onSubmit={async data=>mutation.mutate(data)} loading={mutation.isPending} error={mutation.isError?"Une erreur est survenue.":undefined}/>
    </AppLayout>;
}