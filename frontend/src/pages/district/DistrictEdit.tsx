import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { districtsApi } from "@/services/districts.api";
import { DistrictForm } from "@/components/district/DistrictForm";
import type { districtFormData } from "@/components/district/DistrictForm";
import { Loader2 } from "lucide-react";

export default function RegionEdit() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc       = useQueryClient();
  const [error, setError] = useState("");

  const { data: raw, isLoading } = useQuery({
    queryKey: ["districts", Number(id)],
    queryFn:  () => districtsApi.getById(Number(id)),
    enabled:  !!id,
  });

  const district = (raw as any)?.response ?? raw;

  const updateMut = useMutation({
    mutationFn: (data: districtFormData) => districtsApi.update(Number(id), data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["districts"] });
      navigate("/districts");
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
      <DistrictForm
        initialData={{
          id:         Number(id),
          name:       district?.name       ?? "",
          regionId: district?.re?.id ?? district?.regionId ?? 0,
        }}
        onSubmit={async (data) => { setError(""); await updateMut.mutateAsync(data); }}
        loading={updateMut.isPending}
        error={error}
      />
    </AppLayout>
  );
}