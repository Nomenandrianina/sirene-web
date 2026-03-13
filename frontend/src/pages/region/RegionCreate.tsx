import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { regionsApi } from "@/services/region.api";
import { RegionForm } from "@/components/region/RegionForm";
import type { RegionFormData } from "@/components/region/RegionForm";

export default function RegionCreate() {
  const navigate = useNavigate();
  const qc       = useQueryClient();
  const [error, setError] = useState("");

  const createMut = useMutation({
    mutationFn: (data: RegionFormData) => regionsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["regions"] });
      navigate("/regions");
    },
    onError: (err: any) => setError(err.message || "Erreur lors de la création"),
  });

  return (
    <AppLayout>
      <RegionForm
        onSubmit={async (data) => { setError(""); await createMut.mutateAsync(data); }}
        loading={createMut.isPending}
        error={error}
      />
    </AppLayout>
  );
}