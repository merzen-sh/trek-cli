import { queryOptions } from "@tanstack/react-query";
import { authKeys } from "./keys";
import { checkAuth } from "./api";

export function authQuery(pin: string) {
  return queryOptions({
    queryKey: authKeys.status(pin),
    queryFn: () => checkAuth(pin),
    retry: false,
    gcTime: 0,
  });
}
