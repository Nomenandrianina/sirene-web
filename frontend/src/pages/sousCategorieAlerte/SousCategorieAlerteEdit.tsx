import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";

import { SousCategorieAlerteForm, SousCategorieAlerteFormData } from "@/components/sousCategorieAlerte/SousCategorieAlerteForm";
import { sousCategorieAlertesApi } from "@/services/souscategorieAlerte.api";

export default function SousCategorieAlerteEdit() {
    const {id}=useParams<{id:string}>();
    const qc=useQueryClient();
    const navigate=useNavigate();
    const {data:raw,isLoading}=useQuery({queryKey:["sous-categorie-alerte",id],queryFn:()=>sousCategorieAlertesApi.getById(Number(id)),enabled:!!id});
    const item=Array.isArray(raw)?raw[0]:(raw as any)?.response??raw;

  const mutation=useMutation({mutationFn:(data:SousCategorieAlerteFormData)=>sousCategorieAlertesApi.update(Number(id),data),onSuccess:()=>{qc.invalidateQueries({queryKey:["sous-categorie-alertes"]});
  navigate("/sous-categorie-alertes");
}});

  if(isLoading){ 
    return (
        <AppLayout><div className="empty-state"><p>Chargement…</p></div></AppLayout>);
    }
  return (
    <AppLayout>
        <SousCategorieAlerteForm 
            initialData={item?{...item,id:item.id}:undefined} 
            onSubmit={async data=>mutation.mutate(data)} loading={mutation.isPending} 
            error={mutation.isError?"Une erreur est survenue.":undefined}/>
    </AppLayout>
    );
}