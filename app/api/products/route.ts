// app/api/products/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { makeApiUrl } from "../../_utils/backend";

const noStore = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
} as const;

function makeAuthHeaders(req: NextRequest) {
  const h = new Headers();
  h.set("Accept", "application/json");
  h.set("X-Requested-With", "XMLHttpRequest");

  // Ambil Authorization dari header atau cookie httpOnly access_token
  const auth = req.headers.get("authorization");
  if (auth) h.set("Authorization", auth);
  if (!auth) {
    const raw = req.headers.get("cookie") || "";
    const token = raw.split(";").map(s => s.trim()).find(s => s.startsWith("access_token="))?.split("=")[1];
    if (token) h.set("Authorization", `Bearer ${decodeURIComponent(token)}`);
  }

  // ⚠️ JANGAN teruskan Origin/Referer/Cookie FE ke backend eksternal
  return h;
}

async function buildCreateBody(req: NextRequest) {
  const headers = makeAuthHeaders(req);
  const ct = req.headers.get("content-type") || "";

  if (ct.includes("multipart/form-data")) {
    // Rekonstruksi FormData jika memang perlu mapping field
    const inForm = await req.formData();
    const fd = new FormData();

    // bilingual
    fd.append("name[id]", String(inForm.get("name[id]") ?? inForm.get("name_id") ?? ""));
    fd.append("name[en]", String(inForm.get("name[en]") ?? inForm.get("name_en") ?? ""));
    fd.append("description[id]", String(inForm.get("description[id]") ?? inForm.get("description_id") ?? ""));
    fd.append("description[en]", String(inForm.get("description[en]") ?? inForm.get("description_en") ?? ""));

    // plain (fallback)
    const namePlain = inForm.get("name");
    const descPlain = inForm.get("description");
    if (namePlain) fd.append("name", String(namePlain));
    if (descPlain) fd.append("description", String(descPlain));

    // scalar
    const pm = inForm.get("pricing_mode") ?? inForm.get("pricingMode");
    if (pm != null) fd.append("pricing_mode", String(pm));
    const slug = inForm.get("slug");
    if (slug) fd.append("slug", String(slug));

    const status = inForm.get("status");
    const featured = inForm.get("featured");
    if (status != null) fd.append("status", (status === "true" || status === "1") ? "1" : "0");
    if (featured != null) fd.append("featured", (featured === "true" || featured === "1") ? "1" : "0");

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

    // arrays/complex
    inForm.forEach((v, k) => {
      if (
        k.startsWith("seo_tags[") ||
        k.startsWith("attributes[") ||
        k.startsWith("variant_prices[") ||
        k.startsWith("gallery[") ||
        k.startsWith("related_products[")
      ) {
        fd.append(k, v as Blob | string);
      }
    });

    const cover = inForm.get("cover");
    if (cover) fd.append("cover", cover as Blob);

    return { headers, body: fd as BodyInit, isMultipart: true };
  }

  // JSON body
  const body = await req.json().catch(() => ({} as any));
  const payload: any = {
    ...body,
    pricing_mode: body.pricing_mode ?? body.pricingMode,
  };

  const str = (v: any) => (typeof v === "string" ? v.trim() : "");
  const pick = (...c: any[]) => c.map(str).find(Boolean) || "";
  const namePlain2 = pick(body.name, body.name_text, body?.name?.en, body?.name?.id);
  const descPlain2 = pick(body.description, body.description_text, body?.description?.en, body?.description?.id);
  if (namePlain2) payload.name = namePlain2;
  if (descPlain2) payload.description = descPlain2;

  if (typeof body.status !== "undefined") payload.status = !!body.status;
  if (typeof body.featured !== "undefined") payload.featured = !!body.featured;

  if (!Array.isArray(body.related_products)) {
    const legacy = Array.isArray(body.related_ids) ? body.related_ids : Array.isArray(body.relatedIds) ? body.relatedIds : [];
    if (legacy.length) payload.related_products = legacy;
  }

  headers.set("Content-Type", "application/json");
  return { headers, body: JSON.stringify(payload) as BodyInit, isMultipart: false };
}

/** GET /api/products */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const qs = new URLSearchParams();
  if (searchParams.get("page")) qs.set("page", searchParams.get("page")!);
  if (searchParams.get("perPage")) qs.set("per_page", searchParams.get("perPage")!);
  if (searchParams.get("status")) qs.set("status", searchParams.get("status")!);
  if (searchParams.get("search")) qs.set("search", searchParams.get("search")!);

  const upstream = await fetch(makeApiUrl(`products?${qs.toString()}`), {
    method: "GET",
    headers: makeAuthHeaders(req),
    cache: "no-store",
    // @ts-ignore
    next: { revalidate: 0 },
  });

  const text = await upstream.text().catch(() => "");
  return new NextResponse(text || "{}", {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "application/json",
      ...noStore,
    },
  });
}

/** POST /api/products */
export async function POST(req: NextRequest) {
  try {
    const { headers, body, isMultipart } = await buildCreateBody(req);

    const upstream = await fetch(makeApiUrl("products"), {
      method: "POST",
      headers,
      body,
      cache: "no-store",
      // penting untuk request dengan body (terutama multipart) di Node
      // @ts-ignore
      duplex: "half",
    });

    const text = await upstream.text().catch(() => "");
    return new NextResponse(text || "{}", {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") ?? (isMultipart ? "application/json" : "application/json"),
        ...noStore,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { status: "error", message: e?.message ?? "Proxy POST /products failed" },
      { status: 502 }
    );
  }
}