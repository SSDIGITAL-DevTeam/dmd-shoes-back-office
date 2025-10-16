// services/articles.service.ts
import { apiGet, apiSend } from "@/lib/api/client";

export type ItemBase = {
  id: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
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

export type ArticleItem = ItemBase & {
  cover_url?: string;
  author_name?: string;
  // back-end kirim status "publish"/"draft" + published boolean
  published?: boolean;
  title_text?: string;
};

export async function listArticles(params?: {
  page?: number;
  perPage?: number;
  search?: string;
}) {
  // Penting: gunakan perPage (camelCase). Route Next akan memetakan ke per_page untuk backend.
  return apiGet<ListResponse<ArticleItem>>("/api/articles", {
    page: params?.page ?? 1,
    perPage: params?.perPage ?? 10,
    search: params?.search ?? "",
  });
}

export async function getArticle(id: string | number) {
  return apiGet<ArticleItem>(`/api/articles/${id}`);
}

export async function createArticle(payload: Partial<ArticleItem>) {
  return apiSend<ArticleItem>("/api/articles", "POST", payload);
}

export async function updateArticle(id: string | number, payload: Partial<ArticleItem>) {
  return apiSend<ArticleItem>(`/api/articles/${id}`, "PUT", payload);
}

export async function deleteArticle(id: string | number) {
  return apiSend<{ status: string; message?: string }>(`/api/articles/${id}`, "DELETE");
}