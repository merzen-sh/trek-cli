import { queryOptions } from "@tanstack/react-query";
import { getThemeKeys } from "./keys";
import { getTheme } from "./api";

export function getThemeQuery(scriptName: string) {
  return queryOptions({
    queryKey: getThemeKeys.byScript(scriptName),
    queryFn: () => getTheme(scriptName),
    staleTime: Infinity,
    retry: false,
  });
}
