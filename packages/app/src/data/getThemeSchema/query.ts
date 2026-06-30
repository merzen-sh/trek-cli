import { queryOptions } from "@tanstack/react-query";
import { getThemeSchemaKeys } from "./keys";
import { client } from "../../lib/api";

export function getThemeSchemaQuery(scriptName: string) {
  return queryOptions({
    queryKey: getThemeSchemaKeys.byScript(scriptName),
    queryFn: async () => {
      const { data, response } = await client.GET("/api/scripts/{name}/theme-schema", {
        params: { path: { name: scriptName } },
      });
      if (!response.ok) {
        if (response.status === 404) return null;
        throw response;
      }
      return data as Record<string, unknown> | undefined;
    },
    staleTime: Infinity,
    retry: false,
  });
}
