import { queryOptions } from "@tanstack/react-query";
import { getThemeKeys } from "./keys";
import { client } from "../../lib/api";

export function getThemeQuery(scriptName: string) {
  return queryOptions({
    queryKey: getThemeKeys.byScript(scriptName),
    queryFn: async () => {
      const { data, response } = await client.GET("/api/scripts/{name}/theme", {
        params: { path: { name: scriptName } },
      });
      if (!response.ok) {
        if (response.status === 404) return null;
        throw response;
      }
      return data as Record<string, unknown> | null;
    },
    staleTime: Infinity,
    retry: false,
  });
}
