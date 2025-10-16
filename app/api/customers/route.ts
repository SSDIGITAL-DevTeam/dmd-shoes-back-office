import { NextRequest } from "next/server";
import { ensureEnvOrThrow, makeApiUrl, readCookie } from "../_utils/backend";
import { http } from "../_utils/http";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function forwardAuth(req: NextRequest) {
  const headers: Record<string, string> = {};
  const auth = req.headers.get("authorization");
  if (auth) headers.Authorization = auth;

  const cookie = req.headers.get("cookie");
  const token =
    readCookie(cookie, "access_token") ||
    readCookie(cookie, "auth_token") ||
    readCookie(cookie, "api_token") ||
    readCookie(cookie, "token");
  if (!headers.Authorization && token) headers.Authorization = `Bearer ${token}`;
  if (cookie) headers.Cookie = cookie;
  headers["X-Requested-With"] = "XMLHttpRequest";
  return headers;
}

export async function GET(req: NextRequest) {
  ensureEnvOrThrow();
  const { searchParams } = new URL(req.url);
  const page    = searchParams.get("page")    ?? "1";
  const perPage = searchParams.get("perPage") ?? "10";
  const search  = searchParams.get("search")  ?? "";

  // ====== PENTING: pastikan path yang dipanggil cocok dengan backend kamu ======
  // Jika backend kamu: /api/v1/customers → biarkan "customers"
  // Jika backend kamu: /api/v1/customer  → GANTI baris di bawah jadi "customer?...".
  const qs = new URLSearchParams({ page, per_page: perPage });
  if (search) { qs.set("search", search); qs.set("q", search); }

  try {
    const data = await http<any>(
      makeApiUrl(`customers?${qs.toString()}`),   // ← UBAH ke "customer?..." kalau backend singular
      { headers: forwardAuth(req) }
    );
    return Response.json(data);
  } catch (e: any) {
    const status = e?.status || 500;
    return Response.json(
      { status: "error", message: e?.message || "Upstream error", upstream: e?.payload ?? null },
      { status }
    );
  }
}