"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { NewNounButton } from "@/components/ui/AddButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EditButton } from "@/components/ui/EditIcon";
import { DeleteButton } from "@/components/ui/DeleteIcon";
import { Pagination } from "@/components/layout/Pagination";
import api from "@/lib/fetching";
import {
  ApiProduct,
  fetchProducts,
  ProductListParams,
  ProductListResponse,
} from "./services/productService";

type SortField = "name" | "price" | "created_at";
type SortDirection = "asc" | "desc";

type CategoryOption = {
  value: string;
  label: string;
};

type ProductMeta = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};

type DisplayProduct = {
  id: number;
  name: string;
  priceLabel: string;
  stockLabel: string;
  status: "draft" | "active" | "publish" | "non-active";
  categoryName: string;
  coverUrl: string;
};

const DEFAULT_META: ProductMeta = {
  current_page: 1,
  per_page: 12,
  total: 0,
  last_page: 1,
};

const SORT_OPTIONS: { label: string; value: SortField }[] = [
  { label: "Nama", value: "name" },
  { label: "Harga", value: "price" },
  { label: "Tanggal dibuat", value: "created_at" },
];

const DEFAULT_PAGE_SIZE_OPTIONS = [12, 24, 48];

const STORAGE_BASE = (process.env.NEXT_PUBLIC_STORAGE_URL || "").replace(/\/$/, "");
const PLACEHOLDER = "/api/placeholder/50/50";

function useDebounce<T>(value: T, delay = 500) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

function toImageUrl(raw?: string | null) {
  if (!raw) return PLACEHOLDER;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (STORAGE_BASE) {
    return `${STORAGE_BASE}/${String(raw).replace(/^\/+/, "")}`;
  }
  return String(raw).startsWith("/") ? raw : `/${raw}`;
}

function resolveStatus(value: ApiProduct["status"]):
  | "draft"
  | "active"
  | "publish"
  | "non-active" {
  if (value === "draft" || value === "publish") return value;
  if (value === true || value === 1 || value === "1") return "active";
  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    if (normalized === "active") return "active";
    if (normalized === "publish") return "publish";
    if (normalized === "draft") return "draft";
    if (["inactive", "non-active", "non active", "0"].includes(normalized)) {
      return "non-active";
    }
  }
  return "non-active";
}

function safeNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : null;
}

