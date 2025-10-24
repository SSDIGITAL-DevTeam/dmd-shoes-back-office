// app/api/homepage/[...slug]/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { makeApiUrl } from "../../../_utils/backend";

const noStore = {
  "content-type": "application/json",
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
} as const;

function buildAuthHeaders(req: NextRequest) {
  const h = new Headers();
  h.set("Accept", "application/json");
  h.set("X-Requested-With", "XMLHttpRequest");

  // Authorization dari header atau cookie access_token
  const fromHeader = req.headers.get("authorization");
  if (fromHeader) {
    h.set("Authorization", fromHeader);
  } else {
    const rawCookie = req.headers.get("cookie") || "";
    const token = rawCookie
      .split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith("access_token="))
      ?.split("=")[1];
    if (token) h.set("Authorization", `Bearer ${decodeURIComponent(token)}`);
  }

  // Bawa cookie untuk kasus yang perlu
  const cookie = req.headers.get("cookie");
  if (cookie) h.set("Cookie", cookie);

  return h;
}

async function proxy(req: NextRequest) {
  const slug = req.nextUrl.pathname.split("/").slice(3); // /api/homepage/... -> ambil setelah 'homepage'
  const upstreamUrl = makeApiUrl("/homepage/" + slug.join("/")) + req.nextUrl.search;

  const headers = buildAuthHeaders(req);

  // Siapkan opsi fetch
  const init: RequestInit = {
    method: req.method,
    headers,
    // penting untuk streaming body (hindari error duplex)
    // @ts-expect-error - Node fetch custom
    duplex: "half",
    cache: "no-store",
  };

  // Forward body untuk metode yang membawa body
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    // NOTE: biarkan body apa adanya (JSON/FormData/stream)
    init.body = req.body as any;
  }

  const r = await fetch(upstreamUrl, init);

  // Teruskan hasil ke client
  const resHeaders = new Headers(noStore);
  // forward content-type dari upstream jika ada
  const ct = r.headers.get("content-type");
  if (ct) resHeaders.set("content-type", ct);

  const body = r.body ? r.body : await r.arrayBuffer();
  return new NextResponse(body as any, { status: r.status, headers: resHeaders });
}

export async function GET(req: NextRequest)    { return proxy(req); }
export async function POST(req: NextRequest)   { return proxy(req); }
export async function PUT(req: NextRequest)    { return proxy(req); }
export async function PATCH(req: NextRequest)  { return proxy(req); }
export async function DELETE(req: NextRequest) { return proxy(req); }