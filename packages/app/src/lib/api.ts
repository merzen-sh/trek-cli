function getPin(): string {
  return sessionStorage.getItem("trek-pin") ?? "";
}

export function setPin(pin: string) {
  sessionStorage.setItem("trek-pin", pin);
}

export function clearPin() {
  sessionStorage.removeItem("trek-pin");
}

export function hasPin(): boolean {
  return !!getPin();
}

export async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  const pin = getPin();
  const headers = new Headers(init?.headers);
  headers.set("X-Auth-Pin", pin);
  const res = await fetch(url, { ...init, headers });
  // Only treat 401 as "wrong local pin" for local API endpoints.
  // External proxy 401s (e.g. upstream session expired) are a different auth layer
  // and must not clear the pin or cause a redirect loop.
  const isExternal = url.startsWith("/external/");
  if (res.status === 401 && !isExternal) {
    clearPin();
    window.location.href = "/";
  }
  return res;
}
