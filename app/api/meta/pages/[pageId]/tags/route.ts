// app/api/meta/pages/[pageId]/tags/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { makeApiUrl } from "../../../../../_utils/backend";

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
    const token = raw
      .split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith("access_token="))
      ?.split("=")[1];
    if (token) h.set("Authorization", `Bearer ${decodeURIComponent(token)}`);
  }

  const cookie = req.headers.get("cookie"); if (cookie) h.set("Cookie", cookie);
  const origin = req.headers.get("origin"); if (origin) h.set("Origin", origin);
  const referer = req.headers.get("referer"); if (referer) h.set("Referer", referer);
  return h;
}

/**
 * GET /api/meta/pages/:pageId/tags
 * → forwards to {{baseURL}}/api/v1/meta/pages/:pageId/tags[?locale=xx]
 */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ pageId: string }> }
) {
  try {
    const { pageId } = await ctx.params;
    const { searchParams } = new URL(req.url);
    const locale = searchParams.get("locale") ?? ""; // optional

    const qs = new URLSearchParams();
    if (locale) qs.set("locale", locale);

    const url = makeApiUrl(
      `/meta/pages/${encodeURIComponent(pageId)}/tags${qs.toString() ? `?${qs}` : ""}`
    );

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
      { status: "error", message: e?.message || "Proxy GET /meta/pages/:pageId/tags failed" },
      { status: 502, headers: noStore }
    );
  }
}

/**
 * POST /api/meta/pages/:pageId/tags
 * → forwards to {{baseURL}}/api/v1/meta/pages/:pageId/tags
 * (body diteruskan apa adanya; gunakan JSON atau form-data sesuai backend)
 */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ pageId: string }> }
) {
  try {
    const { pageId } = await ctx.params;
    const body = await req.text(); // pass-through body persis
    const url = makeApiUrl(`/meta/pages/${encodeURIComponent(pageId)}/tags`);

    const res = await fetch(url, {
      method: "POST",
      headers: makeAuthHeaders(req),
      body,
      // penting untuk request ber-body di Node fetch
      // @ts-ignore
      duplex: "half",
      cache: "no-store",
      // @ts-ignore
      next: { revalidate: 0 },
      credentials: "include",
    });

    const txt = await res.text().catch(() => "");
    return new Response(txt || "{}", { status: res.status, headers: noStore });
  } catch (e: any) {
    return NextResponse.json(
      { status: "error", message: e?.message || "Proxy POST /meta/pages/:pageId/tags failed" },
      { status: 502, headers: noStore }
    );
  }
}
