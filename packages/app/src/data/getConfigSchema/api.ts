import { client } from "~/lib/api";

export async function getConfigSchema(
  scriptName: string,
  configType: string = "server",
): Promise<Record<string, unknown> | undefined> {
  const { data, response } = await client.GET("/api/scripts/{name}/config-schema", {
    params: { path: { name: scriptName }, query: { type: configType } },
  });
  if (!response.ok) {
    if (response.status === 404) return undefined;
    throw response;
  }
  return data as Record<string, unknown> | undefined;
}
