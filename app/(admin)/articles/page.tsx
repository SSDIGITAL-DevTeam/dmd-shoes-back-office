"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { NewNounButton } from "@/components/ui/AddButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { EditButton } from "@/components/ui/EditIcon";
import { DeleteButton } from "@/components/ui/DeleteIcon";
import { Pagination } from "@/components/layout/Pagination";
import { Toast } from "@/components/ui/Toast";
import Image from "next/image";

import {
  listArticles,
  deleteArticle as deleteArticleSvc,
  toggleArticle,
  type ArticleItem,
  type ListResponse,
} from "@/services/articles.service";

/** debounce helper */
function useDebounced<T>(value: T, delay = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export default function ArticlesPage() {
  // server data
  const [rows, setRows] = useState<ArticleItem[]>([]);
  const [meta, setMeta] = useState<{ total: number; current_page: number; last_page: number }>({
    total: 0,
    current_page: 1,
    last_page: 1,
  });

  // ui state
  const [activeFilter, setActiveFilter] = useState<"All" | "Publish" | "Draft">("All");
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounced(query, 350);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ show: boolean; msg: string; variant?: "success" | "error" }>({
    show: false,
    msg: "",
  });

  // --- effect untuk baca ?msg= dan hapus query ---
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const msg = sp.get("msg");
    if (!msg) return;

    if (msg === "published") {
      setToast({ show: true, msg: "Artikel berhasil dipublish", variant: "success" });
    } else if (msg === "draft") {
      setToast({ show: true, msg: "Draft tersimpan", variant: "success" });
    }

    // bersihkan URL
    window.history.replaceState(null, "", "/articles");
  }, []);

  // simpan controller biar bisa cancel fetch ketika param berubah cepat
  const abortRef = useRef<AbortController | null>(null);

  /** map filter UI -> status backend */
  const statusParam = useMemo<"publish" | "draft" | undefined>(() => {
    if (activeFilter === "Publish") return "publish";
    if (activeFilter === "Draft") return "draft";
    return undefined;
  }, [activeFilter]);

  /** fetch dari backend (server-driven pagination + filter + search) */
  const fetchArticles = async () => {
    abortRef.current?.abort();
    const ctl = new AbortController();
    abortRef.current = ctl;

    setLoading(true);
    setError(null);
    try {
      const res: ListResponse<ArticleItem> = await listArticles({
        page: currentPage,
        perPage: itemsPerPage,
        search: debouncedQuery,
        status: statusParam,
        lang: "id", // opsional
      });

      if (ctl.signal.aborted) return;

      setRows(Array.isArray(res?.data) ? res.data : []);
      setMeta({
        total: res?.meta?.total ?? 0,
        current_page: res?.meta?.current_page ?? 1,
        last_page: res?.meta?.last_page ?? 1,
      });
    } catch (e: any) {
      if (ctl.signal.aborted) return;
      setRows([]);
      setMeta({ total: 0, current_page: 1, last_page: 1 });
      setError(e?.message || "Gagal memuat artikel");
    } finally {
      if (!abortRef.current?.signal.aborted) setLoading(false);
    }
  };

  /** trigger fetch saat param berubah */
  useEffect(() => {
    fetchArticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage, debouncedQuery, statusParam]);

  /** reset ke page 1 saat filter/search berubah agar hasilnya masuk halaman pertama */
  useEffect(() => {
    setCurrentPage(1);
  }, [statusParam, debouncedQuery]);

  // di ArticlesPage component:
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());

  const handleTogglePublish = async (id: number) => {
    const target = rows.find(r => r.id === id);
    if (!target) return;

    // state baru yang akan di-set
    const nextPublished = !Boolean(target.published);
    const nextStatus: "publish" | "draft" = nextPublished ? "publish" : "draft";

    // optimistic update
    setRows(prev =>
      prev.map(a => a.id === id ? { ...a, published: nextPublished, status: nextStatus } : a)
    );
    setTogglingIds(prev => new Set(prev).add(id));

    try {
      // panggil Next route -> Laravel PATCH /api/v1/articles/{id}/status
      await toggleArticle(id, { status: nextStatus, published: nextPublished, lang: "id" });

      // optional: refetch biar meta sinkron/ikut format backend
      await fetchArticles();
      setToast({ show: true, msg: "Status artikel diperbarui", variant: "success" });
    } catch (e: any) {
      // rollback kalau gagal
      setRows(prev =>
        prev.map(a => a.id === id ? { ...a, published: !nextPublished, status: target.status } : a)
      );
      setToast({ show: true, msg: e?.message || "Gagal memperbarui status", variant: "error" });
    } finally {
      setTogglingIds(prev => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
    }
  };

  const handleEdit = (id: number) => {
    window.location.href = `/articles/edit/${id}`;
  };

  const refetchAfterDeleteIfNeeded = (remainingItemsOnThisPage: number) => {
    // kalau halaman jadi kosong dan masih punya halaman sebelumnya, geser 1 halaman dan refetch
    const willBeEmpty = remainingItemsOnThisPage === 0 && currentPage > 1;
    if (willBeEmpty) {
      setCurrentPage(p => Math.max(1, p - 1));
      // fetchArticles akan otomatis terpanggil oleh useEffect currentPage
    } else {
      // tetap di halaman ini tapi refetch biar meta/rows sinkron
      fetchArticles();
    }
  };

  const handleDelete = async (id: number) => {
    const ok = window.confirm("Hapus artikel ini?");
    if (!ok) return;
    try {
      await deleteArticleSvc(id);
      setToast({ show: true, msg: "Artikel berhasil dihapus", variant: "success" });

      // hitung sisa item di halaman ini setelah delete
      const remaining = rows.length - 1;
      refetchAfterDeleteIfNeeded(remaining);
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
                          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4M8 15l4 4 4-4" />
                        </svg>
                      </div>
                    </th>
                    <th className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        <span>Author</span>
                        <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4M8 15l4 4 4-4" />
                        </svg>
                      </div>
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        <span>Published</span>
                        <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4M8 15l4 4 4-4" />
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
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 sm:px-6 py-10 text-center text-gray-500">
                        Tidak ada artikel
                      </td>
                    </tr>
                  ) : (
                    rows.map(article => (
                      <tr key={article.id} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-6 py-4">
                          <input type="checkbox" className="rounded border-gray-300" />
                        </td>
                        <td className="px-3 sm:px-6 py-4">
                          <div className="relative h-10 w-10 sm:h-12 sm:w-12 overflow-hidden rounded bg-gray-200">
                            {article.cover_url && (
                              <Image
                                src={article.cover_url}
                                alt="cover"
                                fill
                                sizes="48px"
                                style={{ objectFit: "cover" }}
                              />
                            )}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4">
                          <div className="max-w-xs truncate text-sm font-medium text-gray-900">{article.title_text}</div>
                        </td>
                        <td className="hidden sm:table-cell px-3 sm:px-6 py-4">
                          <div className="text-sm text-gray-900">{article.author_name}</div>
                        </td>
                        <td className="px-3 sm:px-6 py-4">
                          <StatusBadge status={article.status as any} />
                        </td>
                        <td className="px-3 sm:px-6 py-4">
                          <ToggleSwitch
                            checked={!!article.published}
                            disabled={togglingIds.has(article.id)}
                            aria-busy={togglingIds.has(article.id)}
                            onChange={(_checked) => handleTogglePublish(article.id)}
                          />
                        </td>
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
                totalItems={meta.total}
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

      <Toast
        show={toast.show}
        message={toast.msg}
        variant={toast.variant}
        onClose={() => setToast({ show: false, msg: "" })}
      />
    </div>
  );
}