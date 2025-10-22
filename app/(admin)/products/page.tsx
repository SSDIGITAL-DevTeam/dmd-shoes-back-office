"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pagination } from "@/components/layout/Pagination";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { NewNounButton } from "@/components/ui/AddButton";
import {
  listProducts,
  type ProductItem,
  type ProductsResponse,
  safeText,
} from "@/services/products.service";
import { EditButton } from "@/components/ui/EditIcon";
import { DeleteButton } from "@/components/ui/DeleteIcon";
import api from "@/lib/fetching";

/** ======================
 *  Locale (sesuaikan)
 *  ====================== */
type Locale = "id" | "en";
const currentLocale: Locale = "id";

/** badge status union mengikuti komponen StatusBadge */
type BadgeStatus = "draft" | "active" | "publish" | "non-active";

/** Ubah apapun dari API jadi union untuk StatusBadge */
function resolveBadgeStatus(input: unknown): BadgeStatus {
  if (input === true || input === 1 || input === "1") return "active";
  if (input === false || input === 0 || input === "0") return "non-active";
  const str = String(input ?? "").trim().toLowerCase();
  if (str === "active" || str === "aktif") return "active";
  if (str === "inactive" || str === "non-active" || str === "non active")
    return "non-active";
  if (str === "publish") return "publish";
  if (str === "draft") return "draft";
  return "non-active";
}

/** ======================
 *  Helpers
 *  ====================== */
const STORAGE_BASE = (process.env.NEXT_PUBLIC_STORAGE_URL || "").replace(/\/$/, "");
const PLACEHOLDER = "/api/placeholder/50/50";

const toImageUrl = (raw?: string | null) => {
  if (!raw) return PLACEHOLDER;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (STORAGE_BASE) return `${STORAGE_BASE}/${String(raw).replace(/^\/+/, "")}`;
  return String(raw).startsWith("/") ? raw : `/${raw}`;
};

function useDebounce<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/** ======================
 *  Types kategori lokal
 *  ====================== */
type ApiCategory = {
  id: number;
  slug?: string;
  name?: { id?: string; en?: string } | string | null;
};

/** Helper nama kategori bilingual-safe (untuk daftar kategori global) */
function toCategoryText(cat?: ApiCategory | null): string {
  if (!cat) return "-";
  const t =
    safeText((cat as any).name, currentLocale) ||
    (typeof (cat as any).name === "string" ? (cat as any).name : "") ||
    cat.slug ||
    `Category ${cat.id}`;
  return t || "-";
}

/** Helper nama kategori dari item produk */
function categoryNameFromProduct(item: any, catMap: Record<number, string>): string {
  const direct = safeText(item?.category_name, currentLocale);
  if (direct) return direct;

  if (item?.category) {
    const asText =
      safeText(item.category?.name ?? item.category, currentLocale) ||
      (typeof item.category === "string" ? item.category : "");
    if (asText) return asText;
  }

  const cid = item?.category_id ?? item?.categoryId ?? item?.category_id_id ?? null;
  if (cid && catMap[cid]) return catMap[cid];

  const brief =
    safeText(item?.category_brief?.name, currentLocale) ||
    item?.category_brief?.slug;
  if (brief) return brief;

  return item?.category_slug || "-";
}

/** Sorter konsisten untuk "All" (desc by updated_at/created_at/id) */
function toTime(v: any): number {
  const t =
    v?.updated_at || v?.updatedAt || v?.created_at || v?.createdAt || null;
  const n = t ? Date.parse(t) : NaN;
  return Number.isNaN(n) ? 0 : n;
}
function toIdNum(v: any): number {
  const id = v?.id;
  if (typeof id === "number") return id;
  const n = Number(id);
  return Number.isFinite(n) ? n : 0;
}
function sortDescAll(a: any, b: any) {
  const ta = toTime(a);
  const tb = toTime(b);
  if (ta !== tb) return tb - ta; // newer first
  return toIdNum(b) - toIdNum(a); // bigger id first
}

/** ======================
 *  Case-insensitive NAME search helper
 *  ====================== */
