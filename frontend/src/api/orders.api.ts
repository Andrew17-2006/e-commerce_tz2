import { apiClient } from "./client";
import type { CheckoutPayload, Order, OrderStatus } from "@/types/api";

export const ordersApi = {
  checkout: (data: CheckoutPayload) => apiClient.post<Order>("/orders/checkout", data).then((r) => r.data),
  mine: () => apiClient.get<Order[]>("/orders").then((r) => r.data),
  get: (id: string) => apiClient.get<Order>(`/orders/${id}`).then((r) => r.data),
  adminAll: (params: { status?: OrderStatus; page?: number; limit?: number }) =>
    apiClient
      .get<{ items: Order[]; total: number; page: number; limit: number }>("/orders/admin/all", {
        params,
      })
      .then((r) => r.data),
  updateStatus: (id: string, status: OrderStatus) =>
    apiClient.patch<Order>(`/orders/${id}/status`, { status }).then((r) => r.data),
};
