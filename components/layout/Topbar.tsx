"use client";

import React, { useState } from "react";

// Simple SVG icons as components
const MenuIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

export interface TopbarProps {
  onMenuClick?: () => void;
  isMenuOpen?: boolean;
  userName?: string | null;
  userEmail?: string | null;
  onLogout?: () => void;
}

export function Topbar({
  onMenuClick,
  isMenuOpen = false,
  userName,
  userEmail,
  onLogout,
}: TopbarProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex items-center justify-between">
      {/* Left: Mobile hamburger + Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-all duration-200"
          aria-label="Open sidebar"
          aria-controls="admin-sidebar"
          aria-expanded={isMenuOpen}
          onClick={onMenuClick}
        >
          <MenuIcon />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">DMD Shoes Admin</h1>
      </div>

      {/* Right: User info dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsUserMenuOpen((prev) => !prev)}
          className="w-9 h-9 bg-black rounded-full flex items-center justify-center text-white hover:opacity-80 transition"
        >
          <UserIcon />
        </button>

        {/* Dropdown menu */}
        {isUserMenuOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 animate-fade-in">
            <div className="flex flex-col items-start gap-1">
              <span className="text-sm font-medium text-gray-900 truncate w-full">
                {userName || "—"}
              </span>
              <span className="text-xs text-gray-500 truncate w-full">
                {userEmail || ""}
              </span>
              <button
                type="button"
                onClick={onLogout}
                className="mt-2 w-full text-left text-sm font-medium text-red-600 hover:text-red-700 transition"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
