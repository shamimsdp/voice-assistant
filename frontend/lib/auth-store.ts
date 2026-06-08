import { create } from "zustand";

export interface User {
  id: string;
  name: string;
  phone: string;
  role: string;
  clinic_id: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  login: (token, user) => {
    localStorage.setItem("auth_token", token);
    localStorage.setItem("auth_user", JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    set({ token: null, user: null, isAuthenticated: false });
  },
  loadFromStorage: () => {
    const token = localStorage.getItem("auth_token");
    const raw = localStorage.getItem("auth_user");
    if (token && raw) {
      try {
        const user = JSON.parse(raw) as User;
        set({ token, user, isAuthenticated: true });
      } catch {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
      }
    }
  },
}));
