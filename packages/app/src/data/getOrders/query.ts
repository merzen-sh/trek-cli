import { queryOptions } from "@tanstack/react-query";
import { getOrdersKeys } from "./keys";
import { getOrders } from "./api";

export const getOrdersQuery = queryOptions({
  queryKey: getOrdersKeys.all,
  queryFn: getOrders,
  staleTime: 1000 * 60 * 2,
  retry: false,
});
