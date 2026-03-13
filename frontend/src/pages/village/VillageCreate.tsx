import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { villagesApi } from "@/services/village.api";
import { VillageForm } from "@/components/village/VillageForm";
import type { VillageFormData } from "@/components/village/VillageForm";

export default function VillageCreate() {
  const navigate = useNavigate();
  const qc       = useQueryClient();
  const [error, setError] = useState("");

  const createMut = useMutation({
    mutationFn: (data: VillageFormData) => villagesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["villages"] });
      navigate("/villages");
    },
    onError: (err: any) => setError(err.message || "Erreur lors de la création"),
  });

  return (
    <AppLayout>
      <VillageForm
        onSubmit={async (data) => { setError(""); await createMut.mutateAsync(data); }}
        loading={createMut.isPending}
        error={error}
      />
    </AppLayout>
  );
}