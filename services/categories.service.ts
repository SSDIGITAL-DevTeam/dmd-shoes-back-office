// services/categories.service.ts
import api from "@/lib/fetching";

/** ===== Tipe data mengikuti pola respons backend yang sudah ada ===== */
export type I18nText = string | { id?: string; en?: string } | null | undefined;

export type CategoryItem = {
  id: number | string;
  name?: I18nText;
  name_text?: string | null;
  slug?: string | null;
  cover_url?: string | null;
  cover?: string | null;
  parent_id?: number | string | null;
  parent?: Partial<CategoryItem> | null; // kalau BE mengirim ringkasan parent
  status?: boolean | string | number | null;
};

export type CategoryMeta = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};

export type CategoriesResponse = {
  status?: string;
  message?: string;
  data: CategoryItem[];
  meta?: CategoryMeta;
};

/** ===== Util: aman ambil teks bilingual ===== */
export function safeText(value: I18nText, locale: "id" | "en" = "id"): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  return locale === "id" ? (value.id ?? value.en ?? "") : (value.en ?? value.id ?? "");
}

/** ===== Ambil daftar kategori dengan parameter fleksibel ===== */
type ListParams = {
  page?: number;
  perPage?: number; // FE naming
  per_page?: number; // BE naming
  search?: string;
  status?: "" | "publish" | "draft" | "active" | "inactive";
  /** parent filter: "top" untuk hanya parent (sesuai kode lama), atau biarkan kosong untuk semua */
  parent?: string;
  sort?: string;
  order?: "asc" | "desc";
};

function buildQuery(p: ListParams = {}) {
  const s = new URLSearchParams();
  if (p.page) s.set("page", String(p.page));
  const per = p.per_page ?? p.perPage ?? 100;
  s.set("perPage", String(per));     // beberapa BE membaca perPage
  s.set("per_page", String(per));    // dan beberapa membaca per_page
  if (p.search) s.set("search", p.search);
  if (p.status) s.set("status", p.status);
  if (p.parent) s.set("parent", p.parent); // "top" untuk parent-only (sesuai proyekmu)
  if (p.sort) s.set("sort", p.sort);
  if (p.order) s.set("order", p.order);
  return s.toString();
}

/** Catatan: proyekmu sebelumnya memakai route '/category' (singular) */
const CATEGORY_URL = "/category";

/** Fetch list kategori (raw) memakai api lib proyekmu */
export async function listCategories(params: ListParams = {}): Promise<CategoriesResponse> {
  const qs = buildQuery(params);
  const res = await api.get(`${CATEGORY_URL}${qs ? `?${qs}` : ""}`);
  const body = (res as any)?.data ?? res;

  const rows: CategoryItem[] =
    Array.isArray(body?.data) ? body.data :
    Array.isArray(body) ? body :
    [];

  const meta: CategoryMeta =
    body?.meta ?? {
      current_page: Number(body?.current_page || 1),
      per_page: Number(body?.per_page || rows.length || 100),
      total: Number(body?.total || rows.length),
      last_page: Number(body?.last_page || 1),
    };

  return { status: body?.status || "success", message: body?.message, data: rows, meta };
}

/** ===== Helpers untuk opsi Select ===== */

export type CategoryOption = {
  value: number;
  label: string;
  image?: string | null;
  parent_id?: number | null;
};

/** Build label "Parent › Child" jika ada parent di dalam koleksi yang sama */
export function buildHierarchicalLabel(
  item: CategoryItem,
  index: Map<number, CategoryItem>,
  locale: "id" | "en" = "id"
): string {
  const self =
    item.name_text ??
    safeText(item.name, locale) ??
    (item.slug || `Category ${item.id}`);

  const pid = item.parent_id != null ? Number(item.parent_id) : null;
  if (!pid) return self;

  const parent = index.get(pid) || (item.parent as CategoryItem | undefined);
  if (!parent) return self;

  const parentLabel =
    parent.name_text ??
    safeText(parent.name, locale) ??
    (parent.slug || `Category ${parent.id}`);

  return `${parentLabel} › ${self}`;
}

/** Opsi untuk Create Product: tampilkan SEMUA kategori (parent & child) */
export async function loadAllCategoryOptions(
  search: string,
  locale: "id" | "en" = "id",
  perPage = 500
): Promise<CategoryOption[]> {
  // Tanpa parent="top" agar ALL
  const { data } = await listCategories({ status: "active", perPage, search });
  const idx = new Map<number, CategoryItem>();
  for (const it of data) idx.set(Number(it.id), it);

  return data.map((c) => ({
    value: Number(c.id),
    label: buildHierarchicalLabel(c, idx, locale),
    image: c.cover_url || c.cover || null,
    parent_id: c.parent_id != null ? Number(c.parent_id) : null,
  }));
}

/** Opsi untuk Create/Edit Category: HANYA parent */
export async function loadParentCategoryOptions(
  search: string,
  locale: "id" | "en" = "id",
  perPage = 500
): Promise<CategoryOption[]> {
  // Ikuti pola lama: parent: "top" agar hanya parent
  const { data } = await listCategories({ status: "active", perPage, search, parent: "top" });

  return data.map((c) => ({
    value: Number(c.id),
    label:
      c.name_text ??
      safeText(c.name, locale) ??
      (c.slug || `Category ${c.id}`),
    image: c.cover_url || c.cover || null,
    parent_id: c.parent_id != null ? Number(c.parent_id) : null,
  })).filter((o) => !o.parent_id); // jaga-jaga, filter child
}

/** ===== Compat helpers for components that expect legacy names ===== */

export function categoryLabel(item: CategoryItem, locale: "id" | "en" = "id"): string {
  return (
    item.name_text ??
    safeText(item.name, locale) ??
    item.slug ??
    `Category ${item.id}`
  );
}

/** Legacy alias: ambil seluruh kategori (parent + child) */
export async function fetchAllCategories(perPage = 500, search = ""): Promise<CategoryItem[]> {
  const { data } = await listCategories({ status: "active", perPage, search });
  return data;
}

/** Legacy alias: ambil hanya parent categories */
export async function fetchParentCategories(perPage = 500, search = ""): Promise<CategoryItem[]> {
  const { data } = await listCategories({ status: "active", perPage, parent: "top", search });
  return data.filter((item) => !item.parent_id);
}
