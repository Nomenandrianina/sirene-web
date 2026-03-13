import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { AlerteTypeForm, AlerteTypeFormData } from "@/components/alerteType/AlertetypeForm";
import { alerteTypesApi } from "@/services/alertetypes.api";

export default function AlerteTypeCreate() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: (data: AlerteTypeFormData) => alerteTypesApi.create(data),
    onSuccess: () => { qc.invalidateQueries({queryKey:["alerte-types"]}); navigate("/alerte-types"); },
  });
  return <AppLayout><AlerteTypeForm onSubmit={async data=>mutation.mutate(data)} loading={mutation.isPending} error={mutation.isError?"Une erreur est survenue.":undefined}/></AppLayout>;
}