import { queryOptions } from "@tanstack/react-query";
import { getConfigKeys } from "./keys";
import { getConfig } from "./api";

export function getConfigQuery(scriptName: string, configType: string = "server") {
  return queryOptions({
    queryKey: getConfigKeys.byScript(scriptName, configType),
    queryFn: () => getConfig(scriptName, configType),
    staleTime: Infinity,
    retry: false,
  });
}
