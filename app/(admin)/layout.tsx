"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  // const { user, token, setAuth, clearAuth } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen((v) => !v);
  const closeSidebar = () => setSidebarOpen(false);
  let user={
    name:"tes",
    email:"test@gmail.com"
  }




  const onLogout = async () => {
    router.replace('/auth/login');
  };



  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Topbar onMenuClick={toggleSidebar} isMenuOpen={sidebarOpen} userName={user?.name ?? null} userEmail={user?.email ?? null} onLogout={onLogout} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar open={sidebarOpen} onClose={closeSidebar} />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

// cookie helpers moved to @/lib/cookies
