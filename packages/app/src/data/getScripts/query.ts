import { queryOptions } from "@tanstack/react-query";
import { getScriptsKeys } from "./keys";
import { client } from "../../lib/api";

export const getScriptsQuery = queryOptions({
  queryKey: getScriptsKeys.all,
  queryFn: async () => {
    const { data, response } = await client.GET("/api/scripts");
    if (!response.ok) throw response;
    return data as import("@trek/api-types").Script[];
  },
  staleTime: 1000 * 60 * 2,
  retry: false,
});
