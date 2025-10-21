import { NextRequest } from "next/server";
import { makeApiUrl } from "../../_utils/backend";

const noStoreHeaders = {
  "content-type": "application/json",
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
} as const;

function makeAuthHeaders(req: NextRequest) {
  const h = new Headers();
  h.set("Accept", "application/json");
  h.set("X-Requested-With", "XMLHttpRequest");
  const auth = req.headers.get("authorization");
  if (auth) h.set("Authorization", auth);

  if (!auth) {
    const raw = req.headers.get("cookie") || "";
    const token = raw.split(";").map(s => s.trim()).find(s => s.startsWith("access_token="))?.split("=")[1];
    if (token) h.set("Authorization", `Bearer ${decodeURIComponent(token)}`);
  }

  const cookie = req.headers.get("cookie");
  if (cookie) h.set("Cookie", cookie);
  const origin = req.headers.get("origin");
  if (origin) h.set("Origin", origin);
  const referer = req.headers.get("referer");
  if (referer) h.set("Referer", referer);
  return h;
}

/** GET /api/users → forwards to {{baseURL}}/api/v1/users */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page    = searchParams.get("page") ?? "";
  const perPage = searchParams.get("per_page") ?? searchParams.get("perPage") ?? "";
  const status  = searchParams.get("status") ?? "";
  const search  = searchParams.get("search") ?? "";
  const sort    = searchParams.get("sort") ?? "";
  const order   = searchParams.get("order") ?? "";

  const qs = new URLSearchParams();
  if (page) qs.set("page", page);
  if (perPage) qs.set("per_page", perPage);
  if (status) qs.set("status", status); // kirim hanya jika ada (All = tidak dikirim)
  if (search) qs.set("search", search);
  if (sort) qs.set("sort", sort);
  if (order) qs.set("order", order);

  const res = await fetch(makeApiUrl(`/users?${qs.toString()}`), {
    method: "GET",
    headers: makeAuthHeaders(req),
    cache: "no-store",
    // @ts-ignore
    next: { revalidate: 0 },
    credentials: "include",
  });

  const txt = await res.text().catch(() => "");
  return new Response(txt || "{}", { status: res.status, headers: noStoreHeaders });
}