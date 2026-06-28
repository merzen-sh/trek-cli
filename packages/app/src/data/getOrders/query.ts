import { queryOptions } from "@tanstack/react-query";
import { getOrdersKeys } from "./keys";
import { apiFetch } from "../../lib/api";

export const getOrdersQuery = queryOptions({
  queryKey: getOrdersKeys.all,
  queryFn: async () => {
    const res = await apiFetch("/external/api/orders", { credentials: "include" });
    if (!res.ok) throw res;
    const json: { orders: import("@trek/api-types").Order[] } = await res.json();
    return json.orders;
  },
  staleTime: 1000 * 60 * 2,
  retry: false,
});
