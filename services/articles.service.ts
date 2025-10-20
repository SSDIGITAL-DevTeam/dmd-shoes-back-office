// services/articles.service.ts
import { apiGet, apiSend, apiSendForm } from "@/lib/api/client";

/** =======================
 *  Types
 *  ======================= */
export type ItemBase = {
  id: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string; // untuk Trash tab (opsional di BE, tapi berguna kalau dikirim)
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

export type ArticleItem = ItemBase & {
  slug?: string;
  cover_url?: string;
  author_name?: string;
  status?: "publish" | "draft";
  published?: boolean;
  title_text?: string;
  content_text?: string;
  excerpt?: string;
  // optional raw JSON
  title?: Record<string, string | null>;
  content?: Record<string, string | null>;
  // optional SEO raw
  seo_keyword?: Record<string, string | null> | null;
  seo_description?: Record<string, string | null> | null;
  seo_tags?: string[] | null;
};

// bilingual pair
export type LangPair = { id: string | null; en: string | null };

/** =======================
 *  List / Detail
 *  ======================= */
export type ListArticlesParams = {
  page?: number;
  perPage?: number;
  search?: string;
  status?: "publish" | "draft";
  lang?: string;
};

export async function listArticles(
  params: ListArticlesParams = {}
): Promise<ListResponse<ArticleItem>> {
  const { page = 1, perPage = 10, search = "", status, lang = "id" } = params;
  return apiGet<ListResponse<ArticleItem>>("/api/articles", {
    page,
    per_page: perPage, // backend expects per_page
    search,
    ...(status ? { status } : {}),
    ...(lang ? { lang } : {}),
  });
}

export async function listTrashedArticles(
  params: Omit<ListArticlesParams, "status"> = {}
): Promise<ListResponse<ArticleItem>> {
  const { page = 1, perPage = 10, search = "", lang = "id" } = params;
  return apiGet<ListResponse<ArticleItem>>("/api/articles/trashed", {
    page,
    per_page: perPage,
    search,
    ...(lang ? { lang } : {}),
  });
}

export async function getArticle(id: string | number, lang?: string) {
  const qs = lang ? `?lang=${encodeURIComponent(lang)}` : "";
  return apiGet<DetailResponse<ArticleItem>>(`/api/articles/${id}${qs}`);
}

/** =======================
 *  Upsert Payloads
 *  ======================= */
// JSON payload (no file)
export type ArticleJsonPayload = {
  title: LangPair;                  // { id, en }
  content: LangPair;                // { id, en }  (required by BE)
  status: "publish" | "draft";
  published?: boolean;
  slug?: string | null;
  cover_url?: string;               // http/https

  // SEO (bilingual)
  seo_keyword?: LangPair | null;
  seo_description?: LangPair | null;
  seo_tags?: string[] | null;
};

// Multipart payload (with file)
export type ArticleMultipartPayload = {
  title: LangPair;
  content: LangPair;
  status: "publish" | "draft";
  published?: boolean;
  slug?: string | null;
  cover: File;                      // file upload

  // SEO (bilingual)
  seo_keyword?: LangPair | null;
  seo_description?: LangPair | null;
  seo_tags?: string[] | null;
};

type UpsertResult = DetailResponse<ArticleItem> | { status: string; message?: string };

/** =======================
 *  Create / Update
 *  ======================= */
export async function createArticle(payload: ArticleJsonPayload | ArticleMultipartPayload) {
  if (isMultipart(payload)) {
    const form = toFormData(payload);
    return apiSendForm<UpsertResult>("/api/articles", "POST", form);
  }
  return apiSend<UpsertResult>("/api/articles", "POST", payload);
}

export async function updateArticle(id: string | number, payload: ArticleJsonPayload | ArticleMultipartPayload) {
  if (isMultipart(payload)) {
    const form = toFormData(payload);
    return apiSendForm<UpsertResult>(`/api/articles/${id}`, "PUT", form);
  }
  return apiSend<UpsertResult>(`/api/articles/${id}`, "PUT", payload);
}

/** =======================
 *  Delete / Toggle / Restore
 *  ======================= */
export async function deleteArticle(id: string | number) {
  // soft delete
  return apiSend<{ status: string; message?: string }>(`/api/articles/${id}`, "DELETE");
}

export async function forceDeleteArticle(id: number) {
  // permanent delete
  return apiSend<{ status: string; message?: string }>(`/api/articles/${id}/force`, "DELETE");
}

export async function restoreArticle(id: number) {
  // sesuai controller kamu -> POST /api/v1/articles/{id}/restore (proxy kamu: /api/articles/:id/restore)
  return apiSend<{ status: string; message?: string }>(`/api/articles/${id}/restore`, "POST", {});
}

export async function toggleArticle(
  id: string | number,
  payload: { status?: "publish" | "draft"; published?: boolean; lang?: string }
) {
  const qs = payload.lang ? `?lang=${encodeURIComponent(payload.lang)}` : "";
  const { lang, ...body } = payload;
  return apiSend<DetailResponse<ArticleItem>>(`/api/articles/${id}/toggle${qs}`, "PATCH", body);
}

/** =======================
 *  Helpers
 *  ======================= */
function isMultipart(p: any): p is ArticleMultipartPayload {
  return typeof (p as any)?.cover === "object" && (p as any).cover instanceof File;
}

function toFormData(p: ArticleMultipartPayload): FormData {
  const f = new FormData();

  // basic
  f.set("status", p.status);
  if (typeof p.published === "boolean") f.set("published", p.published ? "1" : "0"); // boolean tegas
  if (p.slug) f.set("slug", p.slug);

  // bilingual fields
  if (p.title?.id != null) f.set("title[id]", String(p.title.id ?? ""));
  if (p.title?.en != null) f.set("title[en]", String(p.title.en ?? ""));
  if (p.content?.id != null) f.set("content[id]", String(p.content.id ?? ""));
  if (p.content?.en != null) f.set("content[en]", String(p.content.en ?? ""));

  // cover file
  f.set("cover", p.cover);

  // SEO
  if (p.seo_keyword) {
    if (p.seo_keyword.id != null) f.set("seo_keyword[id]", String(p.seo_keyword.id ?? ""));
    if (p.seo_keyword.en != null) f.set("seo_keyword[en]", String(p.seo_keyword.en ?? ""));
  }
  if (p.seo_description) {
    if (p.seo_description.id != null) f.set("seo_description[id]", String(p.seo_description.id ?? ""));
    if (p.seo_description.en != null) f.set("seo_description[en]", String(p.seo_description.en ?? ""));
  }
  if (Array.isArray(p.seo_tags)) {
    p.seo_tags.forEach((t, i) => f.append(`seo_tags[${i}]`, t));
  }

  return f;
}
