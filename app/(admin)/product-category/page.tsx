// app/(admin)/product-category/page.tsx
"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { NewNounButton } from "@/components/ui/AddButton";
import { EditButton } from "@/components/ui/EditIcon";
import { DeleteButton } from "@/components/ui/DeleteIcon";
import { Pagination } from "@/components/layout/Pagination";
import { useRouter } from "next/navigation";

type ParentFilter = "all" | "has-parent" | "no-parent";
type SortDir = "asc" | "desc"; // tetap dipertahankan kalau suatu saat butuh; tidak dipakai untuk created_at

type ApiCategory = {
  id: number;
  parent_id: number | null;
  name?: { id?: string; en?: string } | string;
  name_text?: string;
  slug?: string;
  status?: boolean;
  cover?: string | null;
  cover_url?: string | null;
  parent_brief?: { id: number; slug: string; name?: { id?: string; en?: string } } | null;
  created_at?: string;   // ⟵ tambahkan kemungkinan field waktu
  createdAt?: string;    // ⟵ variasi penamaan
  updated_at?: string;
  updatedAt?: string;
};

const withNoCache = (url: string) => `${url}${url.includes("?") ? "&" : "?"}_=${Date.now()}`;

async function fetchJSON(input: string, init?: RequestInit) {
  const headers = new Headers(init?.headers || {});
  headers.set("Accept", "application/json");
  headers.set("X-Requested-With", "XMLHttpRequest");
  const res = await fetch(input, { ...init, headers, credentials: "include", cache: "no-store" });
  const text = await res.text().catch(() => "");
  const data = text ? JSON.parse(text) : {};
  return { ok: res.ok, status: res.status, data };
}

/** ===== Helpers sort by created DESC (terbaru dulu) ===== */
const toTime = (c: Partial<ApiCategory>): number => {
  const raw = c.created_at || c.createdAt || c.updated_at || c.updatedAt || null;
  if (!raw) return 0;
  const n = Date.parse(raw);
  return Number.isNaN(n) ? 0 : n;
};
const toIdNum = (c: Partial<ApiCategory>): number => {
  const n = Number(c.id);
  return Number.isFinite(n) ? n : 0;
};
/** Sorter: created time desc, tie-breaker: id desc */
const sortByNewest = (a: ApiCategory, b: ApiCategory) => {
  const ta = toTime(a);
  const tb = toTime(b);
  if (ta !== tb) return tb - ta;           // newer first
  return toIdNum(b) - toIdNum(a);          // bigger id first
};

