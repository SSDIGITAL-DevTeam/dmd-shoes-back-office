"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { useAuth } from '@/components/providers/AuthProvider';
import { getCookie as getCookieUtil, deleteCookie as deleteCookieUtil } from '@/lib/cookies';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, token, setAuth, clearAuth } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const token = getCookieUtil('access_token');
    console.log('==token', token);
    if (!token) {
      router.replace('/auth/login');
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/user`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        if (!res.ok) throw new Error('Invalid token');
        const user = await res.json();
        if (!cancelled) {
          setAuth({ user, token });
          setChecking(false);
        }
      } catch (e: any) {
        // clear cookie and redirect to login
        // deleteCookieUtil('access_token');
        // clearAuth();
        // if (!cancelled) {
        //   setError(e?.message || 'Unauthorized');
        //   router.replace('/auth/login');
        // }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, setAuth, clearAuth]);

  const toggleSidebar = () => setSidebarOpen((v) => !v);
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
    return (
      <div className="flex h-screen items-center justify-center text-gray-600">Loading...</div>
    );
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

// cookie helpers moved to @/lib/cookies