const norm = (s?: string | null) => (s ?? "").toString().trim().toLowerCase();

/** Ambil "nama produk" untuk keperluan pencarian */
function getNameText(item: any): string {
  return (
    item?.name_text ||
    safeText(item?.name, currentLocale) ||
    safeText(item?.title, currentLocale) ||
    item?.slug ||
    String(item?.id ?? "")
  );
}

/** TRUE bila nama mengandung keyword (case-insensitive) */
function matchesName(item: any, keyword: string): boolean {
  if (!keyword) return true;
  const key = norm(keyword);
  return norm(getNameText(item)).includes(key);
}

/** ======================
 *  Komponen Utama
 *  ====================== */
type StatusFilter = "all" | "active" | "inactive";

export default function ProductsPage() {
  const router = useRouter();

  // data produk
  const [rows, setRows] = useState<ProductItem[]>([]);
  const [meta, setMeta] = useState<ProductsResponse["meta"] | null>(null);

  // data kategori (map id -> text)
  const [catMap, setCatMap] = useState<Record<number, string>>({});

  // ui
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // filters & pagination
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(12);
  const [searchValue, setSearchValue] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const debouncedSearch = useDebounce(searchValue, 500);

  // trigger refetch setelah delete
  const [refreshTick, setRefreshTick] = useState(0);

  /** 1) Load kategori sekali */
  useEffect(() => {
    let mounted = true;
    (async () => {
      async function tryFetch(url: string) {
        return api.get<any>(url, { params: { per_page: 1000 } });
      }
      try {
        let list: ApiCategory[] = [];
        try {
          const res1 = await tryFetch("/product-categories");
          const raw1 = (res1 as any)?.data ?? res1;
          list = Array.isArray(raw1?.data) ? raw1.data : Array.isArray(raw1) ? raw1 : [];
        } catch {
          const res2 = await tryFetch("/categories");
          const raw2 = (res2 as any)?.data ?? res2;
          list = Array.isArray(raw2?.data) ? raw2.data : Array.isArray(raw2) ? raw2 : [];
        }
        if (!mounted) return;
        const map: Record<number, string> = {};
        (list as ApiCategory[]).forEach((c) => {
          if (c && typeof c.id === "number") map[c.id] = toCategoryText(c);
        });
        setCatMap(map);
      } catch {
        if (mounted) setCatMap({});
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  /** Helper: ambil SEMUA halaman untuk status tertentu (active/inactive). */
  async function fetchAllByStatus(status: "active" | "inactive", search?: string) {
    const perPage = 100; // minta cukup besar; backend bisa override limit
    let current = 1;
    let lastPage = 1;
    let total = 0;
    const acc: any[] = [];

    while (current <= lastPage) {
      const res = await listProducts({
        page: current,
        perPage,
        status: status as any,
        search,
      });
      const list = Array.isArray(res?.data) ? res.data : [];
      acc.push(...list);
      total = res?.meta?.total ?? acc.length;
      lastPage = res?.meta?.last_page ?? current; // fallback bila meta kosong
      current += 1;
      if (!res?.meta) break; // kalau backend tidak kirim meta, anggap 1 halaman saja
    }
    return { items: acc, total };
  }

  /** 2) Ambil produk */
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        const q = debouncedSearch || undefined;

        if (statusFilter === "all") {
          // === ALL: gabungkan SEMUA active + inactive ===
          const [act, inact] = await Promise.all([
            fetchAllByStatus("active", q),
            fetchAllByStatus("inactive", q),
          ]);

          if (!mounted) return;

          let merged = [...act.items, ...inact.items];

          if (debouncedSearch) {
            merged = merged.filter((it) => matchesName(it, debouncedSearch));
          }

          merged.sort(sortDescAll);

          const total = merged.length;
          const offset = (page - 1) * pageSize;
          const paged = merged.slice(offset, offset + pageSize);

          setRows(paged as any);
          setMeta({
            current_page: page,
            per_page: pageSize,
            total,
            last_page: Math.max(1, Math.ceil(total / pageSize)),
          } as any);
        } else {
          // === FILTER SPESIFIK: active/inactive (boleh pakai pagination backend)
          const res = await listProducts({
            page,
            perPage: pageSize,
            search: q,
            status: statusFilter as any,
          });

          if (!mounted) return;

          let list = Array.isArray(res?.data) ? res.data : [];
          if (debouncedSearch) {
            list = list.filter((it) => matchesName(it, debouncedSearch));
          }

          setRows(list as any);
          setMeta(
            res?.meta
              ? {
                  ...res.meta,
                  total: res.meta?.total ?? list.length,
                  last_page:
                    res.meta?.last_page ??
                    Math.max(1, Math.ceil((res.meta?.total ?? list.length) / (res.meta?.per_page || pageSize))),
                }
              : {
                  current_page: page,
                  per_page: pageSize,
                  total: list.length,
                  last_page: Math.max(1, Math.ceil(list.length / pageSize)),
                }
          );
        }
      } catch (err: any) {
        if (!mounted) return;
        setRows([]);
        setMeta({
          current_page: 1,
          per_page: pageSize,
          total: 0,
          last_page: 1,
        } as any);
        setErrorMsg(
          err?.response?.data?.message || err?.message || "Gagal memuat produk."
        );
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
    // ⬇️ refreshTick ditambahkan agar fetch jalan ulang setelah delete
  }, [statusFilter, page, pageSize, debouncedSearch, refreshTick]);

  // reset page ketika statusFilter atau keyword berubah
  useEffect(() => {
    setPage(1);
  }, [statusFilter, debouncedSearch]);

  const totalItems = meta?.total ?? 0;

  /** 3) Map ke bentuk display */
  type DisplayProduct = {
    id: number | string;
    nameText: string;
    categoryText: string;
    brandText: string;
    badge: BadgeStatus;
    coverUrl: string;
  };

  const displayProducts = useMemo<DisplayProduct[]>(() => {
    return rows.map((item: any) => {
      const nameText =
        item?.name_text ||
        safeText(item?.name, currentLocale) ||
        safeText(item?.title, currentLocale) ||
        `${item?.slug ?? item?.id}`;

      const brandText =
        safeText(item?.brand?.name ?? item?.brand, currentLocale) || "-";

      const badge = resolveBadgeStatus(
        item?.status ?? item?.published ?? item?.is_active
      );

      const coverUrl = toImageUrl(
        item?.cover_url ??
          item?.image_url ??
          item?.thumbnail_url ??
          item?.cover ??
          null
      );

      const categoryText = categoryNameFromProduct(item, catMap);

      return {
        id: item?.id,
        nameText,
        categoryText,
        brandText,
        badge,
        coverUrl,
      };
    });
  }, [rows, catMap]);

  const pageSizeOptions = useMemo(() => {
    const base = new Set<number>([12, 24, 48]);
    base.add(pageSize);
    return Array.from(base).sort((a, b) => a - b);
  }, [pageSize]);

  const handleCreate = () => router.push("/products/create");
  // pastikan path edit sesuai route kamu. Umumnya: /products/[id]/edit
  const handleEdit = (id: number | string) => router.push(`/products/edit/${id}`);

  // ===== REFRESH SETELAH DELETE =====
  const refetchAfterDelete = () => {
    // cukup picu ulang useEffect fetch
    setRefreshTick((t) => t + 1);
  };

  const handleDelete = async (id: number | string) => {
    const ok = window.confirm("Hapus produk ini?");
    if (!ok) return;
    try {
      await api.delete(`/products/${id}`);

      // Jika item yang tersisa di halaman tinggal 1 (yang dihapus), dan bukan halaman pertama:
      const isLastItemOnPage = rows.length === 1;
      const currentPage = meta?.current_page ?? page;

      if (isLastItemOnPage && currentPage > 1) {
        // mundur 1 halaman; useEffect akan refetch otomatis
        setPage(currentPage - 1);
      } else {
        // tetap di halaman sekarang; paksa refetch
        refetchAfterDelete();
      }
    } catch (err: any) {
      alert(
        err?.response?.data?.message ||
          err?.message ||
          "Gagal menghapus produk."
      );
    }
  };

  return (
    <div className="min-h-full">
      {/* Breadcrumb / top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center text-sm text-gray-500">
          <span>Products</span>
          <span className="mx-2 text-gray-300">›</span>
          <span className="text-gray-600">List</span>
        </div>
      </div>

      {/* Title + Add */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
          <NewNounButton noun="product" onClick={handleCreate} />
        </div>
      </div>

      {/* Content */}
      <div className="bg-gray-50">
        <div className="px-6 py-6">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-3">
              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`rounded-lg px-3 py-1.5 text-sm ${
                    statusFilter === "all"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter("active")}
                  className={`rounded-lg px-3 py-1.5 text-sm ${
                    statusFilter === "active"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setStatusFilter("inactive")}
                  className={`rounded-lg px-3 py-1.5 text-sm ${
                    statusFilter === "inactive"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Inactive
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <input
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Search"
                  aria-label="Cari produk"
                  className="w-64 rounded-lg border border-gray-300 text-black py-2 pl-9 pr-3 text-sm placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            </div>

            {/* Error */}
            {errorMsg ? (
              <div
                className="mx-4 mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                role="alert"
              >
                {errorMsg}
              </div>
            ) : null}

            {/* Table */}
            <div className="overflow-x-auto">
              <table
                className="min-w-full divide-y divide-gray-200"
                aria-label="Daftar produk"
                aria-busy={loading}
              >
                <caption className="sr-only">Daftar produk</caption>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-12 px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-6">
                      #
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-6">
                      Cover
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-6">
                      Nama Produk
                    </th>
                    <th className="hidden px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:table-cell sm:px-6">
                      Kategori
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-6">
                      Status
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-6">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-3 py-6 text-center text-sm text-gray-500 sm:px-6"
                      >
                        Memuat produk...
                      </td>
                    </tr>
                  ) : displayProducts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-3 py-6 text-center text-sm text-gray-500 sm:px-6"
                      >
                        Tidak ada produk ditemukan
                      </td>
                    </tr>
                  ) : (
                    displayProducts.map((p, idx) => {
                      const seq =
                        ((meta?.current_page ?? 1) - 1) *
                          (meta?.per_page ?? pageSize) +
                        (idx + 1);

                      return (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600 sm:px-6">
                            {seq}
                          </td>

                          <td className="px-3 py-4 sm:px-6">
                            <div className="h-12 w-12 overflow-hidden rounded bg-gray-200">
                              <img
                                src={p.coverUrl || PLACEHOLDER}
                                alt={`Cover ${p.nameText || "Product"}`}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src =
                                    PLACEHOLDER;
                                }}
                                loading="lazy"
                                decoding="async"
                              />
                            </div>
                          </td>

                          <td className="px-3 py-4 sm:px-6">
                            <div className="max-w-xs truncate text-sm font-medium text-gray-900">
                              {p.nameText}
                            </div>
                            <div className="mt-0.5 hidden text-xs text-gray-500 sm:block">
                              {p.brandText !== "-" ? p.brandText : ""}
                            </div>
                          </td>

                          <td className="hidden whitespace-nowrap px-3 py-4 text-sm text-gray-900 sm:table-cell sm:px-6">
                            {p.categoryText}
                          </td>

                          <td className="whitespace-nowrap px-3 py-4 sm:px-6">
                            <StatusBadge status={p.badge} />
                          </td>

                          <td className="whitespace-nowrap px-3 py-4 sm:px-6">
                            <div className="flex items-center gap-3 sm:gap-4">
                              <EditButton onClick={() => handleEdit(p.id)} />
                              <DeleteButton onClick={() => handleDelete(p.id)} />
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer pagination */}
            <div className="border-t border-gray-200 px-4 py-3">
              <Pagination
                totalItems={totalItems}
                page={meta?.current_page ?? page}
                pageSize={meta?.per_page ?? pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={pageSizeOptions}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}