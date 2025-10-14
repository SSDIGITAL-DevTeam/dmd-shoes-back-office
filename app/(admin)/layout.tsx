"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { useAuth } from '@/components/providers/AuthProvider';
import { getCookie as getCookieUtil, deleteCookie as deleteCookieUtil } from '@/lib/cookies';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, token, setAuth, clearAuth } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      // 1) selalu ambil token dari cookie (persist setelah refresh)
      const t = getCookieUtil('access_token');

      // Tidak ada token → selesai checking dulu, baru redirect
      if (!t) {
        if (!cancelled) {
          setChecking(false);
          router.replace('/auth/login');
        }
        return;
      }

      try {
        // 2) verifikasi token
        const res = await fetch(`${API_BASE}/user`, {
          headers: { Authorization: `Bearer ${t}` },
          cache: 'no-store',
        });

        // 401/403 → memang tidak valid → hapus cookie & login lagi
        if (res.status === 401 || res.status === 403) {
          deleteCookieUtil('access_token');
          clearAuth();
          if (!cancelled) {
            setChecking(false);
            router.replace('/auth/login');
          }
          return;
        }

        // Error lain (404/5xx/network) → JANGAN hapus token; tampilkan error saja
        if (!res.ok) {
          const msg = `Auth check failed (${res.status})`;
          if (!cancelled) {
            setError(msg);
            setChecking(false);
          }
          return;
        }

        const me = await res.json();
        if (!cancelled) {
          setAuth({ user: me, token: t });
          setChecking(false);
        }
      } catch (e: any) {
        // Network error → jangan drop token
        if (!cancelled) {
          setError(e?.message || 'Network error');
          setChecking(false);
        }
      }
    };

    verify();
    return () => { cancelled = true; };
  }, [router, setAuth, clearAuth]);

  const toggleSidebar = () => setSidebarOpen(v => !v);
  const closeSidebar = () => setSidebarOpen(false);

  const onLogout = async () => {
    try {
      const t = token || getCookieUtil('access_token');
      if (t) {
        await fetch(`${API_BASE}/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${t}` },
        }).catch(() => {});
      }
    } finally {
      deleteCookieUtil('access_token');
      clearAuth();
      router.replace('/auth/login');
    }
  };

  if (checking) {
    return <div className="flex h-screen items-center justify-center text-gray-600">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Topbar onMenuClick={toggleSidebar} isMenuOpen={sidebarOpen} userName={user?.name ?? null} userEmail={user?.email ?? null} onLogout={onLogout} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar open={sidebarOpen} onClose={closeSidebar} />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}