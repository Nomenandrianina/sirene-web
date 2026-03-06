import { useQuery } from "@tanstack/react-query";
import { customersApi } from "@/services";
import type { Customer } from "@/types/customer";

export function useClients() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["customers"],
    queryFn: () => customersApi.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  const clients: Customer[] = Array.isArray(data)
    ? data
    : (data as any)?.data ?? (data as any)?.response ?? [];

  return { clients, loading: isLoading, error };
}
