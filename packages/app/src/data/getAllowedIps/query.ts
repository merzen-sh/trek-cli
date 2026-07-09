import { queryOptions } from "@tanstack/react-query";
import { getAllowedIpsKeys } from "./keys";
import { apiFetch } from "../../lib/api";

export interface AllowedIpsResponse {
  allowed_ips: string[];
}

export const getAllowedIpsQuery = queryOptions({
  queryKey: getAllowedIpsKeys.all,
  queryFn: async () => {
    const res = await apiFetch("/api/allowed-ips");
    if (!res.ok) throw res;
    return (await res.json()) as AllowedIpsResponse;
  },
  staleTime: 1000 * 30,
  retry: false,
});
