// services/meta.service.ts
/** =======================
 *  Types (seragam dgn products.service.ts)
 *  ======================= */
export type I18nText = string | { id?: string; en?: string } | null | undefined;

export function safeText(value: I18nText, locale: "id" | "en" = "id"): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  return locale === "id" ? (value.id ?? value.en ?? "") : (value.en ?? value.id ?? "");
}

export type ItemBase = {
  id: number | string;
  status?: string | boolean | number | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
};

export type ListMeta = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};

export type ListResponse<T> = {
  status?: string;
  message?: string;
  data: T[];
  meta: ListMeta;
};

export type DetailResponse<T> = {
  status?: string;
  message?: string;
  data: T;
};

export type MetaPage = {
  id: number;
  name: string;
  slug: string;
};

export type MetaTagItem = ItemBase & {
  page_id: number;
  locale: "id" | "en";
  // BE lama bisa kirim key/value, BE baru pakai attr/identifier
  attr: "name" | "property" | "http-equiv" | "charset";
  identifier: string;               // e.g. description, og:title
  // Legacy aliases:
  key?: string;
  value?: string;
  content: string | null;
  is_active: boolean;
  sort_order: number;
};

/** =======================
 *  Payloads
 *  ======================= */
export type CreateMetaTagPayload = {
  locale?: "id" | "en"; // default di BE: "id"
  attr: "name" | "property" | "http-equiv" | "charset";
  identifier: string;
  // Legacy compatibility (biarkan jika caller lama masih mengirim ini)
  key?: string;
  value?: string;
  content?: string | null;
  is_active?: boolean;
  sort_order?: number;
};

export type UpdateMetaTagPayload = Partial<CreateMetaTagPayload>;

/** =======================
 *  Utils seragam
 *  ======================= */
function jsonOrEmpty(text: string) {
  if (!text) return {};
  try { return JSON.parse(text); } catch { return {}; }
}

function normalizeMeta(m: any, fallbackCount = 0): ListMeta {
  return {
    current_page: Number(m?.current_page ?? 1),
    per_page: Number(m?.per_page ?? 12),
    total: Number(m?.total ?? fallbackCount),
    last_page: Number(m?.last_page ?? 1),
  };
}

function normalizeTagRow(row: any): MetaTagItem {
  // Kompatibilitas BE lama vs baru:
  const attr = row?.attr ?? row?.key;
  const identifier = row?.identifier ?? row?.value;

  // content tetap diambil dari 'content' jika ada. (jangan ambil dari value—value adalah identifier)
  const content = row?.content ?? null;

  return {
    id: row?.id,
    page_id: Number(row?.page_id ?? row?.pageId ?? 0),
    locale: (row?.locale ?? "id") as "id" | "en",
    attr,
    identifier,
    key: row?.key,
    value: row?.value,
    content,
    is_active: Boolean(
      row?.is_active ??
      (typeof row?.status === "string"
        ? row?.status.toLowerCase() === "active" || row?.status.toLowerCase() === "publish"
        : row?.status ?? true)
    ),
    sort_order: Number(row?.sort_order ?? row?.sortOrder ?? 0),

    // Base
    status: row?.status,
    created_at: row?.created_at,
    updated_at: row?.updated_at,
    deleted_at: row?.deleted_at,
  };
}

type ListParams = {
  // umum
  page?: number;
  perPage?: number;
  per_page?: number;
  // khusus list tag
  locale?: "id" | "en";
};

function buildQuery(p: ListParams = {}) {
  const s = new URLSearchParams();
  if (p.page) s.set("page", String(p.page));
  const per = p.per_page ?? p.perPage;
  if (per) s.set("per_page", String(per));
  if (p.locale) s.set("locale", p.locale);
  return s.toString();
}

const baseHeaders = { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" } as const;

/** =======================
 *  Pages
 *  ======================= */

// GET list pages (public/admin—via proxy Next /api/meta/pages)
export async function getPages(): Promise<{ status?: string; message?: string; data: MetaPage[] }> {
  const res = await fetch(`/api/meta/pages`, { method: "GET", headers: baseHeaders, cache: "no-store" });
  const text = await res.text();
  const data = jsonOrEmpty(text);
  if (!res.ok) throw new Error(data?.message || `Get pages failed (${res.status})`);

  const rows: MetaPage[] = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data)
      ? data
      : [];

  return { status: data?.status || "success", message: data?.message, data: rows };
}

