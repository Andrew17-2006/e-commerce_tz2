import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ordersApi } from "@/api/orders.api";
import type { OrderStatus } from "@/types/api";

export function useMyOrders() {
  return useQuery({ queryKey: ["orders", "mine"], queryFn: ordersApi.mine });
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: ["orders", id],
    queryFn: () => ordersApi.get(id!),
    enabled: !!id,
  });
}

export function useAdminOrders(params: { status?: OrderStatus; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["orders", "admin", params],
    queryFn: () => ordersApi.adminAll(params),
  });
}

export function useCheckout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ordersApi.checkout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      ordersApi.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });
}
