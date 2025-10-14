"use client";

import React, { useMemo, useState, useEffect } from "react";
import { NewNounButton } from "@/components/ui/AddButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EditButton } from "@/components/ui/EditIcon";
import { DeleteButton } from "@/components/ui/DeleteIcon";
import { Pagination } from "@/components/layout/Pagination";
import { useRouter } from "next/navigation";

/* =========================
   Types aligned with Laravel
   ========================= */
type LaravelUser = {
  id: number;
  name: string;
  email: string;
  status: boolean; // true=active, false=inactive
};

type UsersIndexResponse = {
  status: string;
  message: string;
  data: LaravelUser[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
};

// For StatusBadge prop compatibility
type UiStatus = "active" | "non-active";
const mapBoolToUi = (b: boolean): UiStatus => (b ? "active" : "non-active");

/* Small helper: debounce */
function useDebounced<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function UsersPage() {
  // server data
  const [rows, setRows] = useState<LaravelUser[]>([]);
  const [meta, setMeta] = useState<UsersIndexResponse["meta"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ui controls
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(3);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "non-active"
  >("all");

  // tab counters (server-side using meta.total with tiny queries)
  const [allCount, setAllCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [nonActiveCount, setNonActiveCount] = useState(0);

  const debouncedQuery = useDebounced(query, 400);

  const router = useRouter();

  // reset ke page 1 saat filter/search/perPage berubah
  useEffect(
    () => setCurrentPage(1),
    [debouncedQuery, statusFilter, itemsPerPage]
  );

  // fetch list (index) dari API proxy Next.js → Laravel
  useEffect(() => {
    let mounted = true;
    const ac = new AbortController();

    async function loadList() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.set("per_page", String(itemsPerPage));
        params.set("page", String(currentPage));
        // Laravel expects: status=active|inactive|all
        const laravelStatus =
          statusFilter === "all"
            ? "all"
            : statusFilter === "active"
            ? "active"
            : "inactive";
        params.set("status", laravelStatus);
        if (debouncedQuery) params.set("search", debouncedQuery);

        const res = await fetch(`/api/users?${params.toString()}`, {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
          signal: ac.signal,
        });

        if (!mounted) return;

        if (!res.ok) {
          const j = (await res
            .json()
            .catch(() => null)) as Partial<UsersIndexResponse> | null;
          throw new Error(j?.message || `Request failed with ${res.status}`);
        }

        const payload = (await res.json()) as UsersIndexResponse;
        setRows(payload.data ?? []);
        setMeta(payload.meta ?? null);
      } catch (e: any) {
        if (!mounted || e?.name === "AbortError") return;
        setError(e?.message || "Failed to load users");
        setRows([]);
        setMeta(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadList();
    return () => {
      mounted = false;
      ac.abort();
    };
  }, [debouncedQuery, statusFilter, currentPage, itemsPerPage]);

  // fetch counters untuk tab (pakai per_page=1 agar ringan). Counter mengikuti current search.
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    async function fetchCount(statusParam: "all" | "active" | "inactive") {
      const p = new URLSearchParams();
      p.set("per_page", "1");
      p.set("page", "1");
      p.set("status", statusParam);
      if (debouncedQuery) p.set("search", debouncedQuery);

      const r = await fetch(`/api/users?${p.toString()}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: controller.signal,
      });
      if (!r.ok) throw new Error("count error");
      const j = (await r.json()) as UsersIndexResponse;
      return j.meta?.total ?? 0;
    }

    (async () => {
      try {
        const [tAll, tAct, tInact] = await Promise.all([
          fetchCount("all"),
          fetchCount("active"),
          fetchCount("inactive"),
        ]);
        if (!mounted) return;
        setAllCount(tAll);
        setActiveCount(tAct);
        setNonActiveCount(tInact);
      } catch {
        /* ignore counters error */
      }
    })();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [debouncedQuery]);

  // rows → UI adapter
  const currentUsers = useMemo(
    () =>
      rows.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        uiStatus: mapBoolToUi(Boolean(u.status)) as UiStatus,
      })),
    [rows]
  );

  const totalItems = meta?.total ?? 0;

  const handleEdit = (id: number) => {
    router.push(`/users/edit/${id}`);
  };
  const handleDelete = (id: number) => {
    // rekomendasi: panggil DELETE /api/v1/users/{id} melalui route handler /api/users/[id] (bisa ditambah nanti)
    console.log("Delete user:", id);
  };
  const handleNewUser = () => (window.location.href = "/users/create");

  return (
    <div className="min-h-full">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center text-sm text-gray-500">
          <span>Users</span>
          <span className="mx-2 text-gray-300">›</span>
          <span className="text-gray-600">List</span>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
          <NewNounButton noun="User" onClick={handleNewUser} />
        </div>
      </div>

      {/* Main */}
      <div className="bg-gray-50">
        <div className="px-6 py-6">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            {/* Tabs */}
            <div className="border-b border-gray-200 px-4 py-3">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    statusFilter === "all"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  All ({allCount})
                </button>
                <button
                  onClick={() => setStatusFilter("active")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    statusFilter === "active"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Active ({activeCount})
                </button>
                <button
                  onClick={() => setStatusFilter("non-active")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    statusFilter === "non-active"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Non Active ({nonActiveCount})
                </button>
              </nav>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-end gap-2 border-b border-gray-200 px-4 py-3">
              <div className="relative">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search"
                  className="w-56 rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm text-black placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <svg
                  className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>

              <button className="relative inline-flex items-center justify-center rounded-md border border-gray-200 p-2 text-gray-500 hover:bg-gray-50">
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .53-.21 1.05-.6 1.44L4 17h5m6 0v1a3 3 0 1 1-6 0v-1h6z"
                  />
                </svg>
                <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-semibold text-white">
                  0
                </span>
              </button>

              <button className="inline-flex items-center justify-center rounded-md border border-gray-200 p-2 text-gray-500 hover:bg-gray-50">
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 5h18M6 12h12M10 19h4"
                  />
                </svg>
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full table-fixed divide-y divide-gray-200">
                <colgroup>
                  <col className="w-[32%]" />
                  <col className="w-[38%]" />
                  <col className="w-[15%]" />
                  <col className="w-[15%]" />
                </colgroup>

                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Email
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    Array.from({ length: itemsPerPage }).map((_, i) => (
                      <tr key={`skeleton-${i}`} className="animate-pulse">
                        <td className="px-6 py-4">
                          <div className="h-4 w-40 rounded bg-gray-200" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-56 rounded bg-gray-200" />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="ml-auto h-4 w-20 rounded bg-gray-200" />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="ml-auto h-4 w-16 rounded bg-gray-200" />
                        </td>
                      </tr>
                    ))
                  ) : rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-10 text-center text-sm text-gray-500"
                      >
                        {error ? "Unable to load users" : "No users found"}
                      </td>
                    </tr>
                  ) : (
                    currentUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="max-w-[280px] truncate text-sm font-medium text-gray-900">
                            {user.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="max-w-[360px] truncate text-sm text-gray-900">
                            {user.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end">
                            <StatusBadge status={user.uiStatus} />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-4">
                            <EditButton onClick={() => handleEdit(user.id)} />
                            <DeleteButton
                              onClick={() => handleDelete(user.id)}
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer: pagination (server-side) */}
            <div className="border-t border-gray-200 px-4 py-3">
              <Pagination
                totalItems={totalItems}
                page={meta?.current_page ?? currentPage}
                pageSize={meta?.per_page ?? itemsPerPage}
                onPageChange={setCurrentPage}
                onPageSizeChange={setItemsPerPage}
                pageSizeOptions={[3, 10, 25, 50]}
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
    </div>
  );
}
