import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { UtilisateurForm } from "@/components/utilisateur/UtilisateurForm";
import type { UtilisateurFormData } from "@/components/utilisateur/UtilisateurForm";
import { usersApi } from "@/services";
import { Loader2 } from "lucide-react";

export default function UtilisateurEdit() {
  const { id }    = useParams<{ id: string }>();
  const navigate  = useNavigate();
  const qc        = useQueryClient();
  const [error, setError] = useState("");

  // Charger les données de l'utilisateur
  const { data: raw, isLoading } = useQuery({
    queryKey: ["users", id],
    queryFn: () => usersApi.getById(Number(id)),
    enabled: !!id,
  });

  // Extraire l'objet user (même pattern que la liste)
  const userData = Array.isArray(raw)
    ? raw[0]
    : (raw as any)?.data ?? (raw as any)?.response ?? raw;

  const mutation = useMutation({
    mutationFn: (data: UtilisateurFormData) =>
      usersApi.update(Number(id), data as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      navigate("/utilisateurs");
    },
    onError: (err: any) => setError(err.message || "Erreur lors de la modification"),
  });

  const handleSubmit = async (data: UtilisateurFormData) => {
    setError("");
    await mutation.mutateAsync(data);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="empty-state" style={{ minHeight: "60vh" }}>
          <Loader2 size={28} className="spin" />
          <p>Chargement de l'utilisateur…</p>
        </div>
      </AppLayout>
    );
  }

  if (!userData) {
    return (
      <AppLayout>
        <div className="empty-state" style={{ minHeight: "60vh" }}>
          <p>Utilisateur introuvable.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <UtilisateurForm
        initialData={{
          id:           userData.id,
          first_name:   userData.first_name,
          last_name:    userData.last_name,
          email:        userData.email,
          role_id:      userData.role_id ?? userData.role?.id,   // ✅ fallback sur role.id
          customer_id:  userData.customer_id ?? userData.customers_id ?? userData.customer?.id, // ✅ tous les cas
          is_active:    userData.is_active,
        }}
        onSubmit={handleSubmit}
        loading={mutation.isPending}
        error={error}
      />
    </AppLayout>
  );
}
