import { queryOptions } from "@tanstack/react-query";
import { getConfigSchemaKeys } from "./keys";
import { client } from "../../lib/api";

export function getConfigSchemaQuery(scriptName: string) {
  return queryOptions({
    queryKey: getConfigSchemaKeys.byScript(scriptName),
    queryFn: async () => {
      const { data, response } = await client.GET("/api/scripts/{name}/config-schema", {
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
