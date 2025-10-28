// services/meta.service.ts
import { apiGet, apiSend } from "@/lib/api/client";

/** =======================
 *  Types (seragam dgn articles.service.ts / products.service.ts)
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
  status: string;
  message?: string;
  data: T[];
  meta: ListMeta;
};

export type DetailResponse<T> = {
  status: string;
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
  // Legacy aliases
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
  // Legacy compatibility (caller lama)
  key?: string;
  value?: string;
  content?: string | null;
  is_active?: boolean;
  sort_order?: number;
};

export type UpdateMetaTagPayload = Partial<CreateMetaTagPayload>;

/** =======================
 *  Utils
 *  ======================= */
function normalizeMeta(m: any, fallbackCount = 0): ListMeta {
  return {
    current_page: Number(m?.current_page ?? 1),
    per_page: Number(m?.per_page ?? 12),
    total: Number(m?.total ?? fallbackCount),
    last_page: Number(m?.last_page ?? 1),
  };
}

function normalizeTagRow(row: any): MetaTagItem {
  const attr = row?.attr ?? row?.key;               // compat
  const identifier = row?.identifier ?? row?.value; // compat

  return {
    id: row?.id,
    page_id: Number(row?.page_id ?? row?.pageId ?? 0),
    locale: (row?.locale ?? "id") as "id" | "en",
    attr,
    identifier,
    key: row?.key,
    value: row?.value,
    // penting: 'content' adalah nilai konten meta, bukan identifier
    content: row?.content ?? null,
    is_active: Boolean(
      row?.is_active ??
      (typeof row?.status === "string"
        ? ["active", "publish"].includes(row.status.toLowerCase())
        : row?.status ?? true)
    ),
    sort_order: Number(row?.sort_order ?? row?.sortOrder ?? 0),

    status: row?.status,
    created_at: row?.created_at,
    updated_at: row?.updated_at,
    deleted_at: row?.deleted_at,
  };
}

function toCompatPayload(payload: CreateMetaTagPayload | UpdateMetaTagPayload) {
  const result: any = { ...payload };
  if ("attr" in result && result.attr !== undefined) {
    result.key = result.key ?? result.attr;
  }
  if ("identifier" in result && result.identifier !== undefined) {
    result.value = result.value ?? result.identifier;
  }
  // biarkan 'content' apa adanya
  return result;
}

/** =======================
 *  Pages
 *  ======================= */
export async function getPages() {
  return apiGet<{ status: string; message?: string; data: MetaPage[] }>(`/api/meta/pages`);
}

/** =======================
 *  Tags (per page)
 *  ======================= */
export type ListTagsParams = {
  page?: number;
  perPage?: number;     // FE alias — akan dikirim sebagai per_page
  locale?: "id" | "en";
};

export async function getPageTags(
  pageId: number | string,
  params: ListTagsParams = {}
): Promise<ListResponse<MetaTagItem>> {
  const { page = 1, perPage = 12, locale } = params;
  const res = await apiGet<any>(`/api/meta/pages/${pageId}/tags`, {
    page,
    per_page: perPage,
    ...(locale ? { locale } : {}),
  });

  const rawRows: any[] = Array.isArray(res?.data)
    ? res.data
    : Array.isArray(res)
      ? (res as any)
      : [];

  const rows = rawRows.map(normalizeTagRow);
  const meta = normalizeMeta((res as any)?.meta, rows.length);

  return {
    status: (res as any)?.status || "success",
    message: (res as any)?.message,
    data: rows,
    meta,
  };
}

// (opsional) GET single tag — hanya jika BE menyediakan endpoint
export async function getTag(
  pageId: number | string,
  tagId: number | string
): Promise<DetailResponse<MetaTagItem>> {
  const res = await apiGet<any>(`/api/meta/pages/${pageId}/tags/${tagId}`);
  const row = (res as any)?.data ?? res;
  return {
    status: (res as any)?.status || "success",
    message: (res as any)?.message,
    data: normalizeTagRow(row),
  };
}

/** =======================
 *  Create / Update / Delete
 *  ======================= */
export async function createTag(
  pageId: number | string,
  payload: CreateMetaTagPayload
): Promise<DetailResponse<MetaTagItem>> {
  const res = await apiSend<any>(`/api/meta/pages/${pageId}/tags`, "POST", toCompatPayload(payload));
  const row = (res as any)?.data ?? res;
  return {
    status: (res as any)?.status || "success",
    message: (res as any)?.message,
    data: normalizeTagRow(row),
  };
}

export async function updateTag(
  pageId: number | string,
  tagId: number | string,
  payload: UpdateMetaTagPayload
): Promise<DetailResponse<MetaTagItem>> {
  const res = await apiSend<any>(
    `/api/meta/pages/${pageId}/tags/${tagId}`,
    "PATCH",
    toCompatPayload(payload)
  );
  const row = (res as any)?.data ?? res;
  return {
    status: (res as any)?.status || "success",
    message: (res as any)?.message,
    data: normalizeTagRow(row),
  };
}

export async function deleteTag(
  pageId: number | string,
  tagId: number | string
): Promise<{ status: string; message?: string }> {
  const res = await apiSend<{ status: string; message?: string }>(
    `/api/meta/pages/${pageId}/tags/${tagId}`,
    "DELETE"
  );
  return { status: (res as any)?.status || "success", message: (res as any)?.message };
}