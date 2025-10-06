"use client";

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Simple SVG icons as components (Similarity Principle: consistent size and stroke)
const DashboardIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
  </svg>
);

const ArticleIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const CategoryIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

const ProductIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const TagIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

const CustomerIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

type IconType = React.ComponentType;

interface MenuItem {
  label: string;
  href?: string;
  icon: IconType;
  children?: MenuItem[]; // nested menu support
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export interface SidebarProps {
  open?: boolean; // mobile open state
  onClose?: () => void;
  sections?: MenuSection[]; // allow reuse/customization
}

const defaultSections: MenuSection[] = [
  {
    title: "",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: DashboardIcon }
    ]
  },
      {
        title: "Content Management",
        items: [
          { label: "Homepage Content", href: "/homepage-content", icon: ArticleIcon },
          { label: "Articles", href: "/articles", icon: ArticleIcon },
          {
            label: "Catalog",
            icon: CategoryIcon,
            children: [
          { label: "Product Category", href: "/product-category", icon: CategoryIcon },
          { label: "Products", href: "/products", icon: ProductIcon }
        ]
      },
    ]
  },
  {
    title: "Meta Tag Management",
    items: [
      { label: "Meta Tags", href: "/meta-tags", icon: TagIcon }
    ]
  },
  {
    title: "Customer Data",
    items: [
      { label: "Customers", href: "/customers", icon: CustomerIcon }
    ]
  },
  {
    title: "User Management",
    items: [
      { label: "Users", href: "/users", icon: UserIcon }
    ]
  }
];

export function Sidebar({ open = false, onClose, sections = defaultSections }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === '/dashboard') return pathname === href;
    return pathname?.startsWith(href);
  };

  // Track open/close state for nested menus (by label key)
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const toggleMenu = (key: string) => setOpenMenus((s) => ({ ...s, [key]: !s[key] }));

  // Precompute active parents to keep them open
  const activeParents = useMemo(() => {
    const map: Record<string, boolean> = {};
    sections.forEach((section) => {
      section.items.forEach((item) => {
        if (item.children) {
          item.children.forEach((c) => {
            if (isActive(c.href)) map[item.label] = true;
          });
        }
      });
    });
    return map;
  }, [sections, pathname]);

  const sidebarId = 'admin-sidebar';

  // Sidebar panel (reused for mobile and desktop)
  const SidebarPanel = (
    <div
      className="w-64 bg-white border-r border-gray-200 h-full flex flex-col focus:outline-none"
      role="navigation"
      aria-label="Sidebar"
    >
      {/* Mobile-only close button (ensures keyboard/screen reader access) */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h2 id="sidebar-title" className="text-sm font-semibold text-gray-900">Menu</h2>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
          aria-label="Close sidebar"
          onClick={onClose}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-6">
            {section.title && (
              <h3 className="px-4 text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                {section.title}
              </h3>
            )}
            <nav className="space-y-1 px-2">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                // If has children, render as collapsible group
                if (item.children && item.children.length > 0) {
                  const opened = openMenus[item.label] || activeParents[item.label] || false;
                  return (
                    <div key={item.label} className="transition-all ease-in-out duration-300">
                      <button
                        type="button"
                        className={`w-full flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md transition-all ease-in-out duration-300 ${
                          opened ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                        aria-expanded={opened}
                        onClick={() => toggleMenu(item.label)}
                      >
                        <span className="flex items-center">
                          <Icon />
                          <span className="ml-3">{item.label}</span>
                        </span>
                        <svg
                          className={`w-4 h-4 transform transition-transform duration-300 ${opened ? 'rotate-180' : ''}`}
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <div
                        className={`mt-1 pl-6 overflow-hidden transition-all ease-in-out duration-300 ${
                          opened ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                        }`}
                        aria-hidden={!opened}
                      >
                        {item.children.map((child) => {
                          const childActive = isActive(child.href);
                          const ChildIcon = child.icon;
                          return (
                            <Link
                              key={`${item.label}-${child.label}`}
                              href={child.href || '#'}
                              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all ease-in-out duration-300 ${
                                childActive
                                  ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                              }`}
                              onClick={onClose}
                            >
                              <ChildIcon />
                              <span className="ml-3">{child.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                // Leaf item
                return (
                  <Link
                    key={item.href || item.label}
                    href={item.href || '#'}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all ease-in-out duration-300 ${
                      active
                        ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    onClick={onClose}
                  >
                    <Icon />
                    <span className="ml-3">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile off-canvas */}
      <div className="md:hidden" aria-hidden={!open}>
        {/* Overlay (Figure-Ground Principle) */}
        <div
          className={`${open ? 'opacity-100' : 'opacity-0 pointer-events-none'} fixed inset-0 bg-black/40 transition-opacity duration-300 ease-in-out z-40`}
          onClick={onClose}
          aria-hidden={!open}
        />
        {/* Panel */}
        <div
          id={sidebarId}
          className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="sidebar-title"
        >
          {SidebarPanel}
        </div>
      </div>

      {/* Desktop static sidebar */}
      <div className="hidden md:flex md:flex-shrink-0" aria-hidden={false}>
        {SidebarPanel}
      </div>
    </>
  );
}
