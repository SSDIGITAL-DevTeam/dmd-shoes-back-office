type Params = Record<string, string | number | boolean | null | undefined>;

function withParams(path: string, params?: Params) {
  if (!params || Object.keys(params).length === 0) return path;
  const url = new URL(path, "http://local"); // dummy base untuk path relatif
  Object.entries(params).forEach(([k, v]) => {
    if (v === null || v === undefined || v === "") return;
    url.searchParams.set(k, String(v));
  });
  return url.pathname + (url.search || "");
}

// === Auth helpers (Bearer dari cookie "access_token")
function getAccessToken(): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|; )access_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

/** Pastikan selalu return Record<string,string> valid untuk HeadersInit */
function withAuth(base: Record<string, string> = {}): Record<string, string> {
  const t = getAccessToken();
  return t ? { ...base, Authorization: `Bearer ${t}` } : base;
}

async function parseBody(res: Response) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    try {
      return await res.json();
    } catch {
      return { status: "error", message: "Invalid JSON response" };
    }
  }
  return await res.text();
}

function enrichErr(res: Response, body: any) {
  const msg =
    (typeof body === "object" && (body?.message || body?.error)) ||
    `Request failed (${res.status})`;
  const err = new Error(msg);
  (err as any).status = res.status;
  (err as any).body = body;
  return err;
}

export async function apiGet<T>(path: string, params?: Params): Promise<T> {
  const res = await fetch(withParams(path, params), {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    headers: withAuth({ Accept: "application/json" }),
  });
  const data = await parseBody(res);
  if (!res.ok) throw enrichErr(res, data);
  return data as T;
}

export async function apiSend<T>(
  path: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body?: unknown
): Promise<T> {
  const res = await fetch(path, {
    method,
    credentials: "include",
    headers: withAuth({
      Accept: "application/json",
      "Content-Type": "application/json",
    }),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await parseBody(res);
  if (!res.ok) throw enrichErr(res, data);
  return data as T;
}

/** Kirim FormData (upload file). Jangan set Content-Type manual. */
export async function apiSendForm<T>(
  path: string,
  method: "POST" | "PUT" | "PATCH",
  form: FormData
): Promise<T> {
  const res = await fetch(path, {
    method,
    credentials: "include",
    headers: withAuth({ Accept: "application/json" }),
    body: form,
  });
  const data = await parseBody(res);
  if (!res.ok) throw enrichErr(res, data);
  return data as T;
}