export default function ProductsPage() {
  const router = useRouter();

  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [meta, setMeta] = useState<ProductMeta>(DEFAULT_META);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_META.per_page);

  const [searchValue, setSearchValue] = useState("");
  const debouncedSearch = useDebounce(searchValue, 500);
  const [categoryId, setCategoryId] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await api.get("/categories", {
          params: { status: "active", per_page: 100 },
        });
        if (!active) return;
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        const mapped: CategoryOption[] = list.map((category: any) => ({
          value: String(category.id),
          label:
            category.name_text ||
            category?.name?.id ||
            category?.name?.en ||
            `Kategori ${category.id}`,
        }));
        setCategories(mapped);
      } catch (catError) {
        console.error("Failed to fetch categories", catError);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, categoryId, sortField, sortDir]);

  useEffect(() => {
    let active = true;
    const loadProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const params: ProductListParams = {
          sort: sortField,
          dir: sortDir,
          page,
          per_page: pageSize,
        };
        if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
        const categoryParam = categoryId !== "all" ? Number(categoryId) : undefined;
        if (typeof categoryParam === "number" && !Number.isNaN(categoryParam)) {
          params.category_id = categoryParam;
        }

        const response = await fetchProducts(params);
        if (!active) return;

        const payload: ProductListResponse | undefined = response?.data;
        const rawMeta = payload?.meta;
        const normalizedMeta: ProductMeta = {
          current_page: Math.max(1, rawMeta?.current_page ?? page),
          per_page: rawMeta?.per_page ?? pageSize,
          total: rawMeta?.total ?? (Array.isArray(payload?.data) ? payload.data.length : 0),
          last_page: Math.max(1, rawMeta?.last_page ?? 1),
        };

        if (page > normalizedMeta.last_page) {
          setPage(normalizedMeta.last_page);
          return;
        }

        setProducts(Array.isArray(payload?.data) ? payload.data : []);
        setMeta(normalizedMeta);
        if (normalizedMeta.per_page !== pageSize) {
          setPageSize(normalizedMeta.per_page);
        }
      } catch (fetchError: any) {
        if (!active) return;
        const message =
          fetchError?.response?.data?.message ||
          fetchError?.message ||
          "Failed to fetch products";
        setProducts([]);
        setMeta((prev) => ({ ...prev, total: 0, last_page: 1 }));
        setError(message);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      active = false;
    };
  }, [debouncedSearch, categoryId, sortField, sortDir, page, pageSize]);

  const categoryOptions = useMemo(
    () => [{ value: "all", label: "Semua kategori" }, ...categories],
    [categories]
  );

  const pageSizeOptions = useMemo(() => {
    const merged = new Set<number>([...DEFAULT_PAGE_SIZE_OPTIONS, pageSize]);
    return Array.from(merged).sort((a, b) => a - b);
  }, [pageSize]);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }),
    []
  );

  const numberFormatter = useMemo(() => new Intl.NumberFormat("id-ID"), []);

  const displayProducts = useMemo<DisplayProduct[]>(() => {
    return products.map((item) => {
      const priceNumber = safeNumber(item.price);
      const stockNumber = safeNumber(item.stock);
      return {
        id: item.id,
        name: item.name_text || item.slug || `Produk ${item.id}`,
        priceLabel:
          priceNumber != null ? currencyFormatter.format(priceNumber) : "-",
        stockLabel:
          stockNumber != null ? numberFormatter.format(stockNumber) : "-",
        status: resolveStatus(item.status),
        categoryName: item.category_name || "-",
        coverUrl: toImageUrl(item.cover_url ?? item.cover ?? null),
      };
    });
  }, [products, currencyFormatter, numberFormatter]);

  const handleNewProduct = () => router.push("/products/create");
  const handleEdit = (id: number) => {
    console.log("Edit product", id);
    router.push("/products/edit/"+id);
  };
  const handleDelete = (id: number) => {
    console.log("Delete product", id);
  };

  const toggleSortDir = () =>
    setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));

  const resetFilters = () => {
    setSearchValue("");
    setCategoryId("all");
    setSortField("created_at");
    setSortDir("desc");
    setPageSize(DEFAULT_META.per_page);
    setPage(1);
  };

  const sortDirIcon = sortDir === "asc" ? "M5 15l7-7 7 7" : "M5 9l7 7 7-7";

  return (
    <div className="min-h-full">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center text-sm text-gray-500">
          <span>Products</span>
          <span className="mx-2 text-gray-300">›</span>
          <span className="text-gray-600">List</span>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
          <NewNounButton noun="product" onClick={handleNewProduct} />
        </div>
      </div>

      <div className="bg-gray-50">
        <div className="px-6 py-6">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-end gap-2 border-b border-gray-200 px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
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

                <select
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                  className="w-48 rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm text-gray-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Filter kategori"
                >
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-1">
                  <select
                    value={sortField}
                    onChange={(event) => setSortField(event.target.value as SortField)}
                    className="w-44 rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm text-gray-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Urutkan berdasarkan"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={toggleSortDir}
                    aria-label={sortDir === "asc" ? "Urutkan menaik" : "Urutkan menurun"}
                    aria-pressed={sortDir === "desc"}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 shadow-sm hover:bg-gray-50"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                      <path d={sortDirIcon} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="relative inline-flex items-center justify-center rounded-md border border-gray-200 p-2 text-gray-500 hover:bg-gray-50"
                  type="button"
                  aria-label="Notifications"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
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

                <button
                  className="inline-flex items-center justify-center rounded-md border border-gray-200 p-2 text-gray-500 hover:bg-gray-50"
                  type="button"
                  onClick={resetFilters}
                  aria-label="Reset filter"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 5h18M6 12h12M10 19h4"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="px-4 pt-4 text-sm text-gray-500" aria-live="polite" id="products-table-status">
              {loading ? "Memuat data produk..." : `${meta.total} produk ditemukan`}
            </div>

            {error ? (
              <div className="mx-4 mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {error}
              </div>
            ) : null}

            <div className="overflow-x-auto">
              <table
                className="min-w-full divide-y divide-gray-200"
                aria-label="Daftar produk"
                aria-busy={loading}
                aria-describedby="products-table-status"
              >
                <caption className="sr-only">Daftar produk</caption>
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="w-12 px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-6"
                    >
                      <input type="checkbox" className="rounded border-gray-300" aria-label="Pilih semua produk" />
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-6"
                    >
                      Cover
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-6"
                    >
                      Nama Produk
                    </th>
                    <th
                      scope="col"
                      className="hidden px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:table-cell sm:px-6"
                    >
                      Kategori
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-6"
                    >
                      Harga
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-6"
                    >
                      Stok
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-6"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-6"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-6 text-center text-sm text-gray-500 sm:px-6">
                        Memuat produk...
                      </td>
                    </tr>
                  ) : displayProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-6 text-center text-sm text-gray-500 sm:px-6">
                        Tidak ada produk ditemukan
                      </td>
                    </tr>
                  ) : (
                    displayProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-3 py-4 sm:px-6">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                            aria-label={`Pilih produk ${product.name}`}
                          />
                        </td>
                        <td className="px-3 py-4 sm:px-6">
                          <div className="h-12 w-12 overflow-hidden rounded bg-gray-200">
                            <img
                              src={product.coverUrl}
                              alt={`Cover ${product.name}`}
                              className="h-full w-full object-cover"
                              onError={(event) => {
                                event.currentTarget.src = PLACEHOLDER;
                              }}
                            />
                          </div>
                        </td>
                        <td className="px-3 py-4 sm:px-6">
                          <div className="max-w-xs truncate text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                        </td>
                        <td className="hidden whitespace-nowrap px-3 py-4 text-sm text-gray-900 sm:table-cell sm:px-6">
                          {product.categoryName}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 sm:px-6">
                          {product.priceLabel}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 sm:px-6">
                          {product.stockLabel}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 sm:px-6">
                          <StatusBadge status={product.status} />
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 sm:px-6">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <EditButton onClick={() => handleEdit(product.id)} />
                            <DeleteButton onClick={() => handleDelete(product.id)} />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t border-gray-200 px-4 py-3">
              <Pagination
                totalItems={meta.total}
                page={page}
                pageSize={pageSize}
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
