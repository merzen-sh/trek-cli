import { queryOptions } from "@tanstack/react-query";
import { getAllowedIpsKeys } from "./keys";
import { getAllowedIps } from "./api";

export const getAllowedIpsQuery = queryOptions({
  queryKey: getAllowedIpsKeys.all,
  queryFn: getAllowedIps,
  staleTime: 1000 * 30,
  retry: false,
});
