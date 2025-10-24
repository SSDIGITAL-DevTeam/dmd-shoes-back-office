// app/api/user/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

// Contoh: NEXT_PUBLIC_API_URL="https://api.dmdshoeparts.com/api/v1"
const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

/** ===== Simple in-memory cache (per Node.js worker) ===== */
type Cached = {
  body: string;                 // raw text (agar transparan ke client)
  status: number;
  contentType: string;
  ts: number;                   // timestamp disimpan
};
const cache = new Map<string, Cached>();

// Atur TTL sesuai kebutuhan. 20–60 dtk biasanya pas untuk “sekali per page”.
const TTL_MS = 30_000; // 30 detik

function readBearer(req: NextRequest): string | null {
  const h = req.headers.get("authorization");
  if (h?.toLowerCase().startsWith("bearer ")) return h.slice(7);
  return req.cookies.get("access_token")?.value ?? null;
}

/** Key cache dipisah per token agar user berbeda tidak saling berbagi cache */
function makeCacheKey(token: string | null) {
  // Bila ingin benar-benar “per page”, Anda bisa ikutkan pathname dari Referer:
  // const ref = req.headers.get("referer") ?? "";
  // return `${token ?? "anon"}|${new URL(ref).pathname || "/"}`;
  return token ?? "anon";
}

export async function GET(req: NextRequest) {
  const token = readBearer(req);
  const key = makeCacheKey(token);
  const now = Date.now();

  // 1) Cek cache
  const hit = cache.get(key);
  if (hit && now - hit.ts < TTL_MS) {
    return new NextResponse(hit.body || "{}", {
      status: hit.status,
      headers: {
        "content-type": hit.contentType || "application/json",
        // Browser hint: simpan sementara supaya tidak refetch tiap render
        "cache-control": `private, max-age=${Math.floor(TTL_MS / 1000)}`,
        "x-user-endpoint-cache": "HIT",
      },
    });
  }

  // 2) Miss → fetch ke upstream
  const upstream = await fetch(`${API}/user`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    // Hapus "no-store" agar tidak memaksa refetch di layer bawah
    // Biarkan default (cacheable oleh Node/undici bila cocok)
  });

  const body = await upstream.text().catch(() => "");
  const contentType = upstream.headers.get("content-type") ?? "application/json";

  // 3) Simpan ke cache hanya jika sukses (atau sesuai kebijakan Anda)
  //    Di sini tetap cache-kan semua status 2xx. Ubah bila perlu.
  if (upstream.ok) {
    cache.set(key, {
      body: body || "{}",
      status: upstream.status,
      contentType,
      ts: now,
    });
  }

  // 4) Kembalikan response
  return new NextResponse(body || "{}", {
    status: upstream.status,
    headers: {
      "content-type": contentType,
      // Beri petunjuk browser: bisa reuse untuk beberapa detik
      "cache-control": `private, max-age=${Math.floor(TTL_MS / 1000)}`,
      "x-user-endpoint-cache": upstream.ok ? "MISS_STORE" : "MISS_PASS",
    },
  });
}