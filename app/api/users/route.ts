// app/api/users/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
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

  // Authorization header langsung dipakai bila ada
  const auth = req.headers.get("authorization");
  if (auth) h.set("Authorization", auth);

  // Atau ambil dari cookie access_token
  if (!auth) {
    const raw = req.headers.get("cookie") || "";
    const token = raw
      .split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith("access_token="))
      ?.split("=")[1];
    if (token) h.set("Authorization", `Bearer ${decodeURIComponent(token)}`);
  }

  // Teruskan cookie/origin/referer (kadang backend butuh)
  const cookie = req.headers.get("cookie");
  if (cookie) h.set("Cookie", cookie);
  const origin = req.headers.get("origin");
  if (origin) h.set("Origin", origin);
  const referer = req.headers.get("referer");
  if (referer) h.set("Referer", referer);

  return h;
}

/** GET /api/users → forward ke {{baseURL}}/api/v1/users */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Normalisasi nama param
    const page    = searchParams.get("page") ?? "";
    const perPage = searchParams.get("per_page") ?? searchParams.get("perPage") ?? "";
    const status  = searchParams.get("status") ?? ""; // "all" = jangan kirim
    const search  = searchParams.get("search") ?? "";
    const sort    = searchParams.get("sort") ?? "";
    const order   = searchParams.get("order") ?? "";

    const qs = new URLSearchParams();
    if (page) qs.set("page", page);
    if (perPage) qs.set("per_page", perPage);
    if (status && status !== "all") qs.set("status", status);
    if (search) qs.set("search", search);
    if (sort) qs.set("sort", sort);
    if (order) qs.set("order", order);

    const url = makeApiUrl(`/users${qs.toString() ? `?${qs}` : ""}`);

    const res = await fetch(url, {
      method: "GET",
      headers: makeAuthHeaders(req),
      cache: "no-store",
      // @ts-ignore
      next: { revalidate: 0 },
      credentials: "include",
    });

    const text = await res.text().catch(() => "");
    // Teruskan persis status backend agar UI bisa menangkap 401/403/5xx
    return new Response(text || "{}", { status: res.status, headers: noStoreHeaders });
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", message: err?.message || "Proxy /api/users failed" },
      { status: 502, headers: noStoreHeaders }
    );
  }
}