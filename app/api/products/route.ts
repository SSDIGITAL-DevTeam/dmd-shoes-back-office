export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { ensureEnvOrThrow, makeApiUrl, readCookie } from "../_utils/backend";

/** GET /api/products → proxy ke Laravel GET /api/v1/products */
export async function GET(req: NextRequest) {
  try {
    ensureEnvOrThrow();

    const url = new URL(makeApiUrl("products"));
    // Teruskan query search/page/per_page/status, dsb.
    for (const [k, v] of Array.from(req.nextUrl.searchParams.entries())) url.searchParams.set(k, v);

    // Ambil bearer dari cookie (opsional, jika pakai Sanctum/token)
    const cookie = req.headers.get("cookie");
    const bearer = readCookie(cookie, "access_token");

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(bearer ? { Authorization: `Bearer ${bearer}` } : {})
      },
      cache: "no-store",
    });

    const json = await res.json().catch(() => ({}));
    return NextResponse.json(json, { status: res.status || 200 });
  } catch (e: any) {
    return NextResponse.json({ status: "error", message: e?.message || "Failed to fetch products" }, { status: 500 });
  }
}

/** POST /api/products → proxy ke Laravel POST /api/v1/products */
export async function POST(req: NextRequest) {
  try {
    ensureEnvOrThrow();

    const body = await req.json().catch(() => ({}));
    const url = makeApiUrl("products");
    const cookie = req.headers.get("cookie");
    const bearer = readCookie(cookie, "access_token");

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(bearer ? { Authorization: `Bearer ${bearer}` } : {})
      },
      body: JSON.stringify(body),
    });

    const json = await res.json().catch(() => ({}));
    return NextResponse.json(json, { status: res.status || 200 });
  } catch (e: any) {
    return NextResponse.json({ status: "error", message: e?.message || "Failed to create product" }, { status: 500 });
  }
}