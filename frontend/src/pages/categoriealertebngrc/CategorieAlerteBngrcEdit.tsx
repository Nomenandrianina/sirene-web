import { AppLayout } from "@/components/AppLayout";
import { CategorieAlerteBngrcForm, CategorieAlerteBngrcFormData } from "@/components/categoriealertebngrc/Categoriealertebngrcform";
import { categorieAlerteBngrcApi } from "@/services/categorieAlerteBngrc.api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";

export function CategorieAlerteBngrcEdit() {
    const { id }   = useParams<{ id: string }>();
    const qc       = useQueryClient();
    const navigate = useNavigate();
   
    const { data: raw, isLoading } = useQuery({
      queryKey: ["categorie-alerte-bngrc", id],
      queryFn:  () => categorieAlerteBngrcApi.getById(Number(id)),
      enabled:  !!id,
    });
    const item = Array.isArray(raw) ? raw[0] : (raw as any)?.response ?? raw;
   
    const mutation = useMutation({
      mutationFn: (data: CategorieAlerteBngrcFormData) =>
        categorieAlerteBngrcApi.update(Number(id), {
          ...data,
          alerteBngrcId:     Number(data.alerteBngrcId)     || undefined,
          typeAlerteBngrcId: Number(data.typeAlerteBngrcId),
        }),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["categorie-alerte-bngrc"] });
        navigate("/categorie-alerte-bngrc");
      },
    });
   
    if (isLoading)
      return <AppLayout><div className="empty-state"><p>Chargement…</p></div></AppLayout>;
   
    return (
      <AppLayout>
        <CategorieAlerteBngrcForm
          initialData={item ? { ...item, id: item.id } : undefined}
          onSubmit={async data => { mutation.mutate(data); }}
          loading={mutation.isPending}
          error={mutation.isError ? (mutation.error as any)?.message || "Une erreur est survenue." : undefined}
        />
      </AppLayout>
    );
  }
   