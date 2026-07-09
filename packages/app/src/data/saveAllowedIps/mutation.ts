import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { getAllowedIpsKeys } from "../getAllowedIps";
import type { AllowedIpsResponse } from "../getAllowedIps";

export function useAddAllowedIp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ip: string) => {
      const res = await apiFetch("/api/allowed-ips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip }),
      });
      if (!res.ok) throw res;
      return (await res.json()) as AllowedIpsResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getAllowedIpsKeys.all });
    },
  });
}

export function useDeleteAllowedIp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ip: string) => {
      const res = await apiFetch("/api/allowed-ips", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip }),
      });
      if (!res.ok) throw res;
      return (await res.json()) as AllowedIpsResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getAllowedIpsKeys.all });
    },
  });
}
