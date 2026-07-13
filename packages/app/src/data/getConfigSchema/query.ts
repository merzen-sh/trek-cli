import { queryOptions } from "@tanstack/react-query";
import { getConfigSchemaKeys } from "./keys";
import { getConfigSchema } from "./api";

export function getConfigSchemaQuery(scriptName: string, configType: string = "server") {
  return queryOptions({
    queryKey: getConfigSchemaKeys.byScript(scriptName, configType),
    queryFn: () => getConfigSchema(scriptName, configType),
    staleTime: Infinity,
    retry: false,
  });
}
