export async function http<T>(input: string, init?: RequestInit): Promise<T> {
  // Force ke route internal Next supaya semua request lewat proxy
  const url = input.startsWith("/api/") ? input : `/api${input.startsWith("/") ? "" : "/"}${input}`;
  const res = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json", ...(init?.headers || {}) },
    ...init
  });
  const json = (await res.json().catch(() => null)) as T | null;
  if (!res.ok) {
    const message = (json as any)?.message || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return (json as T) ?? ({} as T);
}