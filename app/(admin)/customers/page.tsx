"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/fetching";
import { Pagination } from "@/components/layout/Pagination";

type Customer = {
  id: number;
  full_name: string;
  email: string;
  whatsapp_number: string;
};

type CustomersResponse = {
  status: string;
  message: string;
  data: Customer[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
};

function useDebounced<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function CustomersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const initialSearch = searchParams.get("search") ?? "";
  const initialPage = Number(searchParams.get("page") || 1) || 1;
  const initialPerPage = Number(searchParams.get("per_page") || 10) || 10;

  const [search, setSearch] = useState(initialSearch);
  const [page, setPage] = useState(initialPage);
  const [perPage, setPerPage] = useState(initialPerPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);

  const debouncedSearch = useDebounced(search, 500);
  const firstLoad = useRef(true);

  // Keep URL in sync with state for shareable filters
  useEffect(() => {
    const params = new URLSearchParams(searchParams?.toString());
    params.set("page", String(page));
    params.set("per_page", String(perPage));
    if (search) params.set("search", search);
    else params.delete("search");
    router.replace(`${pathname}?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage, search]);

  // Fetch data when filters change (search is debounced)
  useEffect(() => {
    let mounted = true;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get<CustomersResponse>(
          "/customers",
          {
            params: {
              page,
              per_page: perPage,
              search: debouncedSearch || undefined,
            },
          }
        );
        if (!mounted) return;
        setRows(data.data || []);
        setTotal(data.meta?.total ?? 0);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || "Gagal memuat data pelanggan");
        setRows([]);
        setTotal(0);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    // Reset page to 1 when changing search term (after first render)
    if (!firstLoad.current && debouncedSearch !== initialSearch) {
      setPage(1);
    }
    firstLoad.current = false;

    run();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage, debouncedSearch]);

  const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const onPageChange = (p: number) => setPage(p);
  const onPageSizeChange = (s: number) => setPerPage(s);

  const hasData = rows.length > 0;

  const tableBody = useMemo(() => {
    if (loading) {
      return (
        <tbody>
          {Array.from({ length: Math.min(perPage, 10) }).map((_, i) => (
            <tr key={`sk-${i}`} className="animate-pulse">
              <td className="px-4 py-3">
                <div className="h-4 w-40 rounded bg-gray-200" />
              </td>
              <td className="px-4 py-3">
                <div className="h-4 w-56 rounded bg-gray-200" />
              </td>
              <td className="px-4 py-3">
                <div className="h-4 w-36 rounded bg-gray-200" />
              </td>
              <td className="px-4 py-3 text-right">
                <div className="ml-auto h-8 w-16 rounded bg-gray-200" />
              </td>
            </tr>
          ))}
        </tbody>
      );
    }
    if (!hasData) {
      return (
        <tbody>
          <tr>
            <td colSpan={4} className="px-4 py-10 text-center text-gray-500">
              Tidak ada pelanggan ditemukan
            </td>
          </tr>
        </tbody>
      );
    }
    return (
      <tbody className="divide-y divide-gray-100">
        {rows.map((c) => (
          <tr
            key={c.id}
            className="group transition-colors hover:bg-amber-50/40"
          >
            <td className="px-4 py-3 text-sm font-medium text-gray-900">
              {c.full_name}
            </td>
            <td className="px-4 py-3 text-sm text-gray-700">{c.email}</td>
            <td className="px-4 py-3 text-sm text-gray-700">
              {c.whatsapp_number}
            </td>
            <td className="px-4 py-3 text-right text-sm">
              <Link
                href={`/customers/${c.id}/edit`}
                aria-label={`Edit ${c.full_name}`}
                className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-amber-800 shadow-sm transition hover:bg-amber-100"
              >
                Edit
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    );
  }, [loading, hasData, rows, perPage]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Customers</h1>
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <input
            type="search"
            value={search}
            onChange={onSearchChange}
            placeholder="Cari pelanggan berdasarkan email, nama, atau nomor telepon"
            aria-label="Cari pelanggan berdasarkan email, nama, atau nomor telepon"
            className="w-full rounded-lg border border-gray-300 bg-white px-10 py-2 text-sm text-black placeholder:text-gray-400 shadow-sm outline-none transition focus:border-transparent focus:ring-2 focus:ring-amber-500"
          />
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M12.9 14.32a8 8 0 111.414-1.414l3.387 3.386a1 1 0 01-1.414 1.415l-3.387-3.387zM14 8a6 6 0 11-12 0 6 6 0 0112 0z"
              clipRule="evenodd"
            />
          </svg>
          {/* Micro spinner while typing */}
          {loading && (
            <svg
              className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-amber-500"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          )}
        </div>
      </div>

      {/* Card */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Full Name</th>
                <th scope="col" className="px-4 py-3 font-medium">Email</th>
                <th scope="col" className="px-4 py-3 font-medium">Phone</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            {tableBody}
          </table>
        </div>

        {/* Footer: pagination */}
        <div className="border-t border-gray-100">
          <Pagination
            totalItems={total}
            page={page}
            pageSize={perPage}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            pageSizeOptions={[10, 25, 50]}
            className="bg-white"
          />
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}
    </div>
  );
}
