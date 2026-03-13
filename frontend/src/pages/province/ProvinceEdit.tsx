import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { provincesApi } from "@/services/province.api";
import { ProvinceForm } from "@/components/province/ProvinceForm";
import type { ProvinceFormData } from "@/components/province/ProvinceForm";
import { Loader2 } from "lucide-react";

export default function ProvinceEdit() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc       = useQueryClient();
  const [error, setError] = useState("");

  const { data: provinceRaw, isLoading } = useQuery({
    queryKey: ["provinces", Number(id)],
    queryFn:  () => provincesApi.getById(Number(id)),
    enabled:  !!id,
  });

  // L'API peut renvoyer { response: ... } ou directement l'objet
  const province = (provinceRaw as any)?.response ?? provinceRaw;

  const updateMut = useMutation({
    mutationFn: (data: ProvinceFormData) => provincesApi.update(Number(id), data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["provinces"] });
      navigate("/provinces");
    },
    onError: (err: any) => setError(err.message || "Erreur lors de la modification"),
  });

  const handleSubmit = async (data: ProvinceFormData) => {
    setError("");
    await updateMut.mutateAsync(data);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="empty-state" style={{ marginTop: "4rem" }}>
          <Loader2 size={28} className="spin" />
          <p>Chargement…</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <ProvinceForm
        initialData={{ id: Number(id), name: province?.name ?? "" }}
        onSubmit={handleSubmit}
        loading={updateMut.isPending}
        error={error}
      />
    </AppLayout>
  );
}