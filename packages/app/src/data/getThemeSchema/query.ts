import { queryOptions } from "@tanstack/react-query";
import { getThemeSchemaKeys } from "./keys";
import { getThemeSchema } from "./api";

export function getThemeSchemaQuery(scriptName: string) {
  return queryOptions({
    queryKey: getThemeSchemaKeys.byScript(scriptName),
    queryFn: () => getThemeSchema(scriptName),
    staleTime: Infinity,
    retry: false,
  });
}
