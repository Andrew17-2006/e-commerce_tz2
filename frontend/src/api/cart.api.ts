import { apiClient } from "./client";
import type { CartItem } from "@/types/api";

export const cartApi = {
  get: () => apiClient.get<CartItem[]>("/cart").then((r) => r.data),
  addItem: (productId: string, qty: number) =>
    apiClient.post<CartItem>("/cart/items", { productId, qty }).then((r) => r.data),
  updateItem: (productId: string, qty: number) =>
    apiClient.patch<CartItem>(`/cart/items/${productId}`, { qty }).then((r) => r.data),
  removeItem: (productId: string) => apiClient.delete(`/cart/items/${productId}`),
};
