"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

import { apiFetch, readApiError, readJson } from "@/lib/api";
import type { ApiError, User } from "@/lib/types";

type AuthState = {
  loading: boolean;
  accessToken: string | null;
  user: User | null;
};

type AuthContextValue = AuthState & {
  refresh: () => Promise<string | null>;
  login: (email: string, password: string) => Promise<ApiError | null>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    loading: true,
    accessToken: null,
    user: null,
  });

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    const res = await apiFetch("/api/auth/refresh", { method: "POST" });
    if (!res.ok) {
      setState({ loading: false, accessToken: null, user: null });
      return null;
    }
    const data = await readJson<{ access_token: string; user: User }>(res);
    setState({ loading: false, accessToken: data.access_token, user: data.user });
    return data.access_token;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiFetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      return await readApiError(res);
    }
    const data = await readJson<{ access_token: string; user: User }>(res);
    setState({ loading: false, accessToken: data.access_token, user: data.user });
    return null;
  }, []);

  const logout = useCallback(async () => {
    const accessToken = state.accessToken;
    await apiFetch("/api/auth/logout", { method: "POST", accessToken });
    setState({ loading: false, accessToken: null, user: null });
  }, [state.accessToken]);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, refresh, login, logout }),
    [state, refresh, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("AuthProvider missing");
  return ctx;
}
