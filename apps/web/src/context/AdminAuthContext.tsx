import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { UserDto } from "@spirit/shared";
import { apiClient, ApiError, setAuthToken } from "../lib/apiClient";

const TOKEN_KEY = "spirit.adminToken";

interface AdminAuthState {
  admin: UserDto | null;
  status: "checking" | "authenticated" | "unauthenticated";
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthState | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<UserDto | null>(null);
  const [status, setStatus] = useState<AdminAuthState["status"]>("checking");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setStatus("unauthenticated");
      return;
    }
    setAuthToken(stored);
    apiClient
      .get<UserDto>("/auth/me")
      .then((user) => {
        if (user.role !== "ADMIN") throw new Error("Not an admin account");
        setAdmin(user);
        setStatus("authenticated");
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setAuthToken(null);
        setStatus("unauthenticated");
      });
  }, []);

  const login = async (username: string, password: string) => {
    setError(null);
    try {
      const result = await apiClient.post<{ token: string; user: UserDto }>("/auth/admin/login", {
        username,
        password,
      });
      localStorage.setItem(TOKEN_KEY, result.token);
      setAuthToken(result.token);
      setAdmin(result.user);
      setStatus("authenticated");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Sign-in failed");
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setAuthToken(null);
    setAdmin(null);
    setStatus("unauthenticated");
  };

  return (
    <AdminAuthContext.Provider value={{ admin, status, error, login, logout }}>{children}</AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
