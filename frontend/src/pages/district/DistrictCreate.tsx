import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { districtsApi } from "@/services/districts.api";
import { DistrictForm } from "@/components/district/DistrictForm";
import type { districtFormData } from "@/components/district/DistrictForm";

export default function DistrictCreate() {
  const navigate = useNavigate();
  const qc       = useQueryClient();
  const [error, setError] = useState("");

  const createMut = useMutation({
    mutationFn: (data: districtFormData) => districtsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["districts"] });
      navigate("/districts");
    },
    onError: (err: any) => setError(err.message || "Erreur lors de la création"),
  });

  return (
    <AppLayout>
      <DistrictForm
        onSubmit={async (data) => { setError(""); await createMut.mutateAsync(data); }}
        loading={createMut.isPending}
        error={error}
      />
    </AppLayout>
  );
}