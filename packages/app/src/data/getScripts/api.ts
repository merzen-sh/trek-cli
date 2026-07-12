import { client } from "~/lib/api";
import type { Script } from "@trek/api-types";

export async function getScripts(): Promise<Script[]> {
  const { data, response } = await client.GET("/api/scripts");
  if (!response.ok) throw response;
  return data as Script[];
}
