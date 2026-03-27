import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { FokontanyForm } from "@/components/fokontany/Fokontanyform";
import { fokontanyApi } from "@/services/fokontany.api";
import type { Fokontany } from "@/types/fokontany";

export default function FokontanyEdit() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc       = useQueryClient();
  const [error, setError] = useState("");

  const { data: raw, isLoading } = useQuery({
    queryKey: ["fokontany", Number(id)],
    queryFn:  () => fokontanyApi.getById(Number(id)),
    enabled:  !!id,
  });

  const fokontany: Fokontany | undefined = (raw as any)?.response ?? raw;

  const updateMut = useMutation({
    mutationFn: (data: { name: string; communeId: number }) =>
      fokontanyApi.update(Number(id), data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fokontany"] });
      navigate("/fokontany");
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
      <FokontanyForm
        initialData={{
          id:         Number(id),
          name:       fokontany?.name      ?? "",
          // Remontée de la cascade depuis les relations eager
          communeId:  fokontany?.commune?.id   ?? fokontany?.communeId  ?? 0,
          districtId: (fokontany?.commune as any)?.district?.id         ?? 0,
          regionId:   (fokontany?.commune as any)?.district?.region?.id ?? 0,
          provinceId: (fokontany?.commune as any)?.district?.region?.province?.id ?? 0,
        }}
        onSubmit={async (data) => { setError(""); await updateMut.mutateAsync(data); }}
        loading={updateMut.isPending}
        error={error}
      />
    </AppLayout>
  );
}