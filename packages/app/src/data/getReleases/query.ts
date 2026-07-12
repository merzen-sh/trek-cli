import { queryOptions } from "@tanstack/react-query";
import { releasesKeys } from "./keys";

export interface Release {
  tag_name: string;
  name: string;
  body: string;
  html_url: string;
}

export function releaseQuery() {
  return queryOptions({
    queryKey: releasesKeys.all,
    queryFn: async ({ signal }) => {
      const res = await fetch("/api/releases", { signal });
      if (!res.ok) throw new Error("Failed to fetch release");
      return res.json() as Promise<Release | null>;
    },
    staleTime: Infinity,
    retry: false,
  });
}
