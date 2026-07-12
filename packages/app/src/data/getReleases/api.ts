import { client } from "~/lib/api";

export interface Release {
  tag_name: string;
  name: string;
  body: string;
  html_url: string;
}

export async function getRelease(signal?: AbortSignal): Promise<Release | null> {
  const { data, response } = await client.GET("/api/releases", { signal });
  if (!response.ok) throw new Error("Failed to fetch release");
  return data as Release | null;
}
