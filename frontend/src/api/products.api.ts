import { apiClient } from "./client";
import type { PaginatedProducts, Product, ProductQuery } from "@/types/api";

export interface ProductInput {
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: string;
  imageUrl?: string;
}

export const productsApi = {
  list: (query: ProductQuery) =>
    apiClient.get<PaginatedProducts>("/products", { params: query }).then((r) => r.data),
  get: (id: string) => apiClient.get<Product>(`/products/${id}`).then((r) => r.data),
  create: (data: ProductInput) => apiClient.post<Product>("/products", data).then((r) => r.data),
  update: (id: string, data: Partial<ProductInput>) =>
    apiClient.patch<Product>(`/products/${id}`, data).then((r) => r.data),
  remove: (id: string) => apiClient.delete(`/products/${id}`),
  uploadImage: (id: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return apiClient
      .post<Product>(`/products/${id}/image`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },
};
