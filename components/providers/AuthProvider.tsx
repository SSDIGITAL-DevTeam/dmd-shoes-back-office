"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

type User = any;

type AuthState = {
  user: User | null;
  token: string | null;
  setAuth: (v: { user: User; token: string }) => void;
  clearAuth: () => void;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const value = useMemo<AuthState>(
    () => ({
      user,
      token,
      setAuth: ({ user, token }) => {
        setUser(user);
        setToken(token);
      },
      clearAuth: () => {
        setUser(null);
        setToken(null);
      },
    }),
    [user, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

