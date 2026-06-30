import { useMutation } from "@tanstack/react-query";
import { client } from "../../lib/api";

export function useSaveConfig(scriptName: string) {
  return useMutation({
    mutationFn: async (data: unknown) => {
      const { data: result, response } = await client.POST("/api/scripts/{name}/config", {
        params: { path: { name: scriptName } },
        body: data,
      });
      if (!response.ok) throw response;
      return result;
    },
  });
}
