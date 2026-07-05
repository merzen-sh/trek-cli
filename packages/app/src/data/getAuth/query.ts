import { queryOptions } from "@tanstack/react-query";
import { authKeys } from "./keys";

export type AuthStatus = "authenticated" | "wrong-pin" | "no-session";

export function authQuery(pin: string) {
  return queryOptions({
    queryKey: authKeys.status(pin),
    queryFn: async () => {
      if (pin == "") return "wrong-pin";

      const res = await fetch("/api/auth", {
        headers: { "X-Auth-Pin": pin },
      });
      if (res.status === 401) return "wrong-pin" as AuthStatus;
      if (res.status === 403) return "no-session" as AuthStatus;
      if (res.ok) return "authenticated" as AuthStatus;
      throw res;
    },
    retry: false,
    gcTime: 0,
  });
}
