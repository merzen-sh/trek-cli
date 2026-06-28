import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";

export function useSaveTheme(scriptName: string) {
  return useMutation({
    mutationFn: async (data: unknown) => {
      const res = await apiFetch(`/external/api/scripts/${encodeURIComponent(scriptName)}/theme`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw res;
      return res.json();
    },
  });
}
