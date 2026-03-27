import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { FokontanyForm } from "@/components/fokontany/Fokontanyform";
import { fokontanyApi } from "@/services/fokontany.api";

export default function FokontanyCreate() {
  const navigate = useNavigate();
  const qc       = useQueryClient();
  const [error, setError] = useState("");

  const createMut = useMutation({
    mutationFn: fokontanyApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fokontany"] });
      navigate("/fokontany");
    },
    onError: (err: any) =>
      setError(err?.response?.data?.message || err.message || "Erreur lors de la création"),
  });

  return (
    <AppLayout>
      <FokontanyForm
        onSubmit={async (data) => { setError(""); await createMut.mutateAsync(data); }}
        loading={createMut.isPending}
        error={error}
      />
    </AppLayout>
  );
}