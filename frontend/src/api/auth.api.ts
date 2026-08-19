import { apiClient } from "./client";
import type { AuthResponse } from "@/types/api";

export const authApi = {
  register: (data: { email: string; password: string; name: string }) =>
    apiClient.post<AuthResponse>("/auth/register", data).then((r) => r.data),
  login: (data: { email: string; password: string }) =>
    apiClient.post<AuthResponse>("/auth/login", data).then((r) => r.data),
  logout: () => apiClient.post("/auth/logout"),
};
