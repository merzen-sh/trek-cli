import { queryOptions } from "@tanstack/react-query";
import { getConfigSchemaKeys } from "./keys";
import { apiFetch } from "../../lib/api";

export function getConfigQuery(scriptName: string) {
  return queryOptions({
    queryKey: getConfigSchemaKeys.byScript(scriptName),
    queryFn: async () => {
      const res = await apiFetch(`/external/api/scripts/${encodeURIComponent(scriptName)}/config`);
      if (!res.ok) {
        if (res.status === 404) return null;
        throw res;
      }
      const json: Record<string, unknown> = await res.json();
      return json;
    },
    staleTime: Infinity,
    retry: false,
  });
}
