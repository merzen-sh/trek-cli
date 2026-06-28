import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";

export function useSaveConfig(scriptName: string) {
  return useMutation({
    mutationFn: async (data: unknown) => {
      const res = await apiFetch(`/external/api/scripts/${encodeURIComponent(scriptName)}/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw res;
      return res.json();
    },
  });
}
