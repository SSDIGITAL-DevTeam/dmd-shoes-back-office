// app/api/meta/pages/[pageId]/tags/[tagId]/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { makeApiUrl } from "../../../../../../_utils/backend";

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
    const token = raw.split(";").map(s => s.trim()).find(s => s.startsWith("access_token="))?.split("=")[1];
    if (token) h.set("Authorization", `Bearer ${decodeURIComponent(token)}`);
  }

  const cookie = req.headers.get("cookie"); if (cookie) h.set("Cookie", cookie);
  const origin = req.headers.get("origin"); if (origin) h.set("Origin", origin);
  const referer = req.headers.get("referer"); if (referer) h.set("Referer", referer);
  return h;
}

// GET /api/meta/pages/:pageId/tags/:tagId
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ pageId: string; tagId: string }> }
) {
  try {
    const { pageId, tagId } = await ctx.params;
    const url = makeApiUrl(`/meta/pages/${encodeURIComponent(pageId)}/tags/${encodeURIComponent(tagId)}`);
    const res = await fetch(url, {
      method: "GET",
      headers: makeAuthHeaders(_req),
      cache: "no-store",
      // @ts-ignore
      next: { revalidate: 0 },
      credentials: "include",
    });
    const text = await res.text().catch(() => "");
    return new Response(text || "{}", { status: res.status, headers: noStore });
  } catch (err: any) {
    return NextResponse.json({ status: "error", message: err?.message || "Proxy GET /meta/pages/:pageId/tags/:tagId failed" }, { status: 502, headers: noStore });
  }
}

// PATCH /api/meta/pages/:pageId/tags/:tagId
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ pageId: string; tagId: string }> }
) {
  try {
    const { pageId, tagId } = await ctx.params;
    const body = await req.text();
    const url = makeApiUrl(`/meta/pages/${encodeURIComponent(pageId)}/tags/${encodeURIComponent(tagId)}`);

    const res = await fetch(url, {
      method: "PATCH",
      headers: makeAuthHeaders(req),
      body,
      // @ts-ignore
      duplex: "half",
      cache: "no-store",
      // @ts-ignore
      next: { revalidate: 0 },
      credentials: "include",
    });

    const text = await res.text().catch(() => "");
    return new Response(text || "{}", { status: res.status, headers: noStore });
  } catch (err: any) {
    return NextResponse.json({ status: "error", message: err?.message || "Proxy PATCH /meta/pages/:pageId/tags/:tagId failed" }, { status: 502, headers: noStore });
  }
}

// DELETE /api/meta/pages/:pageId/tags/:tagId
export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ pageId: string; tagId: string }> }
) {
  try {
    const { pageId, tagId } = await ctx.params;
    const url = makeApiUrl(`/meta/pages/${encodeURIComponent(pageId)}/tags/${encodeURIComponent(tagId)}`);

    const res = await fetch(url, {
      method: "DELETE",
      headers: makeAuthHeaders(req),
      cache: "no-store",
      // @ts-ignore
      next: { revalidate: 0 },
      credentials: "include",
    });

    const text = await res.text().catch(() => "");
    return new Response(text || "{}", { status: res.status, headers: noStore });
  } catch (err: any) {
    return NextResponse.json({ status: "error", message: err?.message || "Proxy DELETE /meta/pages/:pageId/tags/:tagId failed" }, { status: 502, headers: noStore });
  }
}
