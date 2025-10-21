// app/api/_utils/http.ts
export async function http<T>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(input, {
    cache: "no-store",
    headers: { Accept: "application/json", ...(init?.headers || {}) },
    ...init,
  });

  const text = await res.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch {}

  if (!res.ok) {
    const message = json?.message || `Request failed (${res.status})`;
    throw new Response(message, { status: res.status });
  }
  return (json ?? {}) as T;
}