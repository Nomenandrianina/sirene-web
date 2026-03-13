import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { provincesApi } from "@/services/province.api";
import { ProvinceForm } from "@/components/province/ProvinceForm";
import type { ProvinceFormData } from "@/components/province/ProvinceForm";

export default function ProvinceCreate() {
  const navigate = useNavigate();
  const qc       = useQueryClient();
  const [error, setError] = useState("");

  const createMut = useMutation({
    mutationFn: (data: ProvinceFormData) => provincesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["provinces"] });
      navigate("/provinces");
    },
    onError: (err: any) => setError(err.message || "Erreur lors de la création"),
  });

  const handleSubmit = async (data: ProvinceFormData) => {
    setError("");
    await createMut.mutateAsync(data);
  };

  return (
    <AppLayout>
      <ProvinceForm
        onSubmit={handleSubmit}
        loading={createMut.isPending}
        error={error}
      />
    </AppLayout>
  );
}