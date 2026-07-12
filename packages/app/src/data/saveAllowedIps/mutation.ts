import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllowedIpsKeys } from "~/data/getAllowedIps";
import { addAllowedIp, deleteAllowedIp } from "./api";

export function useAddAllowedIp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addAllowedIp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getAllowedIpsKeys.all });
    },
  });
}

export function useDeleteAllowedIp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAllowedIp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getAllowedIpsKeys.all });
    },
  });
}
