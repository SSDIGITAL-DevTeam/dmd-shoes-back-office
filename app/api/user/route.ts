// app/api/user/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

// Contoh: NEXT_PUBLIC_API_URL="https://api.dmdshoeparts.com/api/v1"
const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

function readBearer(req: NextRequest): string | null {
  const h = req.headers.get("authorization");
  if (h?.toLowerCase().startsWith("bearer ")) return h.slice(7);
  return req.cookies.get("access_token")?.value ?? null;
}

export async function GET(req: NextRequest) {
  const token = readBearer(req);

  // kalau backend kamu bukan /user tapi /me, ganti path di bawah ini:
  const upstream = await fetch(`${API}/user`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });

  const text = await upstream.text().catch(() => "");
  return new NextResponse(text || "{}", {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "application/json",
      "cache-control": "no-store",
    },
  });
}