"use client";

import React, { useEffect, useMemo, useState } from "react";
import { NewNounButton } from "@/components/ui/AddButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { EditButton } from "@/components/ui/EditIcon";
import { DeleteButton } from "@/components/ui/DeleteIcon";
import { Pagination } from "@/components/layout/Pagination";
import api from "@/lib/fetching";
import { Toast } from "@/components/ui/Toast";

type ArticleItem = {
  id: number;
  cover_url?: string;
  author_name?: string;
  status: "publish" | "draft" | string;
  published: boolean;
  title_text?: string;
};

type ArticlesResponse = {
  status: string;
  message?: string;
  data: ArticleItem[];
  meta: { current_page: number; per_page: number; total: number; last_page: number };
};

export default function ArticlesPage() {
  // sumber data mentah seluruh artikel
  const [allRows, setAllRows] = useState<ArticleItem[]>([]);
  // ui state
  const [activeFilter, setActiveFilter] = useState<"All" | "Publish" | "Draft">("All");
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ show: boolean; msg: string; variant?: "success" | "error" }>({ show: false, msg: "" });

  // Fetch sekali: ambil "semua" artikel (atau sebanyak mungkin)
  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get<ArticlesResponse>("/articles", {
          params: { page: 1, per_page: 1000 }, // ambil banyak agar bisa difilter lokal
        });
        setAllRows(Array.isArray(data.data) ? data.data : []);
      } catch (e: any) {
        setError(e?.message || "Gagal memuat artikel");
        setAllRows([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  // Filter lokal (status + search)
  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = allRows;

    if (activeFilter === "Publish") {
      list = list.filter(a => String(a.status).toLowerCase() === "publish" || a.published === true);
    } else if (activeFilter === "Draft") {
      list = list.filter(a => String(a.status).toLowerCase() === "draft" || a.published === false);
    }

    if (q) {
      list = list.filter(a => {
        const title = (a.title_text || "").toLowerCase();
        const author = (a.author_name || "").toLowerCase();
        return title.includes(q) || author.includes(q);
      });
    }

    return list;
  }, [allRows, activeFilter, query]);

  // Pagination lokal dari filteredRows
  const totalItems = filteredRows.length;
  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredRows.slice(start, end);
  }, [filteredRows, currentPage, itemsPerPage]);

  // Reset halaman saat ganti filter / query
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, query]);

  // Toggle publish (lokal saja—tidak call API)
  const handleTogglePublish = (id: number) => {
    setAllRows(prev =>
      prev.map(a =>
        a.id === id
          ? { ...a, published: !a.published, status: !a.published ? "publish" : "draft" }
          : a
      )
    );
  };

  const handleEdit = (id: number) => {
    window.location.href = `/articles/edit/${id}`;
  };

  const handleDelete = async (id: number) => {
    const ok = window.confirm("Hapus artikel ini?");
    if (!ok) return;
    try {
      await api.delete(`/articles/${id}`);
      setToast({ show: true, msg: "Artikel berhasil dihapus", variant: "success" });
      // hapus dari sumber data lokal
      setAllRows(prev => prev.filter(a => a.id !== id));
      // jika halaman jadi kosong, geser ke halaman sebelumnya
      const after = filteredRows.length - 1;
      const maxPage = Math.max(1, Math.ceil(after / itemsPerPage));
      if (currentPage > maxPage) setCurrentPage(maxPage);
    } catch (e: any) {
      setToast({ show: true, msg: e?.message || "Gagal menghapus artikel", variant: "error" });
    }
  };

  const handleNewArticle = () => (window.location.href = "/articles/add");

  const handlePageChange = (p: number) => setCurrentPage(p);
  const handlePageSizeChange = (n: number) => {
    setItemsPerPage(n);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-full">
      {/* Breadcrumb */}
      <div className="px-6 py-3 border-b border-gray-200 bg-white">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <span>Articles</span>
          <span className="text-gray-300">›</span>
          <span className="text-gray-600">List</span>
        </nav>
      </div>

      {/* Header */}
      <div className="px-6 py-6 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Articles</h1>
          <NewNounButton noun="article" onClick={handleNewArticle} />
        </div>

        {/* Filter pills */}
        <div className="mt-6 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-gray-100/60 p-1">
            {(["All", "Publish", "Draft"] as const).map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={[
                  "rounded-full px-4 py-1.5 text-sm font-medium transition",
                  activeFilter === f ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700",
                ].join(" ")}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 bg-gray-50">
        <div className="px-6 py-6">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            {/* Toolbar kanan */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-200">
              <div className="flex items-center gap-3" />
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search"
                    className="w-56 rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                </div>
              </div>
            </div>

            {error && (
              <div className="mx-4 my-3 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700" role="alert">
                {error}
              </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-12 px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cover</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        <span>Title</span>
                        <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4M8 15l4 4 4-4"/>
                        </svg>
                      </div>
                    </th>
                    <th className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        <span>Author</span>
                        <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4M8 15l4 4 4-4"/>
                        </svg>
                      </div>
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        <span>Published</span>
                        <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4M8 15l4 4 4-4"/>
                        </svg>
                      </div>
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    Array.from({ length: Math.min(itemsPerPage, 10) }).map((_, idx) => (
                      <tr key={`sk-${idx}`} className="animate-pulse">
                        <td className="px-3 sm:px-6 py-4"><div className="h-4 w-4 rounded bg-gray-200" /></td>
                        <td className="px-3 sm:px-6 py-4"><div className="h-12 w-12 rounded bg-gray-200" /></td>
                        <td className="px-3 sm:px-6 py-4"><div className="h-4 w-56 rounded bg-gray-200" /></td>
                        <td className="hidden sm:table-cell px-3 sm:px-6 py-4"><div className="h-4 w-32 rounded bg-gray-200" /></td>
                        <td className="px-3 sm:px-6 py-4"><div className="h-6 w-20 rounded bg-gray-200" /></td>
                        <td className="px-3 sm:px-6 py-4"><div className="h-6 w-16 rounded bg-gray-200" /></td>
                        <td className="px-3 sm:px-6 py-4"><div className="h-6 w-20 rounded bg-gray-200" /></td>
                      </tr>
                    ))
                  ) : pageRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 sm:px-6 py-10 text-center text-gray-500">Tidak ada artikel</td>
                    </tr>
                  ) : (
                    pageRows.map(article => (
                      <tr key={article.id} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-6 py-4"><input type="checkbox" className="rounded border-gray-300" /></td>
                        <td className="px-3 sm:px-6 py-4">
                          <div className="h-10 w-10 sm:h-12 sm:w-12 overflow-hidden rounded bg-gray-200">
                            <img
                              src={article.cover_url || "/api/placeholder/50/50"}
                              alt="cover"
                              className="h-full w-full object-cover"
                              onError={e => {
                                e.currentTarget.src =
                                  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIGZpbGw9IiNGM0Y0RjYiLz48cGF0aCBkPSJNMjQgMzZDMzAuNjI3NCAzNiAzNiAzMC42Mjc0IDM2IDI0QzM2IDE3LjM3MjYgMzAuNjI3NCAxMiAyNCAxMkMxNy4zNzI2IDEyIDEyIDE3LjM3MjYgMTIgMjRDMTIgMzAuNjI3NiAxNy4zNzI2IDM2IDI0IDM2WiIgc3Ryb2tlPSIjOUNBM0FGIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNMjQgMjhDMjYuMjA5MSAyOCAyOCAyNi4yMDkxIDI4IDI0QzI4IDIxLjc5MDkgMjYuMjA5MSAyMCAyNCAyMEMyMS43OTA5IDIwIDIwIDIxLjc5MDkgMjAgMjRDMjAgMjYuMjA5MSAyMS43OTA5IDI4IDI0IDI4WiIgc3Ryb2tlPSIjOUNBM0FGIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=";
                              }}
                            />
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4">
                          <div className="max-w-xs truncate text-sm font-medium text-gray-900">{article.title_text}</div>
                        </td>
                        <td className="hidden sm:table-cell px-3 sm:px-6 py-4">
                          <div className="text-sm text-gray-900">{article.author_name}</div>
                        </td>
                        <td className="px-3 sm:px-6 py-4"><StatusBadge status={article.status as any} /></td>
                        <td className="px-3 sm:px-6 py-4"><ToggleSwitch checked={!!article.published} onChange={() => handleTogglePublish(article.id)} /></td>
                        <td className="px-3 sm:px-6 py-4">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <EditButton onClick={() => handleEdit(article.id)} />
                            <DeleteButton onClick={() => handleDelete(article.id)} />
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
                totalItems={totalItems}
                page={currentPage}
                pageSize={itemsPerPage}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                pageSizeOptions={[10, 25, 50]}
              />
            </div>
          </div>
        </div>
      </div>

      <Toast show={toast.show} message={toast.msg} variant={toast.variant} onClose={() => setToast({ show: false, msg: "" })} />
    </div>
  );
}