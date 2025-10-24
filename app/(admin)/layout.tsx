"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { useAuth } from '@/components/providers/AuthProvider';
import { deleteCookie as deleteCookieUtil } from '@/lib/cookies';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, token, setAuth, clearAuth } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      try {
        setError(null);
        const res = await fetch("/api/user", { cache: 'no-store', credentials: 'include' });

        if (res.status === 401 || res.status === 403) {
          deleteCookieUtil('access_token'); // opsional, untuk bersih
          clearAuth();
          if (!cancelled) {
            router.replace('/auth/login');
          }
          return;
        }

        if (!res.ok) {
          if (!cancelled) {
            setError(`Auth check failed (${res.status})`);
            setChecking(false);
          }
          return;
        }

        const me = await res.json();
        if (!cancelled) {
          setAuth({ user: me, token: me.token ?? null });
          setChecking(false);
        }
      } catch (e: any) {
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
      await fetch("/api/logout", { method: 'POST' }).catch(() => {});
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
      <Topbar
        onMenuClick={toggleSidebar}
        isMenuOpen={sidebarOpen}
        userName={user?.name ?? null}
        userEmail={user?.email ?? null}
        onLogout={onLogout}
      />
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
