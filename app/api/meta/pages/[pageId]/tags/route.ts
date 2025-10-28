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

function makeAuthHeaders(req: NextRequest, hasBody = false) {
  const h = new Headers();

  // Selalu kirim Accept & XRW seperti modul products
  h.set("Accept", "application/json");
  h.set("X-Requested-With", "XMLHttpRequest");

  // Authorization dari header / cookie access_token
  const auth = req.headers.get("authorization");
  if (auth) h.set("Authorization", auth);

  if (!auth) {
    const rawCookie = req.headers.get("cookie") || "";
    const token = rawCookie
      .split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith("access_token="))
      ?.split("=")[1];
    if (token) h.set("Authorization", `Bearer ${decodeURIComponent(token)}`);
  }

  // Content-Type hanya bila ada body
  if (hasBody) {
    const ct = req.headers.get("content-type");
    if (ct) h.set("Content-Type", ct);
  }

  // Teruskan cookie/origin/referer persis seperti modul products/category
  const cookie = req.headers.get("cookie"); if (cookie) h.set("Cookie", cookie);
  const origin = req.headers.get("origin"); if (origin) h.set("Origin", origin);
  const referer = req.headers.get("referer"); if (referer) h.set("Referer", referer);

  return h;
}

function passthrough(up: Response) {
  const ct = up.headers.get("content-type") || "application/json";
  return up
    .clone()
    .text()
    .then((txt) => new Response(txt || "{}", { status: up.status, headers: { ...noStore, "content-type": ct } }));
}

// GET /api/meta/pages/:pageId/tags
export async function GET(_req: NextRequest, { params }: { params: { pageId: string } }) {
  try {
    const url = makeApiUrl(`meta/pages/${encodeURIComponent(params.pageId)}/tags`);
    const up = await fetch(url, {
      method: "GET",
      headers: makeAuthHeaders(_req, false),
      cache: "no-store",
      // @ts-ignore
      next: { revalidate: 0 },
      credentials: "include",
    });
    return passthrough(up);
  } catch (e: any) {
    return NextResponse.json({ status: "error", message: e?.message || "Proxy GET meta tags failed" }, { status: 502, headers: noStore });
  }
}

// POST /api/meta/pages/:pageId/tags
export async function POST(req: NextRequest, { params }: { params: { pageId: string } }) {
  try {
    const body = await req.text(); // pass-through body (JSON/FormData)
    const url = makeApiUrl(`meta/pages/${encodeURIComponent(params.pageId)}/tags`);

    const up = await fetch(url, {
      method: "POST",
      headers: makeAuthHeaders(req, true),
      body,
      // @ts-ignore
      duplex: "half",
      cache: "no-store",
      // @ts-ignore
      next: { revalidate: 0 },
      credentials: "include",
    });
    return passthrough(up);
  } catch (e: any) {
    return NextResponse.json({ status: "error", message: e?.message || "Proxy POST meta tags failed" }, { status: 502, headers: noStore });
  }
}