import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { CategorieAlerteForm, CategorieAlerteFormData } from "@/components/categorieAlerte/CategorieAlerteForm";
import { categorieAlertesApi } from "@/services/categoriealertes.api";

export default function CategorieAlerteEdit() {
  const {id}=useParams<{id:string}>();
   const qc=useQueryClient();
   const navigate=useNavigate();

  const {data:raw,isLoading}=useQuery({queryKey:["categorie-alerte",id],queryFn:()=>categorieAlertesApi.getById(Number(id)),enabled:!!id});

  const item=Array.isArray(raw)?raw[0]:(raw as any)?.response??raw;

  const mutation=useMutation({mutationFn:(data:CategorieAlerteFormData)=>categorieAlertesApi.update(Number(id),data),onSuccess:()=>{qc.invalidateQueries({queryKey:["categorie-alertes"]});navigate("/categorie-alertes");}});
  if(isLoading) return <AppLayout>
    <div className="empty-state"><p>Chargement…</p></div>
    </AppLayout>;
    const initialData=item?{...item,id:item.id,alerteId:item.alerteType?.alerteId??item.alerteId,alerteTypeId:item.alerteTypeId}:undefined;
    return <AppLayout> <CategorieAlerteForm initialData={initialData} onSubmit={async data=>mutation.mutate(data)} loading={mutation.isPending} error={mutation.isError?"Une erreur est survenue.":undefined}/></AppLayout>;
}