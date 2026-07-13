import { client } from "~/lib/api";

const schemaRefs: Record<string, string> = {
  server: "../schema/config_server_schema.json",
  client: "../schema/config_client_schema.json",
};

export async function saveConfig(
  scriptName: string,
  data: unknown,
  configType: string = "server",
): Promise<unknown> {
  const body = {
    $schema: schemaRefs[configType] ?? schemaRefs.server,
    ...(data as Record<string, unknown>),
  };
  const { data: result, response } = await client.POST("/api/scripts/{name}/config", {
    params: { path: { name: scriptName }, query: { type: configType } },
    body,
  });
  if (!response.ok) throw response;
  return result;
}
