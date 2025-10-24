"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

type User = any;

type AuthState = {
  user: User | null;
  token: string | null;
  setAuth: (v: { user: User; token: string | null }) => void;
  clearAuth: () => void;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const setAuthValue = useCallback(({ user, token }: { user: User; token: string | null }) => {
    setUser(user);
    setToken(token);
  }, []);

  const clearAuthValue = useCallback(() => {
    setUser(null);
    setToken(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      token,
      setAuth: setAuthValue,
      clearAuth: clearAuthValue,
    }),
    [user, token, setAuthValue, clearAuthValue]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

