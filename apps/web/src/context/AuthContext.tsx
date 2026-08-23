import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { UserDto } from "@spirit/shared";
import { apiClient, setAuthToken } from "../lib/apiClient";
import { getInitData } from "../lib/telegram";

interface AuthState {
  user: UserDto | null;
  status: "loading" | "authenticated" | "error";
  error: string | null;
}

const AuthContext = createContext<AuthState>({ user: null, status: "loading", error: null });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, status: "loading", error: null });

  useEffect(() => {
    let cancelled = false;

    async function login() {
      try {
        const initData = getInitData();
        const result = await apiClient.post<{ token: string; user: UserDto }>("/auth/telegram", { initData });
        if (cancelled) return;
        setAuthToken(result.token);
        setState({ user: result.user, status: "authenticated", error: null });
      } catch (error) {
        if (cancelled) return;
        setState({
          user: null,
          status: "error",
          error: error instanceof Error ? error.message : "Failed to sign in",
        });
      }
    }

    void login();
    return () => {
      cancelled = true;
    };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
