import { apiClient } from "./client";
import type { Category } from "@/types/api";

export const categoriesApi = {
  list: () => apiClient.get<Category[]>("/categories").then((r) => r.data),
  create: (data: { name: string; slug: string; description?: string }) =>
    apiClient.post<Category>("/categories", data).then((r) => r.data),
  update: (id: string, data: Partial<{ name: string; slug: string; description: string }>) =>
    apiClient.patch<Category>(`/categories/${id}`, data).then((r) => r.data),
  remove: (id: string) => apiClient.delete(`/categories/${id}`),
};
