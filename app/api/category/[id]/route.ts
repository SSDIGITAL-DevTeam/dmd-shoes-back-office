// app/api/category/[id]/route.ts
import { NextRequest } from "next/server";
import { ensureEnvOrThrow, makeApiUrl } from "../../_utils/backend";

/** header dasar + auth dari cookie/header */
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

/** Normalisasi body agar cocok dengan API backend */
async function normalizeCategoryBody(req: NextRequest) {
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
    const status =
      statusRaw === "true" || statusRaw === "1";

    const cover = inForm.get("cover");

    // Laravel paling aman membaca array nested via name[id]/name[en]
    fd.append("name[id]", name_id);
    fd.append("name[en]", name_en);
    if (slug) fd.append("slug", slug);

    // jika parent kosong -> JANGAN kirim field tersebut (biar null/unsent)
    if (parent_id !== null && parent_id !== "" && parent_id !== "null") {
      fd.append("parent_id", String(parent_id));
    }

    // status kirim sebagai "1"/"0"
    fd.append("status", status ? "1" : "0");

    if (cover) fd.append("cover", cover as Blob);

    base.set("Accept", "application/json"); // Content-Type biarkan browser yang set
    return { headers: base as HeadersInit, body: fd as BodyInit };
  }

  // --- JSON biasa (tanpa file) ---
  const body = await req.json().catch(() => ({} as any));
  const payload = {
    name: { id: body?.name?.id ?? body?.name_id ?? "", en: body?.name?.en ?? body?.name_en ?? "" },
    slug: body.slug ?? undefined,
    parent_id:
      body.parent_id === "" || body.parent_id === undefined ? null : body.parent_id,
    status: !!body.status,
  };

  base.set("Accept", "application/json");
  base.set("Content-Type", "application/json");
  return {
    headers: base as HeadersInit,
    body: JSON.stringify(payload) as BodyInit,
  };
}

/** GET /api/category/:id */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  ensureEnvOrThrow();
  const { id } = await params;
  const res = await fetch(makeApiUrl(`categories/${id}`), {
    method: "GET",
    headers: makeAuthHeaders(req),
  });
  const txt = await res.text().catch(() => "");
  return new Response(txt || "{}", { status: res.status, headers: { "content-type": "application/json" } });
}

/** PATCH /api/category/:id */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  ensureEnvOrThrow();
  const { id } = await params;
  const { headers, body } = await normalizeCategoryBody(req);
  const res = await fetch(makeApiUrl(`categories/${id}`), {
    method: "PATCH", // backend memang support PATCH
    headers,
    body,
  });
  const txt = await res.text().catch(() => "");
  return new Response(txt || "{}", { status: res.status, headers: { "content-type": "application/json" } });
}

/** PUT -> redirect ke PATCH (jaga-jaga kalau ada pemanggilan PUT) */
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
  });
  const txt = await res.text().catch(() => "");
  return new Response(txt || "{}", { status: res.status, headers: { "content-type": "application/json" } });
}