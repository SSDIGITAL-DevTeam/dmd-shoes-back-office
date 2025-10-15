const RAW_BASE = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "";

export function ensureEnvOrThrow() {
  if (!RAW_BASE) throw new Error("API_BASE_URL is not set");
}

/** Join path dengan 1 slash saja */
function join(a: string, b: string) {
  return `${a.replace(/\/+$/, "")}/${b.replace(/^\/+/, "")}`;
}

/** Terima path setelah v1, misal "products?..." → hasilkan http://host/api/v1/products?... */
export function makeApiUrl(pathAfterV1: string) {
  const base = (RAW_BASE || "").replace(/\/+$/, "");
  if (/\/api\/v1$/i.test(base)) return join(base, pathAfterV1);
  if (/\/api$/i.test(base))     return join(base, join("v1", pathAfterV1));
  return join(base, join("api/v1", pathAfterV1));
}

/** (opsional) helper parse cookie dari header */
export function readCookie(header: string | null, name: string) {
  if (!header) return undefined;
  const target = `${name}=`;
  const hit = header
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith(target));
  return hit ? decodeURIComponent(hit.slice(target.length)) : undefined;
}