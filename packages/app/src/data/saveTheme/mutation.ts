import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getThemeKeys } from "~/data/getTheme";
import { saveTheme } from "./api";

export function useSaveTheme(scriptName: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: unknown) => saveTheme(scriptName, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getThemeKeys.byScript(scriptName) });
    },
  });
}
