import { apiFetch } from "~/lib/api";

export interface AllowedIpsResponse {
  allowed_ips: string[];
}

export async function getAllowedIps(): Promise<AllowedIpsResponse> {
  const res = await apiFetch("/api/allowed-ips");
  if (!res.ok) throw res;
  return res.json() as Promise<AllowedIpsResponse>;
}
