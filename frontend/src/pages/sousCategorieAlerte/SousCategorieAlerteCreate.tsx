import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { SousCategorieAlerteForm, SousCategorieAlerteFormData } from "@/components/sousCategorieAlerte/SousCategorieAlerteForm";
import { sousCategorieAlertesApi } from "@/services/souscategorieAlerte.api";

export default function SousCategorieAlerteCreate() {
  const navigate=useNavigate(); const qc=useQueryClient();
  const mutation=useMutation({mutationFn:(data:SousCategorieAlerteFormData)=>sousCategorieAlertesApi.create(data),onSuccess:()=>{qc.invalidateQueries({queryKey:["sous-categorie-alertes"]});navigate("/sous-categorie-alertes");}});
  return <AppLayout><SousCategorieAlerteForm onSubmit={async data=>mutation.mutate(data)} loading={mutation.isPending} error={mutation.isError?"Une erreur est survenue.":undefined}/></AppLayout>;
}