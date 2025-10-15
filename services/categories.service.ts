// services/categories.service.ts
import { apiGet, apiSend } from "@/lib/api/client";
import type { ItemBase, ListResponse } from "@/types";

export type CategoryItem = ItemBase & {
  parent_id?: number | null;
  parent?: { id: number; name?: ItemBase["name"] } | null;
};

export async function listCategories(params?: { page?: number; perPage?: number; parent?: string | number }) {
  return apiGet<ListResponse<CategoryItem>>("/api/categories", {
    page: params?.page ?? 1,
    perPage: params?.perPage ?? 10,
    parent: params?.parent ?? "",
  });
}

export async function getCategory(id: string | number) {
  return apiGet<CategoryItem>(`/api/categories/${id}`);
}

export async function createCategory(payload: Partial<CategoryItem>) {
  return apiSend<CategoryItem>("/api/categories", "POST", payload);
}

export async function updateCategory(id: string | number, payload: Partial<CategoryItem>) {
  return apiSend<CategoryItem>(`/api/categories/${id}`, "PUT", payload);
}

export async function deleteCategory(id: string | number) {
  return apiSend<{ status: string; message?: string }>(`/api/categories/${id}`, "DELETE");
}