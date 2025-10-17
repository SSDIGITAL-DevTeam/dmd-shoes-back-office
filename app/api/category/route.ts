// app/api/category/route.ts
import { NextRequest } from "next/server";
import { ensureEnvOrThrow, makeApiUrl } from "../../_utils/backend";

/** Header anti-cache untuk semua response proxy */
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

async function buildBodyAndHeaders(req: NextRequest) {
  const headers = makeAuthHeaders(req);
  const ct = req.headers.get("content-type") || "";

  if (ct.includes("multipart/form-data")) {
    const inForm = await req.formData();
    const form = new FormData();
    inForm.forEach((v, k) => form.append(k, v));
    // penting: JANGAN set Content-Type manual untuk FormData
    return { headers, body: form as BodyInit };
  }

  const json = await req.json().catch(() => ({}));
  headers.set("Content-Type", "application/json");
  return { headers, body: JSON.stringify(json ?? {}) as BodyInit };
}

/** LIST -> forward /categories?per_page=... (terima perPage dari FE) */
export async function GET(req: NextRequest) {
  ensureEnvOrThrow();
  const { searchParams } = new URL(req.url);

  // FE: perPage → BE: per_page
  const page = searchParams.get("page") ?? "";
  const perPage = searchParams.get("perPage") ?? "";
  const status = searchParams.get("status") ?? "";
  const parent = searchParams.get("parent") ?? "";

  const qs = new URLSearchParams();
  if (page) qs.set("page", page);
  if (perPage) qs.set("per_page", perPage);
  if (status) qs.set("status", status);
  if (parent) qs.set("parent", parent);

  // ⛔ cache-buster untuk layer CDN/proxy di backend
  qs.set("_", String(Date.now()));

  const res = await fetch(makeApiUrl(`categories?${qs.toString()}`), {
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

/** CREATE → /categories (JSON / multipart) */
export async function POST(req: NextRequest) {
  ensureEnvOrThrow();
  const { headers, body } = await buildBodyAndHeaders(req);

  const res = await fetch(makeApiUrl("categories"), {
    method: "POST",
    headers,
    body,
    cache: "no-store",            // ⛔
    // @ts-ignore
    next: { revalidate: 0 },      // ⛔
  });

  const txt = await res.text().catch(() => "");
  return new Response(txt || "{}", {
    status: res.status,           // beberapa API mengembalikan 201
    headers: noStoreHeaders,      // ⛔
  });
}