import { http } from "./http";

export type LaravelUser = {
  id: number;
  name: string;
  email: string;
  status: boolean; // true = active
};

export type Meta = { current_page: number; per_page: number; total: number; last_page: number };
export type Envelope<T> = { status?: string; message?: string; data?: T };

export async function listUsers(params: {
  page?: number;
  per_page?: number;
  status?: "all" | "active" | "inactive";
  search?: string;
}): Promise<{ data: LaravelUser[]; meta: Meta }> {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.per_page) qs.set("per_page", String(params.per_page));
  if (params.status) qs.set("status", params.status);
  if (params.search) qs.set("search", params.search);

  const r = await http<{ data: LaravelUser[]; meta: Meta }>(`/api/users?${qs.toString()}`);
  // fallback bungkus
  if (!Array.isArray(r.data) && (r as any)?.data?.data) {
    const maybe = (r as any).data;
    return { data: maybe.data as LaravelUser[], meta: maybe.meta as Meta };
  }
  return r;
}

export async function createUser(body: { name: string; email: string; password: string; status?: boolean }) {
  const r = await http<Envelope<LaravelUser>>(`/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return r.data!;
}

export async function updateUser(id: string | number, body: Partial<Pick<LaravelUser, "name" | "email" | "status">>) {
  const r = await http<Envelope<LaravelUser>>(`/api/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  return r.data!;
}

export async function deleteUser(id: string | number) {
  return http<Envelope<unknown>>(`/api/users/${id}`, { method: "DELETE" });
}