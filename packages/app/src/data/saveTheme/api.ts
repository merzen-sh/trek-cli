import { client } from "~/lib/api";

export async function saveTheme(scriptName: string, data: unknown): Promise<unknown> {
  const body = {
    $schema: "../schema/theme_schema.json",
    ...(data as Record<string, unknown>),
  };
  const { data: result, response } = await client.POST("/api/scripts/{name}/theme", {
    params: { path: { name: scriptName } },
    body,
  });
  if (!response.ok) throw response;
  return result;
}
