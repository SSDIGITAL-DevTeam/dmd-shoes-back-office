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
  if (str === "active") return "active";
  if (str === "inactive" || str === "non-active" || str === "non active")
    return "non-active";
  if (str === "publish") return "publish";
  if (str === "draft") return "draft";
  return "non-active";
}

/** ======================
 *  Helpers
 *  ====================== */
const STORAGE_BASE = (process.env.NEXT_PUBLIC_STORAGE_URL || "").replace(
  /\/$/,
  ""
);
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
type LangText = { id?: string; en?: string } | string | null | undefined;

type ApiCategory = {
  id: number;
  slug?: string;
  name?: { id?: string; en?: string } | string | null;
};

/** Helper nama kategori bilingual-safe */
function toCategoryText(cat?: ApiCategory | null): string {
  if (!cat) return "-";
  const t =
    safeText((cat as any).name, currentLocale) ||
    (typeof (cat as any).name === "string" ? (cat as any).name : "") ||
    cat.slug ||
    `Category ${cat.id}`;
  return t || "-";
}

/** ======================
 *  Komponen Utama
 *  ====================== */
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
  const debouncedSearch = useDebounce(searchValue, 500);

  /** ─────────────────────────────────────────────
   *  1) Load kategori sekali (status=all; per_page besar)
   *  ───────────────────────────────────────────── */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // coba ambil semua kategori; backend kamu biasa pakai per_page
        const res = await api.get<{
          status?: string;
          data?: ApiCategory[];
          meta?: { total?: number };
        }>("/categories", { params: { status: "all", per_page: 1000 } });

        if (!mounted) return;

        const list = Array.isArray(res?.data) ? res.data : [];
        const map: Record<number, string> = {};
        list.forEach((c) => {
          map[c.id] = toCategoryText(c);
        });
        setCatMap(map);
      } catch {
        // abaikan error — fallback nanti pakai "-" / slug dari produk
        setCatMap({});
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  /** ─────────────────────────────────────────────
   *  2) Ambil produk ACTIVE + INACTIVE → gabung → virtual paginate
   *  ───────────────────────────────────────────── */
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        const take = Math.max(page, 1) * pageSize;
        const q = debouncedSearch || undefined;

        const [resActive, resInactive] = await Promise.all([
          listProducts({
            page: 1,
            perPage: take,
            search: q,
            status: "active" as any,
          }),
          listProducts({
            page: 1,
            perPage: take,
            search: q,
            status: "inactive" as any,
          }),
        ]);

        if (!mounted) return;

        const a = Array.isArray(resActive?.data) ? resActive.data : [];
        const b = Array.isArray(resInactive?.data) ? resInactive.data : [];

        const combined = [...a, ...b];
        // optional sort: combined.sort((x: any, y: any) => Number(y.id) - Number(x.id));

        const totalActive = resActive?.meta?.total ?? a.length;
        const totalInactive = resInactive?.meta?.total ?? b.length;
        const totalItems = totalActive + totalInactive;

        const lastPage = Math.max(1, Math.ceil(totalItems / pageSize));
        const currentPage = Math.min(Math.max(page, 1), lastPage);
        const start = (currentPage - 1) * pageSize;
        const end = start + pageSize;

        setRows(combined.slice(start, end));
        setMeta({
          current_page: currentPage,
          per_page: pageSize,
          total: totalItems,
          last_page: lastPage,
        } as any);
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
  }, [page, pageSize, debouncedSearch]);

  const totalItems = meta?.total ?? 0;

  /** ─────────────────────────────────────────────
   *  3) Map ke bentuk display (resolve kategori dari produk/Map)
   *  ───────────────────────────────────────────── */
  type DisplayProduct = {
    id: number | string;
    nameText: string;
    categoryText: string;
    brandText: string;
    badge: BadgeStatus;
    coverUrl: string;
  };

  const displayProducts = useMemo<DisplayProduct[]>(() => {
    return rows.map((item) => {
      const nameText =
        safeText((item as any).name, currentLocale) ||
        safeText((item as any).title, currentLocale) ||
        `${(item as any).slug ?? (item as any).id}`;

      // ① kalau response produk sudah menyertakan objek category → pakai itu
      let categoryText =
        safeText((item as any).category, currentLocale) ||
        (typeof (item as any).category === "string"
          ? (item as any).category
          : "");

      // ② kalau belum ada, cek category_id dan map kategori hasil fetch
      const cid =
        (item as any).category_id ??
        (item as any).categoryId ??
        (item as any).category_id_id; // jaga-jaga variasi
      if ((!categoryText || categoryText === "-") && cid && catMap[cid]) {
        categoryText = catMap[cid];
      }

      // ③ fallback terakhir: coba "category_brief" / "parent_brief"
      if (!categoryText || categoryText === "-") {
        categoryText =
          safeText((item as any).category_brief?.name, currentLocale) ||
          (item as any).category_brief?.slug ||
          "-";
      }

      const brandText = safeText((item as any).brand, currentLocale) || "-";

      const rawStatus =
        (item as any).status ??
        (item as any).published ??
        (item as any).is_active;
      const badge = resolveBadgeStatus(rawStatus);

      const coverUrl = toImageUrl(
        (item as any).cover_url ??
          (item as any).image_url ??
          (item as any).thumbnail_url ??
          (item as any).cover ??
          null
      );

      return {
        id: (item as any).id,
        nameText,
        categoryText: categoryText || "-",
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
  const handleEdit = (id: number | string) =>
    router.push(`/products/edit/${id}`);

  const refetchAfterDelete = async () => {
    const take = Math.max(page, 1) * pageSize;
    const q = debouncedSearch || undefined;
    const [resActive, resInactive] = await Promise.all([
      listProducts({ page: 1, perPage: take, search: q, status: "active" as any }),
      listProducts({ page: 1, perPage: take, search: q, status: "inactive" as any }),
    ]);
    const a = Array.isArray(resActive?.data) ? resActive.data : [];
    const b = Array.isArray(resInactive?.data) ? resInactive.data : [];
    const combined = [...a, ...b];

    const totalActive = resActive?.meta?.total ?? a.length;
    const totalInactive = resInactive?.meta?.total ?? b.length;
    const totalItems = totalActive + totalInactive;

    const lastPage = Math.max(1, Math.ceil(totalItems / pageSize));
    const currentPage = Math.min(Math.max(page, 1), lastPage);
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;

    setRows(combined.slice(start, end));
    setMeta({
      current_page: currentPage,
      per_page: pageSize,
      total: totalItems,
      last_page: lastPage,
    } as any);
  };

  const handleDelete = async (id: number | string) => {
    const ok = window.confirm("Hapus produk ini?");
    if (!ok) return;
    try {
      await api.delete(`/products/${id}`);
      await refetchAfterDelete();
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
            <div className="flex flex-wrap items-center justify-end gap-2 border-b border-gray-200 px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <input
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder="Search"
                    aria-label="Cari produk"
                    className="w-64 rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                              <EditButton onClick={() => router.push(`/products/edit/${p.id}`)} />
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