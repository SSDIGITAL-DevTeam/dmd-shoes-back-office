// services/users.service.ts
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
  if (!Array.isArray(r.data) && (r as any)?.data?.data) {
    const maybe = (r as any).data;
    return { data: maybe.data as LaravelUser[], meta: maybe.meta as Meta };
  }
  return r;
}

export async function getUser(id: string | number) {
  const res = await fetch(`/api/users/${id}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    credentials: "include",
  });
  const text = await res.text().catch(() => "");
  const data = text ? JSON.parse(text) : {};
  return data?.data ?? data;
}

/** ====== CREATE with graceful fallback ======
 * Urutan percobaan:
 * 1) POST /api/users
 * 2) POST /api/users/store
 * 3) POST /api/auth/register
 */
async function tryCreate(path: string, body: any) {
  return http<Envelope<LaravelUser>>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function createUser(body: { name: string; email: string; password: string; status?: boolean }) {
  try {
    const r1 = await tryCreate(`/api/users`, body);
    return r1.data!;
  } catch (e: any) {
    const msg = (e?.message || "").toLowerCase();
    const text = (e?.data?.message || e?.raw || "").toLowerCase();
    // deteksi “post not supported”/405/MethodNotAllowed
    const methodNotAllowed =
      msg.includes("not supported") ||
      msg.includes("405") ||
      text.includes("not supported") ||
      text.includes("method not allowed");
    if (!methodNotAllowed) throw e;
  }

  // fallback #1
  try {
    const r2 = await tryCreate(`/api/users/store`, body);
    return r2.data!;
  } catch (e2: any) {
    // fallback #2
    const r3 = await tryCreate(`/api/auth/register`, body);
    return r3.data!;
  }
}

export async function updateUser(
  id: string | number,
  body: Partial<Pick<LaravelUser, "name" | "email" | "status">>
) {
  const r = await http<Envelope<LaravelUser>>(`/api/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return r.data!;
}

export async function deleteUser(id: string | number) {
  return http<Envelope<unknown>>(`/api/users/${id}`, { method: "DELETE" });
}