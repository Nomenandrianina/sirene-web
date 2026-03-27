import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { CommuneForm } from "@/components/commune/CommuneForm";
import { communesApi } from "@/services/commune.api";
import type { Commune } from "@/types/commune";

export default function CommuneEdit() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc       = useQueryClient();
  const [error, setError] = useState("");

  const { data: raw, isLoading } = useQuery({
    queryKey: ["communes", Number(id)],
    queryFn:  () => communesApi.getById(Number(id)),
    enabled:  !!id,
  });

  // Normalisation de la réponse (response wrapper éventuel)
  const commune: Commune | undefined = (raw as any)?.response ?? raw;

  const updateMut = useMutation({
    mutationFn: (data: { name: string; districtId: number }) =>
      communesApi.update(Number(id), data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["communes"] });
      navigate("/communes");
    },
    onError: (err: any) =>
      setError(err?.response?.data?.message || err.message || "Erreur lors de la modification"),
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center mt-16 gap-3 text-slate-500">
          <Loader2 size={28} className="animate-spin" />
          <p className="text-sm">Chargement…</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <CommuneForm
        initialData={{
          id:         Number(id),
          name:       commune?.name       ?? "",
          // Remontée de la cascade depuis les relations eager
          districtId: commune?.district?.id ?? commune?.districtId ?? 0,
          regionId:   (commune?.district as any)?.region?.id       ?? 0,
          provinceId: (commune?.district as any)?.region?.province?.id ?? 0,
        }}
        onSubmit={async (data) => { setError(""); await updateMut.mutateAsync(data); }}
        loading={updateMut.isPending}
        error={error}
      />
    </AppLayout>
  );
}