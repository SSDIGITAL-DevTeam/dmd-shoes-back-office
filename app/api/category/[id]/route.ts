// app/api/category/[id]/route.ts
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
      .split(";").map((s) => s.trim())
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

/** Normalisasi body agar cocok dengan API backend */
async function normalizeCategoryBody(req: NextRequest): Promise<{
  headers: HeadersInit;
  body: BodyInit;
  isMultipart: boolean;
}> {
  const base = makeAuthHeaders(req);
  const contentType = req.headers.get("content-type") || "";

  // --- multipart (ada file) ---
  if (contentType.includes("multipart/form-data")) {
    const inForm = await req.formData();
    const fd = new FormData();

    const name_id = (inForm.get("name[id]") ?? inForm.get("name_id") ?? "") as string;
    const name_en = (inForm.get("name[en]") ?? inForm.get("name_en") ?? "") as string;
    const slug = (inForm.get("slug") ?? "") as string;
    const parent_id = inForm.get("parent_id");
    const statusRaw = inForm.get("status");
    const status = statusRaw === "true" || statusRaw === "1";
    const cover = inForm.get("cover");

    // Laravel biasa pakai field bertingkat
    fd.append("name[id]", name_id);
    fd.append("name[en]", name_en);
    if (slug) fd.append("slug", slug);
    if (parent_id !== null && parent_id !== "" && parent_id !== "null") {
      fd.append("parent_id", String(parent_id));
    }
    fd.append("status", status ? "1" : "0");
    if (cover) fd.append("cover", cover as Blob);

    // JANGAN set Content-Type; biarkan boundary otomatis
    base.set("Accept", "application/json");

    return { headers: base as HeadersInit, body: fd as BodyInit, isMultipart: true };
  }

  // --- JSON (tanpa file) ---
  const body = await req.json().catch(() => ({} as any));
  const payload = {
    name: { id: body?.name?.id ?? body?.name_id ?? "", en: body?.name?.en ?? body?.name_en ?? "" },
    slug: body.slug ?? undefined,
    parent_id: body.parent_id === "" || body.parent_id === undefined ? null : body.parent_id,
    status: !!body.status,
  };

  base.set("Accept", "application/json");
  base.set("Content-Type", "application/json");
  return {
    headers: base as HeadersInit,
    body: JSON.stringify(payload) as BodyInit,
    isMultipart: false,
  };
}

/** GET /api/category/:id */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  ensureEnvOrThrow();
  const { id } = await params;
  const res = await fetch(makeApiUrl(`categories/${id}?_=${Date.now()}`), {
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

/** PATCH /api/category/:id  (POST + _method=PATCH bila multipart) */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  ensureEnvOrThrow();
  const { id } = await params;
  const { headers, body, isMultipart } = await normalizeCategoryBody(req);

  let method = "PATCH";
  let finalBody: BodyInit = body;

  if (isMultipart && body instanceof FormData) {
    // Laravel lebih stabil menerima file via POST + _method override
    body.append("_method", "PATCH");
    method = "POST";
    finalBody = body;
  }

  const res = await fetch(makeApiUrl(`categories/${id}`), {
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

/** DELETE /api/category/:id */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  ensureEnvOrThrow();
  const { id } = await params;
  const res = await fetch(makeApiUrl(`categories/${id}`), {
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