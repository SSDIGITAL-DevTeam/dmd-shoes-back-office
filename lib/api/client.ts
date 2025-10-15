// lib/api/client.ts
type Params = Record<string, string | number | boolean | null | undefined>;

function withParams(path: string, params?: Params) {
  if (!params) return path;
  const url = new URL(path, "http://local"); // dummy base
  Object.entries(params).forEach(([k, v]) => {
    if (v === null || v === undefined || v === "") return;
    url.searchParams.set(k, String(v));
  });
  return url.pathname + (url.search || "");
}

export async function apiGet<T>(path: string, params?: Params): Promise<T> {
  const res = await fetch(withParams(path, params), {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

export async function apiSend<T>(
  path: string,
  method: "POST" | "PUT" | "DELETE",
  body?: unknown
): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}