import { queryOptions } from "@tanstack/react-query";
import { releasesKeys } from "./keys";

export interface Release {
  tag_name: string;
  name: string;
  body: string;
  html_url: string;
}

export function releaseByTagQuery(version: string) {
  return queryOptions({
    queryKey: releasesKeys.byTag(version),
    queryFn: async ({ signal }) => {
      const res = await fetch(
        `https://api.github.com/repos/merzen-sh/trek-cli/releases/tags/v${version}`,
        { headers: { "User-Agent": "trek-cli" }, signal },
      );
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch release");
      return res.json() as Promise<Release>;
    },
    staleTime: 1000 * 60 * 60,
    retry: false,
  });
}
