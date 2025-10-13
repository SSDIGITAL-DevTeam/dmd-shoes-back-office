"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Pagination } from "@/components/layout/Pagination";
import api from "@/lib/fetching";

type StatsCardProps = {
  title: string;
  value: string | number;
  subtitle: string;
  href?: string;
};

type DashboardSummary = {
  products?: {
    total?: number;
    active?: number;
    inactive?: number;
  };
  articles?: {
    total?: number;
    publish?: number;
    draft?: number;
  };
  categories?: {
    total?: number;
  };
  customers?: {
    total?: number;
  };
};

type DashboardCustomer = {
  id: number;
  full_name: string;
  email: string;
  whatsapp_number: string | null;
};

type DashboardCustomersMeta = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};

type DashboardResponse = {
  status: string;
  message: string;
  data: DashboardSummary;
  customers: {
    items: DashboardCustomer[];
    meta: DashboardCustomersMeta;
  };
};

function StatsCard({ title, value, subtitle, href }: StatsCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm/0 hover:shadow-sm transition-shadow">
      <h3 className="mb-2 text-xs font-medium text-gray-600">{title}</h3>
      <p className="mb-1 text-3xl font-semibold text-gray-900">{value}</p>
      {href ? (
        <Link
          href={href}
          className="text-sm font-medium text-blue-700 hover:underline"
        >
          {subtitle}
        </Link>
      ) : (
        <p className="text-sm text-blue-700">{subtitle}</p>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [customers, setCustomers] = useState<DashboardCustomer[]>([]);
  const [meta, setMeta] = useState<DashboardCustomersMeta | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebounced(query, 400);

  useEffect(() => setPage(1), [query, pageSize]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get<DashboardResponse>("/dashboard", {
          params: {
            customers_search: debouncedQuery || undefined,
            customers_per_page: pageSize,
            page,
          },
        });

        if (!mounted) return;

        const payload = response.data;
        setSummary(payload?.data ?? null);
        setCustomers(payload?.customers?.items ?? []);
        setMeta(payload?.customers?.meta ?? null);

        if (payload?.customers?.meta?.current_page && payload.customers.meta.current_page !== page) {
          setPage(payload.customers.meta.current_page);
        }
        if (payload?.customers?.meta?.per_page && payload.customers.meta.per_page !== pageSize) {
          setPageSize(payload.customers.meta.per_page);
        }
      } catch (err: any) {
        if (!mounted) return;
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load dashboard data";
        setError(message);
        setSummary(null);
        setCustomers([]);
        setMeta(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [debouncedQuery, page, pageSize]);

  const productsTotal = summary?.products?.total ?? 0;
  const articlesTotal = summary?.articles?.total ?? 0;
  const categoriesTotal = summary?.categories?.total ?? 0;

  const totalItems = meta?.total ?? 0;

  const tableBody = useMemo(() => {
    if (loading) {
      return (
        <tbody className="divide-y divide-gray-200 bg-white">
          {Array.from({ length: Math.min(pageSize, 5) }).map((_, i) => (
            <tr key={`loading-${i}`} className="animate-pulse">
              <td className="whitespace-nowrap px-6 py-4">
                <div className="h-4 w-40 rounded bg-gray-200" />
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <div className="h-4 w-56 rounded bg-gray-200" />
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <div className="h-4 w-32 rounded bg-gray-200" />
              </td>
            </tr>
          ))}
        </tbody>
      );
    }

    if (customers.length === 0) {
      return (
        <tbody className="divide-y divide-gray-200 bg-white">
          <tr>
            <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500">
              {error ? "Unable to load customers" : "No customers found"}
            </td>
          </tr>
        </tbody>
      );
    }

    return (
      <tbody className="divide-y divide-gray-200 bg-white">
        {customers.map((c) => (
          <tr key={c.id} className="hover:bg-gray-50">
            <td className="whitespace-nowrap px-6 py-4">
              <div className="text-sm font-medium text-gray-900">{c.full_name}</div>
            </td>
            <td className="whitespace-nowrap px-6 py-4">
              <div className="text-sm text-gray-900">{c.email}</div>
            </td>
            <td className="whitespace-nowrap px-6 py-4">
              <div className="text-sm text-gray-900">{c.whatsapp_number || "-"}</div>
            </td>
          </tr>
        ))}
      </tbody>
    );
  }, [customers, loading, pageSize, error]);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="mb-1 text-2xl font-semibold text-gray-900">Dashboard</h1>
        {/* Opsional: hapus jika tidak perlu, di desain aslinya kosong */}
        {/* <p className="text-gray-600">Welcome to DMD Shoes Admin Dashboard</p> */}
      </div>

      {/* Cards (3 kolom seperti desain) */}
      <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-3">
        <StatsCard
          title="Products"
          value={productsTotal}
          subtitle="Total of all products"
          href="/products"
        />
        <StatsCard
          title="Articles"
          value={articlesTotal}
          subtitle="Total of all articles"
          href="/articles"
        />
        <StatsCard
          title="Product Category"
          value={categoriesTotal}
          subtitle="Total of all product category"
          href="/product-category"
        />
      </div>

      {/* Customers (preview) */}
      <div className="grid grid-cols-1 gap-6">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          {/* Header row: title + actions */}
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <h2 className="text-base font-semibold text-gray-900">Customers</h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search"
                  className="w-56 rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <Link href="/customers" className="text-sm font-medium text-blue-700 hover:underline">
                View all
              </Link>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Email</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">WhatsApp</th>
                </tr>
              </thead>
              {tableBody}
            </table>
          </div>

          {/* Footer: pagination */}
          <div className="border-t border-gray-200 px-4 py-3">
            <Pagination
              totalItems={totalItems}
              page={meta?.current_page ?? page}
              pageSize={meta?.per_page ?? pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[3, 5, 10]}
            />
          </div>

          {error && (
            <div className="border-t border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------- helpers -------- */
function Item({ label, sub, time }: { label: string; sub: string; time: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
      <div>
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-sm text-gray-500">{sub}</p>
      </div>
      <span className="text-xs text-gray-400">{time}</span>
    </div>
  );
}

function Action({ title, sub }: { title: string; sub: string }) {
  return (
    <button className="rounded-lg border border-gray-200 p-4 text-left transition-colors hover:bg-gray-50">
      <div className="mb-1 font-medium text-gray-900">{title}</div>
      <div className="text-sm text-gray-500">{sub}</div>
    </button>
  );
}

function useDebounced<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
