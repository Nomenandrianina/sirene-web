import { useQuery } from "@tanstack/react-query";
import { rolesApi } from "@/services";
import type { Role } from "@/types/role";

export function useRoles() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["roles"],
    queryFn: () => rolesApi.getAll(),
    staleTime: 5 * 60 * 1000, // 5 min — les rôles changent rarement
  });

  const roles: Role[] = Array.isArray(data)
    ? data
    : (data as any)?.data ?? (data as any)?.response ?? [];

  return { roles, loading: isLoading, error };
}