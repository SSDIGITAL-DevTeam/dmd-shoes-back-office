type Query = Record<string, any>;

const toQS = (q?: Query) => {
  if (!q) return "";
  const s = new URLSearchParams();
  Object.entries(q).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    s.set(k, String(v));
  });
  const out = s.toString();
  return out ? `?${out}` : "";
};

// Selalu pukul route internal Next.js
const base = "/api";

async function request<T>(method: string, path: string, init?: RequestInit): Promise<T> {
  const url = path.startsWith("/api/") ? path : `${base}${path.startsWith("/") ? "" : "/"}${path}`;
  const res = await fetch(url, {
    method,
    cache: "no-store",
    ...init,
  });

  const text = await res.text();
  let data: any = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }

  if (!res.ok) {
    const msg = data?.message || `Request failed (${res.status})`;
    throw Object.assign(new Error(msg), { status: res.status, data });
  }
  return data as T;
}

const api = {
  get: <T = any>(path: string, opts?: { params?: Query; init?: RequestInit }) =>
    request<T>("GET", `${path}${toQS(opts?.params)}`, opts?.init),
  post: <T = any>(path: string, body?: any, init?: RequestInit) =>
    request<T>("POST", path, {
      ...(init || {}),
      headers: body instanceof FormData ? init?.headers : { "Content-Type": "application/json", ...(init?.headers || {}) },
      body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
    }),
  patch: <T = any>(path: string, body?: any, init?: RequestInit) =>
    request<T>("PATCH", path, {
      ...(init || {}),
      headers: body instanceof FormData ? init?.headers : { "Content-Type": "application/json", ...(init?.headers || {}) },
      body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
    }),
  delete: <T = any>(path: string, init?: RequestInit) =>
    request<T>("DELETE", path, init),
};

export default api;