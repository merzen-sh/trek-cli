import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getConfigKeys } from "~/data/getConfig";
import { saveConfig } from "./api";

export function useSaveConfig(scriptName: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: unknown) => saveConfig(scriptName, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getConfigKeys.byScript(scriptName) });
    },
  });
}
