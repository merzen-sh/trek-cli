export type AuthStatus = "authenticated" | "wrong-pin" | "no-session";

export async function checkAuth(pin: string): Promise<AuthStatus> {
  if (pin === "") return "wrong-pin";

  const res = await fetch("/api/auth", {
    headers: { "X-Auth-Pin": pin },
  });
  if (res.status === 401) return "wrong-pin";
  if (res.status === 403) return "no-session";
  if (res.ok) return "authenticated";
  throw res;
}
