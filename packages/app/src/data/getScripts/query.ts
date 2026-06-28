import { queryOptions } from "@tanstack/react-query";
import { getScriptsKeys } from "./keys";
import { apiFetch } from "../../lib/api";

export const getScriptsQuery = queryOptions({
  queryKey: getScriptsKeys.all,
  queryFn: async () => {
    const res = await apiFetch("/external/api/scripts", { credentials: "include" });
    if (!res.ok) throw res;
    const json: import("@trek/api-types").Script[] = await res.json();
    return json;
  },
  staleTime: 1000 * 60 * 2,
  retry: false,
});
