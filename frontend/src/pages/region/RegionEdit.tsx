import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { regionsApi } from "@/services/region.api";
import { RegionForm } from "@/components/region/RegionForm";
import type { RegionFormData } from "@/components/region/RegionForm";
import { Loader2 } from "lucide-react";

export default function RegionEdit() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc       = useQueryClient();
  const [error, setError] = useState("");

  const { data: raw, isLoading } = useQuery({
    queryKey: ["regions", Number(id)],
    queryFn:  () => regionsApi.getById(Number(id)),
    enabled:  !!id,
  });

  const region = (raw as any)?.response ?? raw;

  const updateMut = useMutation({
    mutationFn: (data: RegionFormData) => regionsApi.update(Number(id), data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["regions"] });
      navigate("/regions");
    },
    onError: (err: any) => setError(err.message || "Erreur lors de la modification"),
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="empty-state" style={{ marginTop: "4rem" }}>
          <Loader2 size={28} className="spin" /><p>Chargement…</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <RegionForm
        initialData={{
          id:         Number(id),
          name:       region?.name       ?? "",
          provinceId: region?.province?.id ?? region?.provinceId ?? 0,
        }}
        onSubmit={async (data) => { setError(""); await updateMut.mutateAsync(data); }}
        loading={updateMut.isPending}
        error={error}
      />
    </AppLayout>
  );
}