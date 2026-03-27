import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { CommuneForm } from "@/components/commune/CommuneForm";
import { communesApi } from "@/services/commune.api";

export default function CommuneCreate() {
  const navigate = useNavigate();
  const qc       = useQueryClient();
  const [error, setError] = useState("");

  const createMut = useMutation({
    mutationFn: communesApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["communes"] });
      navigate("/communes");
    },
    onError: (err: any) =>
      setError(err?.response?.data?.message || err.message || "Erreur lors de la création"),
  });

  return (
    <AppLayout>
      <CommuneForm
        onSubmit={async (data) => { setError(""); await createMut.mutateAsync(data); }}
        loading={createMut.isPending}
        error={error}
      />
    </AppLayout>
  );
}