/** =======================
 *  Tags (per page)
 *  ======================= */

// GET meta tags by page (admin list) — dukung locale & pagination
export async function getPageTags(
  pageId: number | string,
  params: ListParams = {}
): Promise<ListResponse<MetaTagItem>> {
  const qs = buildQuery(params);
  const res = await fetch(`/api/meta/pages/${pageId}/tags${qs ? `?${qs}` : ""}`, {
    method: "GET",
    headers: baseHeaders,
    cache: "no-store",
  });

  const text = await res.text();
  const data = jsonOrEmpty(text);
  if (!res.ok) throw new Error(data?.message || `Get meta tags failed (${res.status})`);

  const rawRows: any[] = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data)
      ? data
      : [];

  const rows = rawRows.map(normalizeTagRow);
  const meta = normalizeMeta(data?.meta, rows.length);

  return { status: data?.status || "success", message: data?.message, data: rows, meta };
}

// (opsional) GET single tag detail — hanya jika endpoint tersedia di BE
export async function getTag(
  pageId: number | string,
  tagId: number | string
): Promise<DetailResponse<MetaTagItem>> {
  const res = await fetch(`/api/meta/pages/${pageId}/tags/${tagId}`, {
    method: "GET",
    headers: baseHeaders,
    cache: "no-store",
  });
  const text = await res.text();
  const data = jsonOrEmpty(text);
  if (!res.ok) throw new Error(data?.message || `Get tag failed (${res.status})`);

  const row = data?.data ?? data;
  return {
    status: data?.status || "success",
    message: data?.message,
    data: normalizeTagRow(row),
  };
}

// Helper: bentuk payload kompatibel BE lama/baru
function toCompatPayload(payload: CreateMetaTagPayload | UpdateMetaTagPayload) {
  const result: any = { ...payload };

  // Pastikan field utama tersedia:
  if (payload && "attr" in payload && payload.attr !== undefined) {
    result.key = payload.key ?? payload.attr;
  }
  if (payload && "identifier" in payload && payload.identifier !== undefined) {
    result.value = payload.value ?? payload.identifier;
  }

  // Biarkan 'content' apa adanya (jangan diisi dari value).
  // Field opsional lain tetap dikirim jika ada.

  return result;
}

// POST create tag (admin)
export async function createTag(
  pageId: number | string,
  payload: CreateMetaTagPayload
): Promise<DetailResponse<MetaTagItem>> {
  const res = await fetch(`/api/meta/pages/${pageId}/tags`, {
    method: "POST",
    headers: { ...baseHeaders, "Content-Type": "application/json" },
    body: JSON.stringify(toCompatPayload(payload)),
  });

  const text = await res.text();
  const data = jsonOrEmpty(text);
  if (!res.ok) throw new Error(data?.message || `Create tag failed (${res.status})`);

  const row = data?.data ?? data;
  return {
    status: data?.status || "success",
    message: data?.message,
    data: normalizeTagRow(row),
  };
}

// PATCH update tag (admin)
export async function updateTag(
  pageId: number | string,
  tagId: number | string,
  payload: UpdateMetaTagPayload
): Promise<DetailResponse<MetaTagItem>> {
  const res = await fetch(`/api/meta/pages/${pageId}/tags/${tagId}`, {
    method: "PATCH",
    headers: { ...baseHeaders, "Content-Type": "application/json" },
    body: JSON.stringify(toCompatPayload(payload)),
  });

  const text = await res.text();
  const data = jsonOrEmpty(text);
  if (!res.ok) throw new Error(data?.message || `Update tag failed (${res.status})`);

  const row = data?.data ?? data;
  return {
    status: data?.status || "success",
    message: data?.message,
    data: normalizeTagRow(row),
  };
}

// DELETE tag (admin)
export async function deleteTag(
  pageId: number | string,
  tagId: number | string
): Promise<{ status?: string; message?: string }> {
  const res = await fetch(`/api/meta/pages/${pageId}/tags/${tagId}`, {
    method: "DELETE",
    headers: baseHeaders,
  });

  const text = await res.text();
  const data = jsonOrEmpty(text);
  if (!res.ok) throw new Error(data?.message || `Delete tag failed (${res.status})`);

  return { status: data?.status || "success", message: data?.message };
}