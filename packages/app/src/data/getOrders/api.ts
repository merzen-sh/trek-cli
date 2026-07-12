import { apiFetch } from "~/lib/api";
import type { Order } from "@trek/api-types";

export async function getOrders(): Promise<Order[]> {
  const res = await apiFetch("/external/api/orders", { credentials: "include" });
  if (!res.ok) throw res;
  const json: { status: "success"; data: Order[] } = await res.json();
  return json.data;
}
