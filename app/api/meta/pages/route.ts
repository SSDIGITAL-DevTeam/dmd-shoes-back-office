// app/api/meta/pages/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { makeApiUrl } from "../../../_utils/backend";

const noStore = {
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
    const tok = raw.split(";").map(s => s.trim()).find(s => s.startsWith("access_token="))?.split("=")[1];
    if (tok) h.set("Authorization", `Bearer ${decodeURIComponent(tok)}`);
  }

  const cookie = req.headers.get("cookie"); if (cookie) h.set("Cookie", cookie);
  const origin = req.headers.get("origin"); if (origin) h.set("Origin", origin);
  const referer = req.headers.get("referer"); if (referer) h.set("Referer", referer);
  return h;
}

// GET /api/meta/pages  → forwards to  {BASE}/api/v1/meta/pages
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // normalisasi query
    const page    = searchParams.get("page") ?? "";
    const perPage = searchParams.get("per_page") ?? searchParams.get("perPage") ?? "";
    const search  = searchParams.get("search") ?? "";
    const sort    = searchParams.get("sort") ?? "";
    const order   = searchParams.get("order") ?? "";

    const qs = new URLSearchParams();
    if (page) qs.set("page", page);
    if (perPage) qs.set("per_page", perPage);
    if (search) qs.set("search", search);
    if (sort) qs.set("sort", sort);
    if (order) qs.set("order", order);

    // ⬇️ perhatikan path: /api/v1/meta/pages
    const url = makeApiUrl(`/meta/pages${qs.toString() ? `?${qs}` : ""}`);

    const res = await fetch(url, {
      method: "GET",
      headers: makeAuthHeaders(req),
      cache: "no-store",
      // @ts-ignore
      next: { revalidate: 0 },
      credentials: "include",
    });

    const body = await res.text().catch(() => "");
    return new Response(body || "{}", { status: res.status, headers: noStore });
  } catch (e: any) {
    return NextResponse.json(
      { status: "error", message: e?.message || "Proxy /api/meta/pages failed" },
      { status: 502, headers: noStore }
    );
  }
}