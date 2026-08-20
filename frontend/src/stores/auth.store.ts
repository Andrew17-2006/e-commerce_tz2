import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthResponse, User } from "@/types/api";

interface AuthState {
  accessToken: string | null;
  user: User | null;
  setAuth: (auth: AuthResponse) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      setAuth: (auth) => set({ accessToken: auth.accessToken, user: auth.user }),
      clearAuth: () => set({ accessToken: null, user: null }),
    }),
    { name: "minishop-auth" },
  ),
);
