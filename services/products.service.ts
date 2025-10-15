export type Locale = "id" | "en";
export type I18nText = string | { id?: string; en?: string } | null | undefined;

export interface ProductItem {
  id: number | string;
  name?: I18nText;
  title?: I18nText;
  status?: string | boolean | number;
  cover_url?: string | null;
  cover_path?: string | null;
  slug?: string;
  [key: string]: any;
}

export type ProductsResponse = {
  status?: string;
  message?: string;
  data: ProductItem[];
  meta: { current_page: number; per_page: number; total: number; last_page: number };
};

export interface Envelope<T> { status?: string; message?: string; data?: T }

import { http } from "./http";

// helper teks
export function safeText(value: I18nText, locale: Locale = "id"): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  return locale === "id" ? (value.id ?? value.en ?? "") : (value.en ?? value.id ?? "");
}

// normalisasi status → boolean
export function normalizeStatus(s: unknown): boolean {
  if (typeof s === "boolean") return s;
  const str = String(s ?? "").trim().toLowerCase();
  return str === "active" || str === "publish" || str === "1" || str === "true";
}

export function buildImageUrl(item: ProductItem): string | null {
  if (item.cover_url) return item.cover_url;
  const storage = process.env.NEXT_PUBLIC_STORAGE_URL?.replace(/\/+$/, "");
  if (!storage) return null;
  const p = (item.cover_path ?? "").replace(/^\/+/, "");
  return p ? `${storage}/${p}` : null;
}

export async function listProducts(params: {
  page?: number;
  per_page?: number;
  status?: "all" | "active" | "inactive" | "publish" | "draft";
  search?: string;
  category_id?: string | number;
}) {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.per_page) qs.set("per_page", String(params.per_page));
  if (params.status) qs.set("status", params.status);
  if (params.search) qs.set("search", params.search);
  if (params.category_id) qs.set("category_id", String(params.category_id));

  // PENTING: pakai route internal /api/products
  const json = await http<ProductsResponse>(`/api/products?${qs.toString()}`);
  // fallback bila backend kirim { data: { data:[], meta:{} } }
  if (!Array.isArray(json.data) && (json as any)?.data?.data) {
    const maybe = (json as any).data;
    return { data: maybe.data as ProductItem[], meta: maybe.meta as ProductsResponse["meta"] };
  }
  return json;
}

export async function getProduct(id: string | number) {
  const r = await http<Envelope<ProductItem>>(`/api/products/${id}`);
  return r.data!;
}

export async function createProduct(payload: Partial<ProductItem>) {
  const r = await http<Envelope<ProductItem>>(`/api/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return r.data!;
}

export async function updateProduct(id: string | number, payload: Partial<ProductItem>) {
  const r = await http<Envelope<ProductItem>>(`/api/products/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return r.data!;
}

export async function toggleProductStatus(id: string | number, status: boolean | "publish" | "draft") {
  // Kalau punya endpoint khusus:
  try {
    const r = await http<Envelope<ProductItem>>(`/api/products/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    return r.data!;
  } catch {
    // fallback: PATCH /products/:id
    const r2 = await http<Envelope<ProductItem>>(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    return r2.data!;
  }
}

export async function deleteProduct(id: string | number) {
  return http<Envelope<unknown>>(`/api/products/${id}`, { method: "DELETE" });
}