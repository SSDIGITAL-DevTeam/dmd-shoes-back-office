// app/api/product/[id]/route.ts
import { NextRequest } from "next/server";
import { ensureEnvOrThrow, makeApiUrl } from "../../../_utils/backend";

/** Header anti-cache */
const noStoreHeaders = {
  "content-type": "application/json",
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

function makeAuthHeaders(req: NextRequest) {
  const h = new Headers();
  h.set("Accept", "application/json");
  h.set("X-Requested-With", "XMLHttpRequest");

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

  const cookie = req.headers.get("cookie");
  if (cookie) h.set("Cookie", cookie);
  const origin = req.headers.get("origin");
  if (origin) h.set("Origin", origin);
  const referer = req.headers.get("referer");
  if (referer) h.set("Referer", referer);

  return h;
}

/** Normalisasi body untuk UPDATE (JSON / multipart → POST+_method=PATCH bila multipart) */
async function normalizeProductBody(req: NextRequest): Promise<{
  headers: HeadersInit;
  body: BodyInit;
  isMultipart: boolean;
}> {
  const base = makeAuthHeaders(req);
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const inForm = await req.formData();
    const fd = new FormData();
    inForm.forEach((v, k) => fd.append(k, v)); // pass-through SEMUA field (nama field backend tetap kepakai)

    // Penting: JANGAN set Content-Type; biarkan boundary otomatis
    base.set("Accept", "application/json");
    return { headers: base as HeadersInit, body: fd as BodyInit, isMultipart: true };
  }

  const json = await req.json().catch(() => ({}));
  base.set("Accept", "application/json");
  base.set("Content-Type", "application/json");
  return { headers: base as HeadersInit, body: JSON.stringify(json ?? {}) as BodyInit, isMultipart: false };
}

/** GET /api/product/:id -> GET /products/:id */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  ensureEnvOrThrow();
  const { id } = await params;
  const res = await fetch(makeApiUrl(`products/${id}?_=${Date.now()}`), {
    method: "GET",
    headers: makeAuthHeaders(req),
    cache: "no-store",
    // @ts-ignore
    next: { revalidate: 0 },
    credentials: "include",
  });
  const txt = await res.text().catch(() => "");
  return new Response(txt || "{}", { status: res.status, headers: noStoreHeaders });
}

/** PATCH /api/product/:id -> (multipart: POST + _method=PATCH) */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  ensureEnvOrThrow();
  const { id } = await params;
  const { headers, body, isMultipart } = await normalizeProductBody(req);

  let method = "PATCH";
  let finalBody: BodyInit = body;

  if (isMultipart && body instanceof FormData) {
    // Laravel lebih stabil untuk file update via POST + _method
    body.append("_method", "PATCH");
    method = "POST";
    finalBody = body;
  }

  const res = await fetch(makeApiUrl(`products/${id}`), {
    method,
    headers,
    body: finalBody,
    cache: "no-store",
    // @ts-ignore
    next: { revalidate: 0 },
    credentials: "include",
  });

  const txt = await res.text().catch(() => "");
  return new Response(txt || "{}", { status: res.status, headers: noStoreHeaders });
}

/** PUT -> redirect ke PATCH */
export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return PATCH(req, ctx);
}

/** DELETE /api/product/:id */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  ensureEnvOrThrow();
  const { id } = await params;
  const res = await fetch(makeApiUrl(`products/${id}`), {
    method: "DELETE",
    headers: makeAuthHeaders(req),
    cache: "no-store",
    // @ts-ignore
    next: { revalidate: 0 },
    credentials: "include",
  });
  const txt = await res.text().catch(() => "");
  return new Response(txt || "{}", { status: res.status, headers: noStoreHeaders });
}