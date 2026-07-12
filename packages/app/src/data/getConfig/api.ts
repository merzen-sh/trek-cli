import { client } from "~/lib/api";

export async function getConfig(scriptName: string): Promise<Record<string, unknown> | null> {
  const { data, response } = await client.GET("/api/scripts/{name}/config", {
    params: { path: { name: scriptName } },
  });
  if (!response.ok) {
    if (response.status === 404) return null;
    throw response;
  }
  return data as Record<string, unknown> | null;
}
