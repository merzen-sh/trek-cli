import { useMutation } from "@tanstack/react-query";
import { client } from "../../lib/api";

export function useSaveTheme(scriptName: string) {
  return useMutation({
    mutationFn: async (data: unknown) => {
      const body = { $schema: "../schema/theme_schema.json", ...(data as Record<string, unknown>) };
      const { data: result, response } = await client.POST("/api/scripts/{name}/theme", {
        params: { path: { name: scriptName } },
        body,
      });
      if (!response.ok) throw response;
      return result;
    },
  });
}
