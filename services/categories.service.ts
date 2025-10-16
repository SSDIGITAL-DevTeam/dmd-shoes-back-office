// services/categories.service.ts
import { apiGet, apiSend } from "@/lib/api/client";
import type { ItemBase, ListResponse } from "@/types";

export type CategoryItem = ItemBase & {
  parent_id?: number | null;
  parent?: { id: number; name?: ItemBase["name"] } | null;
};

// NOTE: folder internal Next adalah "app/api/category" (singular)
// jadi public path-nya "/api/category" (BUKAN "/api/categories")
export async function listCategories(params?: { page?: number; perPage?: number; parent?: string | number }) {
  return apiGet<ListResponse<CategoryItem>>("/api/category", {
    page: params?.page ?? 1,
    perPage: params?.perPage ?? 10,
    parent: params?.parent ?? "",
  });
}

export async function getCategory(id: string | number) {
  return apiGet<CategoryItem>(`/api/category/${id}`);
}

export async function createCategory(payload: Partial<CategoryItem> | FormData) {
  if (typeof FormData !== "undefined" && payload instanceof FormData) {
    const res = await fetch("/api/category", { method: "POST", body: payload });
    if (!res.ok) throw new Error(`POST /api/category failed: ${res.status}`);
    return (await res.json()) as any;
  }
  return apiSend<CategoryItem>("/api/category", "POST", payload);
}

export async function updateCategory(id: string | number, payload: Partial<CategoryItem> | FormData) {
  if (typeof FormData !== "undefined" && payload instanceof FormData) {
    const res = await fetch(`/api/category/${id}`, { method: "PUT", body: payload });
    if (!res.ok) throw new Error(`PUT /api/category/${id} failed: ${res.status}`);
    return (await res.json()) as any;
  }
  return apiSend<CategoryItem>(`/api/category/${id}`, "PUT", payload);
}

export async function deleteCategory(id: string | number) {
  return apiSend<{ status: string; message?: string }>(`/api/category/${id}`, "DELETE");
}