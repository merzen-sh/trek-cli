import { queryOptions } from "@tanstack/react-query";
import { getConfigSchemaKeys } from "./keys";
import { getConfigSchema } from "./api";

export function getConfigSchemaQuery(scriptName: string) {
  return queryOptions({
    queryKey: getConfigSchemaKeys.byScript(scriptName),
    queryFn: () => getConfigSchema(scriptName),
    staleTime: Infinity,
    retry: false,
  });
}
