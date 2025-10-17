// app/api/products/route.ts
import { NextRequest } from "next/server";
import { ensureEnvOrThrow, makeApiUrl } from "../_utils/backend";

/** Header anti-cache untuk semua response proxy */
const noStoreHeaders = {
  "content-type": "application/json",
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
} as const;

/** Ambil auth dari header/cookie, sertakan cookie untuk session */
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

/** Normalisasi body CREATE agar cocok dengan backend */
async function buildCreateBody(req: NextRequest) {
  const base = makeAuthHeaders(req);
  const ct = req.headers.get("content-type") || "";

  if (ct.includes("multipart/form-data")) {
    const inForm = await req.formData();
    const fd = new FormData();

    // bilingual fields
    fd.append("name[id]", String(inForm.get("name[id]") ?? inForm.get("name_id") ?? ""));
    fd.append("name[en]", String(inForm.get("name[en]") ?? inForm.get("name_en") ?? ""));
    fd.append("description[id]", String(inForm.get("description[id]") ?? inForm.get("description_id") ?? ""));
    fd.append("description[en]", String(inForm.get("description[en]") ?? inForm.get("description_en") ?? ""));

    const slug = inForm.get("slug");
    if (slug) fd.append("slug", String(slug));

    // booleans -> numeric flags for Laravel
    const status = inForm.get("status");
    const featured = inForm.get("featured");
    fd.append("status", status === "true" || status === "1" ? "1" : "0");
    fd.append("featured", featured === "true" || featured === "1" ? "1" : "0");

    const category_id = inForm.get("category_id");
    if (category_id) fd.append("category_id", String(category_id));
    const price = inForm.get("price");
    if (price) fd.append("price", String(price));
    const heel = inForm.get("heel_height_cm");
    if (heel) fd.append("heel_height_cm", String(heel));

    // SEO
    const keyword_id = inForm.get("seo_keyword[id]");
    const keyword_en = inForm.get("seo_keyword[en]");
    const desc_id = inForm.get("seo_description[id]");
    const desc_en = inForm.get("seo_description[en]");
    if (keyword_id) fd.append("seo_keyword[id]", String(keyword_id));
    if (keyword_en) fd.append("seo_keyword[en]", String(keyword_en));
    if (desc_id) fd.append("seo_description[id]", String(desc_id));
    if (desc_en) fd.append("seo_description[en]", String(desc_en));

    // ✅ tags[] — use forEach instead of entries()
    inForm.forEach((v, k) => {
      if (k.startsWith("seo_tags[")) fd.append(k, v as Blob | string);
    });

    // ✅ attributes / variant_prices / gallery — also via forEach
    inForm.forEach((v, k) => {
      if (
        k.startsWith("attributes[") ||
        k.startsWith("variant_prices[") ||
        k.startsWith("gallery[")
      ) {
        fd.append(k, v as Blob | string);
      }
    });

    // cover
    const cover = inForm.get("cover");
    if (cover) fd.append("cover", cover as Blob);

    base.delete("Content-Type"); // let boundary be set automatically
    return { headers: base as HeadersInit, body: fd as BodyInit };
  }

  // --- JSON (tidak ada file) ---
  const body = await req.json().catch(() => ({}));
  // pastikan boolean murni
  const payload = {
    ...body,
    status: body.status === true || body.status === 1,
    featured: body.featured === true || body.featured === 1,
  };

  base.set("Content-Type", "application/json");
  return { headers: base as HeadersInit, body: JSON.stringify(payload) as BodyInit };
}

/** GET /api/products -> forward ke /products?per_page=... */
export async function GET(req: NextRequest) {
  ensureEnvOrThrow();
  const { searchParams } = new URL(req.url);

  // FE kirim perPage → BE pakai per_page
  const page = searchParams.get("page") ?? "";
  const perPage = searchParams.get("perPage") ?? "";
  const status = searchParams.get("status") ?? "";
  const search = searchParams.get("search") ?? "";

  const qs = new URLSearchParams();
  if (page) qs.set("page", page);
  if (perPage) qs.set("per_page", perPage);
  if (status) qs.set("status", status);
  if (search) qs.set("search", search);

  const res = await fetch(makeApiUrl(`products?${qs.toString()}`), {
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

/** POST /api/products -> CREATE */
export async function POST(req: NextRequest) {
  ensureEnvOrThrow();
  const { headers, body } = await buildCreateBody(req);

  const res = await fetch(makeApiUrl("products"), {
    method: "POST",
    headers,
    body,
    cache: "no-store",
    // @ts-ignore
    next: { revalidate: 0 },
    credentials: "include",
  });

  const txt = await res.text().catch(() => "");
  return new Response(txt || "{}", { status: res.status, headers: noStoreHeaders });
}