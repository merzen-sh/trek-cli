import { queryOptions } from "@tanstack/react-query";
import { releasesKeys } from "./keys";
import { getRelease } from "./api";

export function releaseQuery() {
  return queryOptions({
    queryKey: releasesKeys.all,
    queryFn: ({ signal }) => getRelease(signal),
    staleTime: Infinity,
    retry: false,
  });
}
