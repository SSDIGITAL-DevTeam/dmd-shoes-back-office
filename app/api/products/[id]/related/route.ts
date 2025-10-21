// app/api/products/route.ts
import { NextRequest } from "next/server";
import { makeApiUrl } from "@/app/_utils/backend";

const noStoreHeaders = {
  "content-type": "application/json",
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
} as const;

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
    if (token) h.set("Authorization", `Bearer ${token}`);
  }

  return h;
}

function coerceIds(input: any): number[] {
  const arr = Array.isArray(input) ? input : [];
  const out = arr
    .map((v) => (typeof v === "string" || typeof v === "number" ? Number(v) : NaN))
    .filter((n) => Number.isFinite(n) && n > 0);
  // max 4 sesuai backend
  return Array.from(new Set(out)).slice(0, 4);
}

function tryParseJsonArray(s: any): number[] {
  if (typeof s !== "string") return [];
  try {
    const parsed = JSON.parse(s);
    return coerceIds(parsed);
  } catch {
    // fallback CSV: "1,2,3"
    const csv = s.split(",").map((x) => x.trim());
    return coerceIds(csv);
  }
}

async function buildCreateBody(req: NextRequest) {
  const base = makeAuthHeaders(req);
  const ct = req.headers.get("content-type") || "";

  // ====== MULTIPART ======
  if (ct.includes("multipart/form-data")) {
    const inForm = await req.formData();
    const fd = new FormData();

    // bilingual fields (pastikan ada)
    fd.append("name[id]", String(inForm.get("name[id]") ?? inForm.get("name_id") ?? ""));
    fd.append("name[en]", String(inForm.get("name[en]") ?? inForm.get("name_en") ?? ""));
    fd.append(
      "description[id]",
      String(inForm.get("description[id]") ?? inForm.get("description_id") ?? "")
    );
    fd.append(
      "description[en]",
      String(inForm.get("description[en]") ?? inForm.get("description_en") ?? "")
    );

    // plain fields umum
    const plainPairs: Array<[string, string]> = [
      ["name", String(inForm.get("name") ?? "")],
      ["description", String(inForm.get("description") ?? "")],
      ["slug", String(inForm.get("slug") ?? "")],
      ["category_id", String(inForm.get("category_id") ?? "")],
      ["price", String(inForm.get("price") ?? "")],
      ["heel_height_cm", String(inForm.get("heel_height_cm") ?? "")],
      ["status", String(inForm.get("status") ?? "")],
      ["featured", String(inForm.get("featured") ?? "")],
      // pricing_mode dari dua kemungkinan key
      [
        "pricing_mode",
        String(inForm.get("pricing_mode") ?? inForm.get("pricingMode") ?? ""),
      ],
      ["seo_keyword[id]", String(inForm.get("seo_keyword[id]") ?? inForm.get("keyword_id") ?? "")],
      ["seo_keyword[en]", String(inForm.get("seo_keyword[en]") ?? inForm.get("keyword_en") ?? "")],
      ["seo_description[id]", String(inForm.get("seo_description[id]") ?? inForm.get("seoDescription_id") ?? "")],
      ["seo_description[en]", String(inForm.get("seo_description[en]") ?? inForm.get("seoDescription_en") ?? "")],
    ];
    for (const [k, v] of plainPairs) if (v !== "") fd.append(k, v);

    // arrays: seo_tags, attributes, variant_prices, gallery
    inForm.forEach((v, k) => {
      if (
        k.startsWith("seo_tags[") ||
        k.startsWith("attributes[") ||
        k.startsWith("variant_prices[") ||
        k.startsWith("gallery[")
      ) {
        fd.append(k, v as Blob | string);
      }
    });

    // ===== related_products — robust forwarding =====
    // 1) Ambil semua bentuk related_products[<i>]
    const relatedBuckets: Record<number, number> = {};
    inForm.forEach((v, k) => {
      if (k.startsWith("related_products[")) {
        const num = Number(v as any);
        if (Number.isFinite(num) && num > 0) {
          // ambil index di dalam bracket bila ada, tapi posisi tidak terlalu penting
          relatedBuckets[Object.keys(relatedBuckets).length] = num;
        }
      }
    });
    // 2) Fallback satu field 'related_products' (JSON/CSV)
    if (Object.keys(relatedBuckets).length === 0) {
      const maybe = inForm.get("related_products");
      const normalized = tryParseJsonArray(maybe);
      normalized.forEach((id, idx) => fd.append(`related_products[${idx}]`, String(id)));
    } else {
      Object.values(relatedBuckets)
        .slice(0, 4)
        .forEach((id, idx) => fd.append(`related_products[${idx}]`, String(id)));
    }

    // cover & gallery images
    const cover = inForm.get("cover");
    if (cover) fd.append("cover", cover as Blob);

    return { headers: base as HeadersInit, body: fd as BodyInit };
  }

  // ====== JSON ======
  const body = await req.json().catch(() => ({} as any));

  // Start dari body lalu normalkan
  const payload: any = {
    ...body,
    pricing_mode: body.pricing_mode ?? body.pricingMode,
  };

  // map bilingual → plain jika memang dikirim plain saja
  const str = (v: any) => (typeof v === "string" ? v.trim() : "");
  const tryPick = (...c: any[]) => c.map(str).find((x) => !!x) || "";

  const namePlain = tryPick(body.name, body.name_text, body?.name?.en, body?.name?.id);
  const descPlain = tryPick(
    body.description,
    body.description_text,
    body?.description?.en,
    body?.description?.id
  );
  if (namePlain) payload.name = namePlain;
  if (descPlain) payload.description = descPlain;

  // ===== related_products — robust normalization =====
  // Sumber yang didukung: related_products, related_ids, relatedIds
  let related: any = Array.isArray(body.related_products)
    ? body.related_products
    : Array.isArray(body.related_ids)
    ? body.related_ids
    : Array.isArray(body.relatedIds)
    ? body.relatedIds
    : typeof body.related_products === "string"
    ? tryParseJsonArray(body.related_products)
    : [];

  const normalized = coerceIds(related);
  if (normalized.length) payload.related_products = normalized;
  else delete payload.related_products;

  base.set("Content-Type", "application/json");
  return { headers: base as HeadersInit, body: JSON.stringify(payload) as BodyInit };
}

/** POST /api/products -> CREATE */
export async function POST(req: NextRequest) {
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

/** GET /api/products (tetap sama, tidak diubah) */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = searchParams.get("page");
  const perPage = searchParams.get("per_page");
  const status = searchParams.get("status");
  const search = searchParams.get("search");

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