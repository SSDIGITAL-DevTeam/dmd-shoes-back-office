export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { makeApiUrl, readCookie } from "../../../_utils/backend";

/** Anti-cache headers */
const noStore = {
  "content-type": "application/json",
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
} as const;

/** Bangun header auth + cookie dasar */
function buildAuthHeaders(req: NextRequest) {
  const h = new Headers();
  h.set("Accept", "application/json");
  h.set("X-Requested-With", "XMLHttpRequest");

  // Ambil token dari Authorization header atau cookie
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

/** Proxy utama */
async function proxy(req: NextRequest) {
  try {
    const slug = req.nextUrl.pathname.replace(/^\/api\/homepage\/?/, "");
    const upstreamUrl = makeApiUrl(`homepage/${slug}`);

    const clientCT = req.headers.get("content-type") || "";
    const upstreamHeaders = buildAuthHeaders(req);

    // ⚠️ Teruskan Content-Type dari client untuk non-multipart
    if (clientCT && !clientCT.startsWith("multipart/form-data")) {
      upstreamHeaders.set("Content-Type", clientCT);
    }

    const init: RequestInit & { duplex?: "half" } = {
      method: req.method,
      headers: upstreamHeaders,
    };

    // Hanya kirim body untuk method non-GET/HEAD
    if (!["GET", "HEAD"].includes(req.method)) {
      if (clientCT.startsWith("multipart/form-data")) {
        // ✅ Rebuild FormData agar stabil (hindari forward stream mentah)
        const inFd = await req.formData();
        const outFd = new FormData();
        inFd.forEach((val, key) => outFd.append(key, val as any));
        init.body = outFd;
        // ❌ Jangan set Content-Type manual, biar undici yang urus boundary
      } else {
        // JSON / urlencoded / raw
        const buf = await req.arrayBuffer();
        init.body = buf;
        // Content-Type sudah diteruskan dari client di atas
      }
    }

    const r = await fetch(upstreamUrl, init);

    // === Response handling ===
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

    const body = r.body ? r.body : await r.arrayBuffer();
    return new NextResponse(body as any, {
      status: r.status,
      headers: antiCache,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        status: "error",
        message: e?.message || "Proxy error (/api/homepage/*)",
      },
      { status: 503, headers: noStore }
    );
  }
}

/** Bind semua method ke proxy */
export async function GET(req: NextRequest) {
  return proxy(req);
}
export async function POST(req: NextRequest) {
  return proxy(req);
}
export async function PUT(req: NextRequest) {
  return proxy(req);
}
export async function PATCH(req: NextRequest) {
  return proxy(req);
}
export async function DELETE(req: NextRequest) {
  return proxy(req);
}
