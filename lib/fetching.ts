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
    credentials: "same-origin", // penting agar cookie ikut
    ...init,
  });

  const text = await res.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }

  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || `Request failed (${res.status})`;
    throw Object.assign(new Error(msg), { status: res.status, data });
  }
  return data as T;
}

const jsonOrFormHeaders = (body?: any, init?: RequestInit) =>
  body instanceof FormData
    ? init?.headers // biarkan browser set boundary multipart
    : { "Content-Type": "application/json", ...(init?.headers || {}) };

const jsonOrFormBody = (body?: any) =>
  body instanceof FormData ? body : JSON.stringify(body ?? {});

const api = {
  get: <T = any>(path: string, opts?: { params?: Query; init?: RequestInit }) =>
    request<T>("GET", `${path}${toQS(opts?.params)}`, opts?.init),

  post: <T = any>(path: string, body?: any, init?: RequestInit) =>
    request<T>("POST", path, {
      ...(init || {}),
      headers: jsonOrFormHeaders(body, init),
      body: jsonOrFormBody(body),
    }),

  patch: <T = any>(path: string, body?: any, init?: RequestInit) =>
    request<T>("PATCH", path, {
      ...(init || {}),
      headers: jsonOrFormHeaders(body, init),
      body: jsonOrFormBody(body),
    }),

  // <<< Tambahan: PUT >>>
  put: <T = any>(path: string, body?: any, init?: RequestInit) =>
    request<T>("PUT", path, {
      ...(init || {}),
      headers: jsonOrFormHeaders(body, init),
      body: jsonOrFormBody(body),
    }),

  delete: <T = any>(path: string, init?: RequestInit) =>
    request<T>("DELETE", path, init),
};

export default api;