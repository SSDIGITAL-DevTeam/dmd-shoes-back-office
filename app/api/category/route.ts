// app/api/category/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { ensureEnvOrThrow, makeApiUrl } from "../../_utils/backend";

/** Header anti-cache untuk semua response proxy */
const noStoreHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
} as const;

function makeAuthHeaders(req: NextRequest) {
  const h = new Headers();
  h.set("Accept", "application/json");
  h.set("X-Requested-With", "XMLHttpRequest");

  // ambil token dari Authorization atau cookie access_token
  const auth = req.headers.get("authorization");
  if (auth) {
    h.set("Authorization", auth);
  } else {
    const rawCookie = req.headers.get("cookie") || "";
    const token = rawCookie
      .split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith("access_token="))
      ?.split("=")[1];
    if (token) h.set("Authorization", `Bearer ${decodeURIComponent(token)}`);
  }

  // penting: JANGAN teruskan Cookie/Origin/Referer
  return h;
}

async function buildBodyAndHeaders(req: NextRequest) {
  const headers = makeAuthHeaders(req);
  const ct = req.headers.get("content-type") || "";

  if (ct.toLowerCase().startsWith("multipart/form-data")) {
    // rebuild agar boundary di-set otomatis oleh fetch
    const inForm = await req.formData();
    const form = new FormData();
    inForm.forEach((v, k) => form.append(k, v));
    // jangan set Content-Type manual
    return { headers, body: form as BodyInit };
  }

  // fallback JSON
  const json = await req.json().catch(() => ({}));
  headers.set("Content-Type", "application/json");
  return { headers, body: JSON.stringify(json ?? {}) as BodyInit };
}

/** LIST -> forward /categories?per_page=... (terima perPage dari FE) */
export async function GET(req: NextRequest) {
  try {
    ensureEnvOrThrow();
    const { searchParams } = new URL(req.url);

    // FE: perPage → BE: per_page
    const qs = new URLSearchParams();
    const page = searchParams.get("page");
    const perPage = searchParams.get("perPage");
    const status = searchParams.get("status");
    const parent = searchParams.get("parent");

    if (page) qs.set("page", page);
    if (perPage) qs.set("per_page", perPage);
    if (status) qs.set("status", status);
    if (parent) qs.set("parent", parent);
    qs.set("_", String(Date.now())); // cache buster

    const upstream = await fetch(makeApiUrl(`categories?${qs.toString()}`), {
      method: "GET",
      headers: makeAuthHeaders(req),
      cache: "no-store",
      // @ts-ignore
      next: { revalidate: 0 },
    });

    const text = await upstream.text().catch(() => "");
    const ct = upstream.headers.get("content-type") || "application/json";
    return new NextResponse(text || "{}", {
      status: upstream.status,
      headers: { ...noStoreHeaders, "content-type": ct },
    });
  } catch (e: any) {
    return NextResponse.json(
      { status: "error", message: e?.message || "Failed to fetch categories" },
      { status: 500, headers: noStoreHeaders }
    );
  }
}

/** CREATE → /categories (JSON / multipart) */
export async function POST(req: NextRequest) {
  try {
    ensureEnvOrThrow();
    const { headers, body } = await buildBodyAndHeaders(req);

    const upstream = await fetch(makeApiUrl("categories"), {
      method: "POST",
      headers,
      body,
      cache: "no-store",
      // @ts-ignore
      next: { revalidate: 0 },
    });

    const text = await upstream.text().catch(() => "");
    const ct = upstream.headers.get("content-type") || "application/json";
    return new NextResponse(text || "{}", {
      status: upstream.status, // bisa 201
      headers: { ...noStoreHeaders, "content-type": ct },
    });
  } catch (e: any) {
    return NextResponse.json(
      { status: "error", message: e?.message || "Failed to create category" },
      { status: 500, headers: noStoreHeaders }
    );
  }
}