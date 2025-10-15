export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { ensureEnvOrThrow, makeApiUrl, readCookie } from "../../_utils/backend";

// GET detail produk → /api/products/:id → proxy ke Laravel /api/v1/products/:id
export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  try {
    ensureEnvOrThrow();
    const upstream = await fetch(makeApiUrl(`products/${ctx.params.id}`), {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    const text = await upstream.text();
    const data = text ? JSON.parse(text) : {};
    return NextResponse.json(data, { status: upstream.status || 200 });
  } catch (e: any) {
    return NextResponse.json({ status: "error", message: e?.message || "Failed to fetch product" }, { status: 500 });
  }
}

// PATCH edit produk (mendukung multipart) → /api/products/:id
export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    ensureEnvOrThrow();

    const cookie = req.headers.get("cookie");
    const bearer = readCookie(cookie, "access_token");
    const contentType = req.headers.get("content-type") || "";

    // headers ke upstream — jangan set Content-Type manual untuk multipart
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
      ...(contentType.toLowerCase().startsWith("multipart/form-data") ? {} : { "Content-Type": "application/json" }),
    };

    // body: kalau multipart → forward stream mentah; kalau JSON → stringify hasil req.json()
    let body: BodyInit | null = null;
    if (contentType.toLowerCase().startsWith("multipart/form-data")) {
      body = req.body as any; // ReadableStream
    } else if (contentType.toLowerCase().includes("application/json")) {
      const json = await req.json().catch(() => ({}));
      body = JSON.stringify(json);
    } else {
      body = (req as any).body ?? null;
    }

    const upstream = await fetch(makeApiUrl(`products/${ctx.params.id}`), {
      method: "PATCH",
      headers,
      body,
    });

    const text = await upstream.text();
    const data = text ? JSON.parse(text) : {};
    return NextResponse.json(data, { status: upstream.status || 200 });
  } catch (e: any) {
    return NextResponse.json({ status: "error", message: e?.message || "Failed to update product" }, { status: 500 });
  }
}