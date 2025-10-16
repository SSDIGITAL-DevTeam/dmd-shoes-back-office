// services/products.service.ts
export type I18nText = string | { id?: string; en?: string } | null | undefined;

export type ProductItem = {
  id: number | string;
  name?: I18nText;
  name_text?: string;
  slug?: string;
  cover_url?: string | null;
  cover?: string | null;
  images?: Array<{ url?: string }>;
  status?: boolean | string | number | null;

  // kategori: backend mengirim category_name (string) + category_id,
  // kadang juga ada object ringkas (tergantung endpoint).
  category?: { id?: number; slug?: string; name?: I18nText } | null;
  category_name?: I18nText;
  category_slug?: string | null;

  brand?: I18nText | { name?: I18nText } | null;

  // lain-lain yang mungkin ada
  pricing_mode?: string | null;
  price?: number | null;
  price_min?: number | null;
  variants_min_price?: number | null;
  favorites_count?: number | null;
  featured?: boolean | number | string | null;
  heel_height_cm?: number | null;
};

export type Meta = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};

export type ProductsResponse = {
  status?: string;
  message?: string;
  data: ProductItem[];
  meta: Meta;
};

export function safeText(value: I18nText, locale: "id" | "en" = "id"): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  return locale === "id" ? (value.id ?? value.en ?? "") : (value.en ?? value.id ?? "");
}

type ListParams = {
  page?: number;
  perPage?: number;   // <-- tetap diterima di sisi FE
  per_page?: number;  // <-- kunci yang benar untuk BE
  search?: string;
  status?: "" | "publish" | "draft" | "active" | "inactive";
  sort?: string;
  order?: "asc" | "desc";
};

function buildQuery(p: ListParams = {}) {
  const s = new URLSearchParams();
  if (p.page) s.set("page", String(p.page));

  // Kirim per_page ke backend. Tetap dukung perPage agar tidak rusak untuk caller lain.
  const per = p.per_page ?? p.perPage;
  if (per) s.set("per_page", String(per));

  if (p.search) s.set("search", p.search);
  if (p.status) s.set("status", p.status);
  if (p.sort) s.set("sort", p.sort);
  if (p.order) s.set("order", p.order);
  return s.toString();
}

export async function listProducts(params: ListParams = {}): Promise<ProductsResponse> {
  const qs = buildQuery(params);
  const res = await fetch(`/api/products${qs ? `?${qs}` : ""}`, {
    method: "GET",
    headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
    cache: "no-store",
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  const rows: ProductItem[] = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
  const meta: Meta =
    data?.meta ?? { current_page: Number(data?.current_page || 1), per_page: Number(data?.per_page || 12), total: Number(data?.total || rows.length), last_page: Number(data?.last_page || 1) };

  return { status: data?.status || "success", message: data?.message, data: rows, meta };
}

export async function getProduct(id: string | number): Promise<any> {
  const res = await fetch(`/api/products/${id}`, {
    method: "GET",
    headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
    cache: "no-store",
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(data?.message || "Get product failed");
  return data;
}

export async function createProduct(payload: any) {
  const res = await fetch(`/api/products`, {
    method: "POST",
    headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest", "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(data?.message || "Create product failed");
  return data;
}

export async function updateProduct(id: string | number, payload: any) {
  const res = await fetch(`/api/products/${id}`, {
    method: "PUT",
    headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest", "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(data?.message || "Update product failed");
  return data;
}

export async function deleteProduct(id: string | number) {
  const res = await fetch(`/api/products/${id}`, {
    method: "DELETE",
    headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(data?.message || "Delete product failed");
  return data;
}