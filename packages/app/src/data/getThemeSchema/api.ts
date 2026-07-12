import { client } from "~/lib/api";

export async function getThemeSchema(
  scriptName: string,
): Promise<Record<string, unknown> | undefined> {
  const { data, response } = await client.GET("/api/scripts/{name}/theme-schema", {
    params: { path: { name: scriptName } },
  });
  if (!response.ok) {
    if (response.status === 404) return undefined;
    throw response;
  }
  return data as Record<string, unknown> | undefined;
}
