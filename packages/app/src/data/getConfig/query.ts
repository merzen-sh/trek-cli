import { queryOptions } from "@tanstack/react-query";
import { getConfigKeys } from "./keys";
import { getConfig } from "./api";

export function getConfigQuery(scriptName: string) {
  return queryOptions({
    queryKey: getConfigKeys.byScript(scriptName),
    queryFn: () => getConfig(scriptName),
    staleTime: Infinity,
    retry: false,
  });
}
