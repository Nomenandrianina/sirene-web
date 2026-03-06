import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { UtilisateurForm } from "@/components/utilisateur/UtilisateurForm";
import type { UtilisateurFormData } from "@/components/utilisateur/UtilisateurForm";
import { usersApi } from "@/services";

export default function UtilisateurCreate() {
  const navigate    = useNavigate();
  const qc          = useQueryClient();
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: (data: UtilisateurFormData) => usersApi.create(data as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      navigate("/utilisateurs");
    },
    onError: (err: any) => setError(err.message || "Erreur lors de la création"),
  });

  const handleSubmit = async (data: UtilisateurFormData) => {
    setError("");
    await mutation.mutateAsync(data);
  };

  return (
    <AppLayout>
      <UtilisateurForm
        onSubmit={handleSubmit}
        loading={mutation.isPending}
        error={error}
      />
    </AppLayout>
  );
}
