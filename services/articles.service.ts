// services/articles.service.ts
import { apiGet, apiSend } from "@/lib/api/client";
import type { ItemBase, ListResponse } from "@/types";

export type ArticleItem = ItemBase & {
  author_name?: string;
  published_at?: string | null;
};

export async function listArticles(params?: { page?: number; perPage?: number; search?: string }) {
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