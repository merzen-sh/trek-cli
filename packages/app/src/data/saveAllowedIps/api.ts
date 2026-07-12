import { apiFetch } from "~/lib/api";
import type { AllowedIpsResponse } from "~/data/getAllowedIps/api";

export async function addAllowedIp(ip: string): Promise<AllowedIpsResponse> {
  const res = await apiFetch("/api/allowed-ips", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ip }),
  });
  if (!res.ok) throw res;
  return res.json() as Promise<AllowedIpsResponse>;
}

export async function deleteAllowedIp(ip: string): Promise<AllowedIpsResponse> {
  const res = await apiFetch("/api/allowed-ips", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ip }),
  });
  if (!res.ok) throw res;
  return res.json() as Promise<AllowedIpsResponse>;
}
