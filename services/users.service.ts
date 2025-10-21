// services/users.service.ts
export type LaravelUser = {
  id: number | string;
  name: string;
  email: string;
  status: boolean | string | number | null;
};

export type Meta = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};

export type UsersResponse = {
  status?: string;
  message?: string;
  data: LaravelUser[];
  meta: Meta;
};

type ListParams = {
  page?: number;
  perPage?: number;   // FE convenience
  per_page?: number;  // kunci yang benar untuk BE
  search?: string;
  status?: "" | "all" | "active" | "inactive";
  role?: string; // <── tambah
  sort?: string;
  order?: "asc" | "desc";
};

function buildQuery(p: ListParams = {}) {
  const s = new URLSearchParams();
  if (p.page) s.set("page", String(p.page));
  const per = p.per_page ?? p.perPage;
  if (per) s.set("per_page", String(per));
  if (p.search) s.set("search", p.search);
  if (p.status) s.set("status", p.status);
  if (p.role) s.set("role", p.role); // <── tambah baris ini
  if (p.sort) s.set("sort", p.sort);
  if (p.order) s.set("order", p.order);
  return s.toString();
}

export async function listUsers(params: ListParams = {}): Promise<UsersResponse> {
  const qs = buildQuery(params);
  const res = await fetch(`/api/users${qs ? `?${qs}` : ""}`, {
    method: "GET",
    headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
    cache: "no-store",
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  const rows: LaravelUser[] = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data) ? data : [];
  const meta: Meta =
    data?.meta ?? {
      current_page: Number(data?.current_page || 1),
      per_page: Number(data?.per_page || rows.length || 10),
      total: Number(data?.total || rows.length),
      last_page: Number(data?.last_page || 1),
    };
  return { status: data?.status || "success", message: data?.message, data: rows, meta };
}

export async function getUser(id: string | number): Promise<any> {
  const res = await fetch(`/api/users/${id}`, {            // <-- PASTIKAN diawali '/'
    method: "GET",
    headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
    cache: "no-store",
  });
  const text = await res.text();
  let data: any = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; } // hindari error '<!DOCTYPE'
  if (!res.ok) throw new Error(data?.message || "Get user failed");
  // backend kadang balas {data:{...}} atau langsung {...}
  return (data && typeof data === "object" && "data" in data) ? data.data : data;
}

export async function updateUser(id: string | number, payload: Partial<{name: string; email: string; status: boolean;}>) {
  const res = await fetch(`/api/users/${id}`, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let data: any = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
  if (!res.ok) throw new Error(data?.message || "Update user failed");
  return data;
}

export async function deleteUser(id: string | number) {
  const res = await fetch(`/api/users/${id}`, {
    method: "DELETE",
    headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(data?.message || "Delete user failed");
  return data;
}

/**
 * Create Admin user via backend route:
 * Route::post('/auth/admin/register', AdminRegisterController::class);
 * FE hit ke proxy: POST /api/auth/admin/register
 */
export async function createUser(payload: {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  status?: boolean; // default true
}) {
  const res = await fetch(`/api/auth/admin/register`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: payload.name,
      email: payload.email,
      password: payload.password,
      password_confirmation: payload.password_confirmation,
      status: payload.status === undefined ? true : payload.status,
    }),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(data?.message || "Create user failed");
  return data;
}