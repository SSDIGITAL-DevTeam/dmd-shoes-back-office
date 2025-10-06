"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { setCookie as setCookieUtil, getCookie as getCookieUtil } from "@/lib/cookies";

type LoginResponse = {
  status: string;
  message: string;
  user?: any;
  token?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ""; // expects .../api/v1

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getCookieUtil("token") || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
    if (token) router.replace("/dashboard");
  }, [router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data: LoginResponse = await res.json().catch(() => ({} as any));
      if (!res.ok || data.status !== "success" || !data.token) {
        throw new Error(data?.message || "Login failed");
      }

      // Save token to cookie + localStorage fallback
      setCookieUtil("token", data.token, { maxAgeSeconds: remember ? 60 * 60 * 24 * 7 : undefined, sameSite: 'Lax', path: '/' });
      try { localStorage.setItem('token', data.token); } catch {}

      router.replace("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Unable to login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-sm p-8 sm:p-10">
        <div className="text-center mb-8">
          <p className="text-sm font-bold text-gray-700">DMD Shoes Admin</p>
          <h2 className="mt-2 text-xl font-semibold text-gray-900">Sign in</h2>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <form className="space-y-5" onSubmit={onSubmit}>
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
              Email address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="dmdshoes@mail.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#003663] focus:outline-none focus:ring-2 focus:ring-[#003663]"
            />
          </div>

          <div>
            <div className="flex items-center">
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
                Password <span className="text-red-500">*</span>
              </label>
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#003663] focus:outline-none focus:ring-2 focus:ring-[#003663]"
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((s) => !s)}
                className="absolute inset-y-0 right-2 my-auto inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-50"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="flex justify-end pt-5">
              <a href="/auth/reset-password" className="text-xs font-medium hover:underline" style={{ color: "#003663" }}>
                Forgot Password
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="remember"
              className="h-4 w-4 rounded border-gray-300"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              style={{ accentColor: "#003663" }}
            />
            <label htmlFor="remember" className="text-sm text-gray-700">
              Remember me
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60"
            style={{ backgroundColor: "#003663" }}
            onMouseOver={(e) => ((e.currentTarget.style.backgroundColor = "#002a4e"))}
            onMouseOut={(e) => ((e.currentTarget.style.backgroundColor = "#003663"))}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

// cookie helpers moved to @/lib/cookies
