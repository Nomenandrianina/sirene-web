import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { villagesApi } from "@/services/village.api";
import { VillageForm } from "@/components/village/VillageForm";
import type { VillageFormData } from "@/components/village/VillageForm";
import { Loader2 } from "lucide-react";

export default function VillageEdit() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc       = useQueryClient();
  const [error, setError] = useState("");

  const { data: raw, isLoading } = useQuery({
    queryKey: ["villages", Number(id)],
    queryFn:  () => villagesApi.getById(Number(id)),
    enabled:  !!id,
  });

  const village = (raw as any)?.response ?? raw;

  const updateMut = useMutation({
    mutationFn: (data: VillageFormData) => villagesApi.update(Number(id), data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["villages"] });
      navigate("/villages");
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
      <VillageForm
        initialData={{
          id:         Number(id),
          name:       village?.name       ?? "",
          latitude:   village?.latitude   ?? "",
          longitude:  village?.longitude  ?? "",
          provinceId: village?.province?.id ?? village?.provinceId ?? 0,
          regionId:   village?.region?.id   ?? village?.regionId   ?? 0,
          districtId: village?.district?.id ?? village?.districtId ?? 0,
        }}
        onSubmit={async (data) => { setError(""); await updateMut.mutateAsync(data); }}
        loading={updateMut.isPending}
        error={error}
      />
    </AppLayout>
  );
}