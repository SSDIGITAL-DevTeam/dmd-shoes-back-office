// app/api/category/[id]/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { ensureEnvOrThrow, makeApiUrl } from "../../../_utils/backend";

const noStoreHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
} as const;

function makeAuthHeaders(req: NextRequest) {
  const h = new Headers();
  h.set("Accept", "application/json");
  h.set("X-Requested-With", "XMLHttpRequest");

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

  // ikutkan cookie ke upstream (konsisten dg route lain)
  const cookie = req.headers.get("cookie");
  if (cookie) h.set("Cookie", cookie);

  return h;
}

async function buildBodyAndHeaders(req: NextRequest) {
  const headers = makeAuthHeaders(req);
  const ct = (req.headers.get("content-type") || "").toLowerCase();

  // NOTE: untuk multipart, JANGAN set Content-Type manual
  if (ct.startsWith("multipart/form-data")) {
    const inForm = await req.formData();
    const form = new FormData();
    inForm.forEach((v, k) => form.append(k, v));
    return { headers, body: form as BodyInit, contentType: "multipart" as const };
  }

  // default: JSON
  const json = await req.json().catch(() => ({}));
  headers.set("Content-Type", "application/json");
  return { headers, body: JSON.stringify(json ?? {}) as BodyInit, contentType: "json" as const };
}

async function passthrough(upstream: Response) {
  const text = await upstream.text().catch(() => "");
  const ct = upstream.headers.get("content-type") || "application/json";
  return new NextResponse(text || "{}", {
    status: upstream.status,
    headers: { ...noStoreHeaders, "content-type": ct },
  });
}

/** PATCH /api/category/:id -> forward PATCH /api/v1/categories/:id */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    ensureEnvOrThrow();
    const { id } = await ctx.params;
    const { headers, body } = await buildBodyAndHeaders(req);

    const upstream = await fetch(makeApiUrl(`categories/${id}`), {
      method: "PATCH",
      headers,
      body,
      cache: "no-store",
      // @ts-ignore
      next: { revalidate: 0 },
    });

    return passthrough(upstream);
  } catch (e: any) {
    return NextResponse.json(
      { status: "error", message: e?.message || "Failed to update category" },
      { status: 500, headers: noStoreHeaders }
    );
  }
}

/** PUT -> jalur sama dengan PATCH */
export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return PATCH(req, ctx);
}

/** ✅ Tambahan: POST untuk mendukung POST + _method=PUT/PATCH (Laravel) */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    ensureEnvOrThrow();
    const { id } = await ctx.params;
    const { headers, body } = await buildBodyAndHeaders(req);

    // Tidak perlu mengubah method override; biarkan Laravel menangani _method di form.
    const upstream = await fetch(makeApiUrl(`categories/${id}`), {
      method: "POST",
      headers,
      body,
      cache: "no-store",
      // @ts-ignore
      next: { revalidate: 0 },
    });

    return passthrough(upstream);
  } catch (e: any) {
    return NextResponse.json(
      { status: "error", message: e?.message || "Failed to post to category" },
      { status: 500, headers: noStoreHeaders }
    );
  }
}

/** DELETE /api/category/:id -> forward DELETE /api/v1/categories/:id */
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    ensureEnvOrThrow();
    const { id } = await ctx.params;

    const upstream = await fetch(makeApiUrl(`categories/${id}`), {
      method: "DELETE",
      headers: makeAuthHeaders(req),
      cache: "no-store",
      // @ts-ignore
      next: { revalidate: 0 },
    });

    return passthrough(upstream);
  } catch (e: any) {
    return NextResponse.json(
      { status: "error", message: e?.message || "Failed to delete category" },
      { status: 500, headers: noStoreHeaders }
    );
  }
}
