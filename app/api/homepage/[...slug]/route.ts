// app/api/homepage/[...slug]/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { makeApiUrl, readCookie } from "../../../_utils/backend";

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

  const fromHeader = req.headers.get("authorization");
  if (fromHeader) {
    h.set("Authorization", fromHeader);
  } else {
    const token = readCookie(req.headers.get("cookie"), "access_token");
    if (token) h.set("Authorization", `Bearer ${token}`);
  }

  const cookie = req.headers.get("cookie");
  if (cookie) h.set("Cookie", cookie);

  return h;
}

async function proxy(req: NextRequest) {
  try {
    const slug = req.nextUrl.pathname.replace(/^\/api\/homepage\/?/, "");
    const upstreamUrl = makeApiUrl(`homepage/${slug}`);

    const init: RequestInit & { duplex?: "half" } = {
      method: req.method,
      headers: buildAuthHeaders(req),
    };

    if (!["GET", "HEAD"].includes(req.method)) {
      const ct = req.headers.get("content-type") || "";

      if (ct.startsWith("multipart/form-data")) {
        // ✅ Cara stabil: re-build FormData (hindari forward stream mentah)
        const inFd = await req.formData();
        const outFd = new FormData();
        // copy semua field/berkas apa adanya
        inFd.forEach((val, key) => {
          // val bisa string atau File (web File)
          outFd.append(key, val as any);
        });
        init.body = outFd; // undici akan set boundary sendiri
        // TIDAK perlu/tidak boleh set content-type manual
      } else {
        // JSON / x-www-form-urlencoded / raw
        const buf = await req.arrayBuffer();
        init.body = buf;
        // biarkan header content-type dari client; kita tidak memaksa
      }
    }

    const r = await fetch(upstreamUrl, init);

    // Jika bukan OK, kirimkan body asli agar terlihat pesan BE (422/401/405)
    const ctUp = r.headers.get("content-type") || "application/json";
    const antiCache = new Headers(noStore);
    antiCache.set("content-type", ctUp);

    if (!r.ok) {
      const errText = await r.text().catch(() => "");
      return new NextResponse(errText || JSON.stringify({ status: r.status }), {
        status: r.status,
        headers: antiCache,
      });
    }

    // OK → streamkan
    const body = r.body ? r.body : await r.arrayBuffer();
    return new NextResponse(body as any, { status: r.status, headers: antiCache });
  } catch (e: any) {
    return NextResponse.json(
      { status: "error", message: e?.message || "Proxy error (/api/homepage/*)" },
      { status: 503, headers: noStore }
    );
  }
}

export async function GET(req: NextRequest)    { return proxy(req); }
export async function POST(req: NextRequest)   { return proxy(req); }
export async function PUT(req: NextRequest)    { return proxy(req); }
export async function PATCH(req: NextRequest)  { return proxy(req); }
export async function DELETE(req: NextRequest) { return proxy(req); }