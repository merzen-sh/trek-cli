import { queryOptions } from "@tanstack/react-query";
import { getScriptsKeys } from "./keys";
import { getScripts } from "./api";

export const getScriptsQuery = queryOptions({
  queryKey: getScriptsKeys.all,
  queryFn: getScripts,
  staleTime: 1000 * 60 * 2,
  retry: false,
});
