import createClient from "openapi-fetch";
import type { paths } from "@trek/api-types";

export function getPin(): string {
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

const authMiddleware = {
  onRequest({ request }: { request: Request }) {
    const pin = getPin();
    if (pin) {
      request.headers.set("X-Auth-Pin", pin);
    }
    return request;
  },
  onResponse({ response }: { response: Response }) {
    if (response.status === 401) {
      clearPin();
      window.location.href = "/";
    }
    return response;
  },
};

export const client = createClient<paths>({
  credentials: "include",
});
client.use(authMiddleware);

export async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  const pin = getPin();
  const headers = new Headers(init?.headers);
  headers.set("X-Auth-Pin", pin);
  return fetch(url, { ...init, headers });
}