export default function ProductCategoryPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // filters
  const [query, setQuery] = useState("");
  const [parentFilter, setParentFilter] = useState<ParentFilter>("all");
  const [sortDir, setSortDir] = useState<SortDir>("asc"); // tetap ada tapi tidak mempengaruhi urutan created

  // pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // fetch helper
  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Ambil semua (perPage besar) lalu sort di klien by created desc
      const res = await fetchJSON(withNoCache(`/api/category?perPage=1000&status=all`));
      const data = res.data?.data ?? res.data ?? [];
      setCategories(Array.isArray(data) ? (data as ApiCategory[]) : []);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  // refetch saat kembali dari edit/create
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

  const processed = useMemo(() => {
    let data = [...categories];

    // search
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      data = data.filter((c) => {
        const nameStr =
          typeof c.name === "string"
            ? c.name
            : (c.name?.id || c.name_text || c.slug || c.name?.en || "");
        return (nameStr || "").toLowerCase().includes(q);
      });
    }

    // parent filter
    if (parentFilter !== "all") {
      data = data.filter((c) => (parentFilter === "has-parent" ? c.parent_id != null : c.parent_id == null));
    }

    // === POIN UTAMA: urutkan berdasarkan yang PALING BARU (created desc) ===
    data.sort(sortByNewest);

    return data;
  }, [categories, query, parentFilter /* sortDir tidak digunakan untuk created */]);

  const totalItems = processed.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCategories = processed.slice(startIndex, endIndex);

  const handlePageChange = (p: number) => setCurrentPage(p);
  const handlePageSizeChange = (n: number) => { setItemsPerPage(n); setCurrentPage(1); };
  React.useEffect(() => setCurrentPage(1), [query, parentFilter]);

  const handleNewCategory = () => router.push("/product-category");
  const handleEdit = (id: number) => {
    router.push(`/product-category/edit/${id}`);
    router.refresh();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      await fetch(`/api/category/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: new Headers({ "X-Requested-With": "XMLHttpRequest", Accept: "application/json" }),
        cache: "no-store",
      });
      await loadCategories(); // fresh after delete
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to delete");
      await loadCategories();
    }
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
          <NewNounButton noun="Category" onClick={() => router.push("/product-category/create")} />
        </div>
      </div>

      {/* Main */}
      <div className="bg-gray-50">
        <div className="px-6 py-6">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            {/* Card toolbar */}
            <div className="flex items-center justify-end gap-2 border-b border-gray-200 px-4 py-3">
              {/* Search */}
              <div className="relative">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search"
                  className="w-56 rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm text-black placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <svg
                  className="absolute left-3 top-2.5 h-4 w-4 text-black"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M16 10a6 6 0 1 0-12 0a6 6 0 0 0 12 0Z" />
                </svg>
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
                        </div>
                      </th>
                      <th className="hidden px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:table-cell sm:px-6">
                        <div className="flex items-center gap-1">
                          <span>Parent Category</span>
                        </div>
                      </th>
                      <th className="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-6">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200">
                    {currentCategories.map((category) => {
                      const nameStr =
                        typeof category.name === "string"
                          ? category.name
                          : (category.name?.id || category.name_text || category.slug || category.name?.en || "-");

                      return (
                        <tr key={category.id} className="hover:bg-gray-50 bg-white">
                          <td className="whitespace-nowrap px-3 py-4 sm:px-6">
                            <input type="checkbox" className="rounded border-gray-300" />
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 sm:px-6">
                            <div className="h-12 w-12 overflow-hidden rounded bg-gray-200">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={category.cover_url || category.cover || "/api/placeholder/50/50"}
                                alt="Category cover"
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src =
                                    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIGZpbGw9IiNGM0Y0RjYiLz48cGF0aCBkPSJNMjQgMzZDMzAuNjI3NCAzNiAzNiAzMC42Mjc0IDM2IDI0QzM2IDE3LjM3MjYgMzAuNjI3NCAxMiAyNCAxMkMxNy4zNzI2IDEyIDEyIDE3LjM3MjYgMTIgMjRDMTIgMzAuNjI3NiAxNy4zNzI2IDM2IDI0IDM2WiIgc3Ryb2tlPSIjOUNBM0FGIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNMjQgMjhDMjYuMjA5MSAyOCAyOCAyNi4yMDkxIDI4IDI0QzI4IDIxLjc5MDkgMjYuMjA5MSAyMCAyNCAyMEMyMS43OTA5IDIwIDIwIDIxLjc5MDkgMjAgMjRDMjAgMjYuMjA5MSAyMS43OTA5IDI4IDI0IDI4WiIgc3Ryb2tlPSIjOUNBM0FGIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=";
                                }}
                              />
                            </div>
                          </td>
                          <td className="px-3 py-4 sm:px-6">
                            <div className="max-w-xs truncate text-sm font-medium text-gray-900">{nameStr}</div>
                          </td>
                          <td className="hidden whitespace-nowrap px-3 py-4 text-sm text-gray-900 sm:table-cell sm:px-6">
                            {category.parent_brief?.slug || "-"}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 sm:px-6">
                            <div className="flex items-center justify-center gap-3 sm:gap-4">
                              <DeleteButton onClick={() => handleDelete(category.id)} />
                              <EditButton onClick={() => handleEdit(category.id)} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <hr />

            {/* Footer: Pagination */}
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