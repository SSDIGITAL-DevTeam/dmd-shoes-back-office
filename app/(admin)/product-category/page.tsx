"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { NewNounButton } from "@/components/ui/AddButton";
import { EditButton } from "@/components/ui/EditIcon";
import { DeleteButton } from "@/components/ui/DeleteIcon";
import { Pagination } from "@/components/layout/Pagination";
import api from "@/lib/fetching";
import { useRouter } from "next/navigation";

type ParentFilter = "all" | "has-parent" | "no-parent";
type SortDir = "asc" | "desc";

type ApiCategory = {
  id: number;
  parent_id: number | null;
  name?: { id?: string; en?: string };
  name_text?: string;
  slug?: string;
  status?: boolean;
  cover?: string | null;
  cover_url?: string | null;
  parent_brief?: ParentBrief | null;
};

type ParentBrief = {
  id: number;
  slug: string;
  name?: { id?: string; en?: string };
};

export default function ProductCategoryPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [query, setQuery] = useState("");
  const [parentFilter, setParentFilter] = useState<ParentFilter>("all");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [filterOpen, setFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // =============== FETCH HELPER (bisa di-refetch kapan pun) ===============
  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/categories", { params: { per_page: 100, status: "all" } });
      const data = res.data?.data ?? [];
      setCategories(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  }, []);

  // awal mount
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // refetch saat tab fokus / kembali dari bfcache
  useEffect(() => {
    const onFocus = () => loadCategories();
    const onPageShow = (e: PageTransitionEvent) => { if ((e as any).persisted) loadCategories(); };
    window.addEventListener("focus", onFocus);
    window.addEventListener("pageshow", onPageShow as any);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("pageshow", onPageShow as any);
    };
  }, [loadCategories]);

  // ====== data processing: search + filter + sort ======
  const processed = useMemo(() => {
    let data = [...categories];
    const q = query.trim().toLowerCase();
    if (q) {
      data = data.filter((c) => {
        const n = c.name_text || c.name?.id || c.name?.en || "";
        return [n, c.slug || ""].some((v) => v.toLowerCase().includes(q));
      });
    }
    if (parentFilter === "has-parent") data = data.filter((c) => !!c.parent_id);
    if (parentFilter === "no-parent") data = data.filter((c) => !c.parent_id);
    data.sort((a, b) => {
      const aName = (a.name_text || a.name?.id || a.name?.en || "").toLowerCase();
      const bName = (b.name_text || b.name?.id || b.name?.en || "").toLowerCase();
      return sortDir === "asc" ? aName.localeCompare(bName) : bName.localeCompare(aName);
    });
    return data;
  }, [categories, query, parentFilter, sortDir]);

  const totalItems = processed.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCategories = processed.slice(startIndex, endIndex);

  const handlePageChange = (p: number) => setCurrentPage(p);
  const handlePageSizeChange = (n: number) => {
    setItemsPerPage(n);
    setCurrentPage(1);
  };

  React.useEffect(() => setCurrentPage(1), [query, parentFilter, sortDir]);

  const handleNewCategory = () => router.push('/product-category/create');
  const handleEdit = (id: number) => router.push(`/product-category/edit/${id}`);

  // =============== DELETE + REFETCH ===============
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      // Optimistic (opsional, biar langsung hilang):
      setCategories(prev => prev.filter(c => c.id !== id));

      await api.delete(`/categories/${id}`);

      // Hard refetch supaya sinkron dengan server (wajib untuk kasus lain):
      await loadCategories();
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'Failed to delete');
      // rollback jika perlu (opsional): await loadCategories();
    }
  };

  const PLACEHOLDER = "/api/placeholder/50/50";
  const STORAGE_BASE = (process.env.NEXT_PUBLIC_STORAGE_URL || '').replace(/\/$/, '');
  const toImageUrl = (v?: string | null) => {
    if (!v) return PLACEHOLDER;
    if (/^https?:\/\//i.test(v)) return v;
    return STORAGE_BASE ? `${STORAGE_BASE}/${String(v).replace(/^\/+/, '')}` : PLACEHOLDER;
  };

  return (
    <div className="min-h-full">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center text-sm text-gray-500">
          <span>Categories</span>
          <span className="mx-2 text-gray-300">›</span>
          <span className="text-gray-600">List</span>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Categories</h1>
          <NewNounButton noun="Category" onClick={handleNewCategory} />
        </div>
      </div>

      {/* Main */}
      <div className="bg-gray-50">
        <div className="px-6 py-6">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            {/* Card toolbar */}
            <div className="flex items-center justify-end gap-2 border-b border-gray-200 px-4 py-3">
              {/* Search (pill) */}
              <div className="relative">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search"
                  className="w-56 rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <svg
                  className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M16 10a6 6 0 1 0-12 0a6 6 0 0 0 12 0Z" />
                </svg>
              </div>

              {/* Bell (badge 0) */}
              <button className="relative inline-flex items-center justify-center rounded-md border border-gray-200 p-2 text-gray-500 hover:bg-gray-50">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .53-.21 1.05-.6 1.44L4 17h5m6 0v1a3 3 0 1 1-6 0v-1h6z"/>
                </svg>
                <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-semibold text-white">0</span>
              </button>

              {/* Filter popover */}
              <div className="relative">
                <button
                  onClick={() => setFilterOpen((v) => !v)}
                  className="inline-flex items-center justify-center rounded-md border border-gray-200 p-2 text-gray-500 hover:bg-gray-50"
                  aria-haspopup="true"
                  aria-expanded={filterOpen}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 5h18M6 12h12M10 19h4" />
                  </svg>
                </button>
                {filterOpen && (
                  <div
                    className="absolute right-0 z-10 mt-2 w-64 rounded-lg border border-gray-200 bg-white p-3 text-sm shadow-lg"
                    onMouseLeave={() => setFilterOpen(false)}
                  >
                    <div className="mb-3">
                      <div className="mb-1 text-xs font-semibold text-gray-500">Parent Category</div>
                      <div className="grid grid-cols-3 gap-2">
                        {([
                          { key: "all", label: "All" },
                          { key: "has-parent", label: "Has" },
                          { key: "no-parent", label: "None" },
                        ] as const).map((opt) => (
                          <button
                            key={opt.key}
                            onClick={() => setParentFilter(opt.key)}
                            className={[
                              "rounded-md px-3 py-1.5",
                              parentFilter === opt.key
                                ? "bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-200"
                                : "bg-white text-gray-700 hover:bg-gray-50",
                            ].join(" ")}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="mb-1 text-xs font-semibold text-gray-500">Sort by Name</div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSortDir("asc")}
                          className={[
                            "flex-1 rounded-md px-3 py-1.5",
                            sortDir === "asc"
                              ? "bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-200"
                              : "bg-white text-gray-700 hover:bg-gray-50",
                          ].join(" ")}
                        >
                          A → Z
                        </button>
                        <button
                          onClick={() => setSortDir("desc")}
                          className={[
                            "flex-1 rounded-md px-3 py-1.5",
                            sortDir === "desc"
                              ? "bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-200"
                              : "bg-white text-gray-700 hover:bg-gray-50",
                          ].join(" ")}
                        >
                          Z → A
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {error && (
                <div className="m-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
              )}
              {loading ? (
                <div className="p-6 text-sm text-gray-600">Loading...</div>
              ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-12 px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-6">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-6">
                      Cover
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-6">
                      <div className="flex items-center gap-1">
                        <span>Name</span>
                        <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4M8 15l4 4 4-4" />
                        </svg>
                      </div>
                    </th>
                    <th className="hidden px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:table-cell sm:px-6">
                      <div className="flex items-center gap-1">
                        <span>Parent Category</span>
                        <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4M8 15l4 4 4-4" />
                        </svg>
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-6">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {currentCategories.map((category) => (
                    <tr key={category.id} className="hover:bg-gray-50 bg-white">
                      <td className="whitespace-nowrap px-3 py-4 sm:px-6">
                        <input type="checkbox" className="rounded border-gray-300" />
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 sm:px-6">
                        <div className="h-12 w-12 overflow-hidden rounded bg-gray-200">
                          <img
                            src={category.cover_url || category.cover || "/api/placeholder/50/50"}
                            alt="Category cover"
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src =
                                "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIGZpbGw9IiNGM0Y0RjYiLz48cGF0aCBkPSJNMjQgMzZDMzAuNjI3NCAzNiAzNiAzMC42Mjc0IDM2IDI0QzM2IDE3LjM3MjYgMzAuNjI3NCAxMiAyNCAxMkMxNy4zNzI2IDEyIDEyIDE3LjM3MjYgMTIgMjRDMTIgMzAuNjI3NiAxNy4zNzI2IDM2IDI0IDM2WiIgc3Ryb2tlPSIjOUNBM0FGIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNMjQgMjhDMjYuMjA5MSAyOCAyOCAyNi4yMDkxIDI4IDI0QzI4IDIxLjc5MDkgMjYuMjA5MSAyMCAyNCAyMEMyMS43OTA5IDIwIDIwIDIxLjc5MDkgMjAgMjRDMjAgMjYuMjA5MSAyMS43OTA5IDI4IDI0IDI4WiIgc3Ryb2tlPSIjOUNBM0FGIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=";
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-3 py-4 sm:px-6">
                        <div className="max-w-xs truncate text-sm font-medium text-gray-900">{category.name_text || category.name?.id || category.name?.en || '-'}</div>
                      </td>
                      <td className="hidden whitespace-nowrap px-3 py-4 text-sm text-gray-900 sm:table-cell sm:px-6">
                        {category.parent_brief?.slug ?? "-"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 sm:px-6">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <DeleteButton onClick={() => handleDelete(category.id)} />
                          <EditButton onClick={() => handleEdit(category.id)} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              )}
            </div>
            <hr />

            {/* Footer: Pagination (3 kolom: text kiri, per-page tengah, nomor kanan) */}
            <div className="border-t border-gray-200 px-4 py-3">
              <Pagination
                totalItems={totalItems}
                page={currentPage}
                pageSize={itemsPerPage}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                pageSizeOptions={[10, 25, 50, 100]}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




