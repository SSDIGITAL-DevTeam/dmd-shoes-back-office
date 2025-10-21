// app/users/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useDebounced from "@/hooks/useDebounced";
import { NewNounButton } from "@/components/ui/AddButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EditButton } from "@/components/ui/EditIcon";
import { DeleteButton } from "@/components/ui/DeleteIcon";
import { Pagination } from "@/components/layout/Pagination";
import { listUsers, deleteUser, type LaravelUser } from "@/services/users.service";
import { mapBoolToUi, type UiStatus } from "@/services/types";

export default function UsersPage() {
  const router = useRouter();

  const [rows, setRows] = useState<LaravelUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ current_page: number; per_page: number; total: number; last_page: number } | null>(null);

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // filter status aktif
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // debounced search
  const debounced = useDebounced(query, 400);

  // counter
  const [allCount, setAllCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [inactiveCount, setInactiveCount] = useState(0);

  // reset page jika filter berubah
  useEffect(() => setPage(1), [debounced, statusFilter, pageSize]);

  // fetch list
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const r = await listUsers({
          page,
          per_page: pageSize,
          status: statusFilter,           // "all" | "active" | "inactive"
          search: debounced || undefined,
        });
        if (!alive) return;
        setRows(r.data);
        setMeta(r.meta as any);
      } catch (e: any) {
        if (!alive) return;
        setRows([]);
        setMeta(null);
        setError(e?.message || "Failed to load users");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [debounced, statusFilter, page, pageSize]);

  // fetch counters
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [allRes, actRes, inactRes] = await Promise.all([
          listUsers({ page: 1, per_page: 1, status: "all", search: debounced || undefined }),
          listUsers({ page: 1, per_page: 1, status: "active", search: debounced || undefined }),
          listUsers({ page: 1, per_page: 1, status: "inactive", search: debounced || undefined }),
        ]);
        if (!alive) return;
        setAllCount(Number((allRes.meta as any)?.total ?? 0));
        setActiveCount(Number((actRes.meta as any)?.total ?? 0));
        setInactiveCount(Number((inactRes.meta as any)?.total ?? 0));
      } catch {
        // abaikan
      }
    })();
    return () => { alive = false; };
  }, [debounced]);

  const displayRows = useMemo(
    () => rows.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      uiStatus: mapBoolToUi(Boolean(u.status)) as UiStatus,
    })),
    [rows]
  );

  const handleEdit = (id: number | string) => router.push(`/users/edit/${id}`);

  const refreshAfterMutation = async () => {
    const r = await listUsers({
      page,
      per_page: pageSize,
      status: statusFilter,
      search: debounced || undefined,
    });
    setRows(r.data);
    setMeta(r.meta as any);

    const [allRes, actRes, inactRes] = await Promise.all([
      listUsers({ page: 1, per_page: 1, status: "all", search: debounced || undefined }),
      listUsers({ page: 1, per_page: 1, status: "active", search: debounced || undefined }),
      listUsers({ page: 1, per_page: 1, status: "inactive", search: debounced || undefined }),
    ]);
    setAllCount(Number((allRes.meta as any)?.total ?? 0));
    setActiveCount(Number((actRes.meta as any)?.total ?? 0));
    setInactiveCount(Number((inactRes.meta as any)?.total ?? 0));
  };

  const handleDeleteClick = async (id: number | string) => {
    const ok = confirm("Delete this user?");
    if (!ok) return;
    try {
      await deleteUser(id);
      await refreshAfterMutation();
    } catch (e: any) {
      setError(e?.message || "Failed to delete user");
    }
  };

  // Selalu tampilkan 3 tab (All, Active, Non Active)
  const tabs = useMemo(
    () => ([
      { k: "all" as const,      label: `All (${allCount})` },
      { k: "active" as const,   label: `Active (${activeCount})` },
      { k: "inactive" as const, label: `Non Active (${inactiveCount})` },
    ]),
    [allCount, activeCount, inactiveCount]
  );

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

      {/* Header + New */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
          <NewNounButton noun="User" onClick={() => router.push("/users/create")} />
        </div>
      </div>

      {/* Content */}
      <div className="bg-gray-50">
        <div className="px-6 py-6">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            {/* Tabs */}
            <div className="border-b border-gray-200 px-4 py-3">
              <nav className="flex space-x-8">
                {tabs.map((t) => (
                  <button
                    key={t.k}
                    onClick={() => setStatusFilter(t.k)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      statusFilter === t.k
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Search */}
            <div className="flex items-center justify-end gap-2 border-b border-gray-200 px-4 py-3">
              <div className="relative">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search"
                  className="w-56 rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
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
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Email</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    Array.from({ length: pageSize }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-4"><div className="h-4 w-40 rounded bg-gray-200" /></td>
                        <td className="px-6 py-4"><div className="h-4 w-56 rounded bg-gray-200" /></td>
                        <td className="px-6 py-4 text-right"><div className="ml-auto h-4 w-20 rounded bg-gray-200" /></td>
                        <td className="px-6 py-4 text-right"><div className="ml-auto h-4 w-16 rounded bg-gray-200" /></td>
                      </tr>
                    ))
                  ) : displayRows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-500">
                        {error ? "Unable to load users" : "No users found"}
                      </td>
                    </tr>
                  ) : (
                    displayRows.map(u => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="max-w-[280px] truncate text-sm font-medium text-gray-900">{u.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="max-w-[360px] truncate text-sm text-gray-900">{u.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end"><StatusBadge status={u.uiStatus} /></div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-4">
                            <EditButton onClick={() => handleEdit(u.id)} />
                            <DeleteButton onClick={() => handleDeleteClick(u.id)} />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="border-t border-gray-200 px-4 py-3">
              <Pagination
                totalItems={meta?.total ?? 0}
                page={meta?.current_page ?? page}
                pageSize={meta?.per_page ?? pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[10, 25, 50]}
              />
            </div>

            {/* Error global */}
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