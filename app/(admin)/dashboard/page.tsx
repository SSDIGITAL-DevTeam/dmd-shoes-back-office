"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Pagination } from "@/components/layout/Pagination";
import { getDashboard, type DashboardResponse } from "@/services/dashboard.service";
import useDebounced from "@/hooks/useDebounced";

function Stat({ title, value, href, subtitle }: { title: string; value: number; href: string; subtitle: string }) {
  return (
    <a href={href} className="rounded-lg border border-gray-200 bg-white p-5 hover:shadow-sm transition-shadow block">
      <h3 className="mb-2 text-xs font-medium text-gray-600">{title}</h3>
      <p className="mb-1 text-3xl font-semibold text-gray-900">{value}</p>
      <p className="text-sm text-blue-700">{subtitle}</p>
    </a>
  );
}

export default function DashboardPage() {
  const [payload, setPayload] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(3);
  const [loading, setLoading] = useState(false);
  const debounced = useDebounced(query, 400);

  useEffect(() => setPage(1), [debounced, pageSize]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getDashboard({
          customers_search: debounced || undefined,
          customers_per_page: pageSize,
          page,
        });
        if (!alive) return;
        setPayload(res);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || "Failed to load dashboard");
        setPayload(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [debounced, page, pageSize]);

  const productsTotal = payload?.data?.products?.total ?? 0;
  const articlesTotal = payload?.data?.articles?.total ?? 0;
  const categoriesTotal = payload?.data?.categories?.total ?? 0;

  const customers = payload?.customers?.items ?? [];
  const meta = payload?.customers?.meta;
  const totalItems = meta?.total ?? 0;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="mb-1 text-2xl font-semibold text-gray-900">Dashboard</h1>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-3">
        <Stat title="Products" value={productsTotal} href="/products" subtitle="Total of all products" />
        <Stat title="Articles" value={articlesTotal} href="/articles" subtitle="Total of all articles" />
        <Stat title="Product Category" value={categoriesTotal} href="/product-category" subtitle="Total of all product category" />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h2 className="text-base font-semibold text-gray-900">Customers</h2>
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="w-56 rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500"
            />
            <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">WhatsApp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                Array.from({ length: Math.min(pageSize, 5) }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 w-40 rounded bg-gray-200" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-56 rounded bg-gray-200" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-32 rounded bg-gray-200" /></td>
                  </tr>
                ))
              ) : customers.length === 0 ? (
                <tr><td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500">{error ? "Unable to load customers" : "No customers found"}</td></tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-black">{c.full_name}</td>
                    <td className="px-6 py-4 text-black">{c.email}</td>
                    <td className="px-6 py-4 text-black">{c.whatsapp_number || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

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

        {error && <div className="border-t border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
      </div>
    </div>
  );
}