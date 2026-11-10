import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { UserDto } from "@spirit/shared";
import { apiClient, setAuthToken } from "../lib/apiClient";
import { collectionQuery, storeQuery } from "../lib/queries";
import { getInitData } from "../lib/telegram";

interface AuthState {
  user: UserDto | null;
  status: "loading" | "authenticated" | "error";
  error: string | null;
}

const AuthContext = createContext<AuthState>({ user: null, status: "loading", error: null });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, status: "loading", error: null });
  const queryClient = useQueryClient();

  useEffect(() => {
    let cancelled = false;

    async function login() {
      try {
        const initData = getInitData();
        const result = await apiClient.post<{ token: string; user: UserDto }>("/auth/telegram", { initData });
        if (cancelled) return;
        setAuthToken(result.token);
        // Load both main tabs up front so switching between them doesn't wait on the network.
        void queryClient.prefetchQuery(collectionQuery());
        void queryClient.prefetchQuery(storeQuery(result.user.id));
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
  }, [queryClient]);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
