import { queryOptions } from "@tanstack/react-query";
import { getThemeKeys } from "./keys";
import { apiFetch } from "../../lib/api";

export function getThemeQuery(scriptName: string) {
  return queryOptions({
    queryKey: getThemeKeys.byScript(scriptName),
    queryFn: async () => {
      const res = await apiFetch(`/external/api/scripts/${encodeURIComponent(scriptName)}/theme`);
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
