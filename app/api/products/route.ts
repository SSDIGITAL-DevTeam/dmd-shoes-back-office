// app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server";

/** Forward helper */
async function forward(req: NextRequest, targetUrl: string) {
  const hdrs = new Headers(req.headers);
  hdrs.set("Accept", "application/json");
  hdrs.set("X-Requested-With", "XMLHttpRequest");
  // Hindari header Host/Content-Length yang mengganggu
  hdrs.delete("host");
  hdrs.delete("content-length");

  const init: RequestInit = {
    method: req.method,
    headers: hdrs,
    body: ["POST", "PUT", "PATCH", "DELETE"].includes(req.method)
      ? await req.text()
      : undefined,
    cache: "no-store",
  };

  const resp = await fetch(targetUrl, init);
  const text = await resp.text();

  // Selalu no-store untuk proxy
  const headers = new Headers({
    "content-type": "application/json",
    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    Pragma: "no-cache",
    Expires: "0",
  });

  return new NextResponse(text, { status: resp.status, headers });
}

export async function GET(req: NextRequest) {
  const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
  const url = new URL(req.url);
  const qs = new URLSearchParams(url.search);

  // Normalisasi parameter: perPage -> per_page (sesuai Laravel)
  if (qs.has("perPage") && !qs.has("per_page")) {
    qs.set("per_page", qs.get("perPage") || "");
    qs.delete("perPage");
  }

  // Default aman
  if (!qs.has("page")) qs.set("page", "1");
  if (!qs.has("per_page")) qs.set("per_page", "12");

  const target = `${base}/products?${qs.toString()}`;
  return forward(req, target);
}

export async function POST(req: NextRequest) {
  const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
  const target = `${base}/products`;
  return forward(req, target);
}