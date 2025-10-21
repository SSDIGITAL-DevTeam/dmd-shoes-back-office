// app/api/auth/admin/register/route.ts
import { NextRequest } from "next/server";
import { makeApiUrl } from "../../../../_utils/backend";

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

  // Forward Authorization (header / cookie access_token)
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

  // Forward cookie/origin/referer (menjaga behavior seperti route products)
  const cookie = req.headers.get("cookie");
  if (cookie) h.set("Cookie", cookie);
  const origin = req.headers.get("origin");
  if (origin) h.set("Origin", origin);
  const referer = req.headers.get("referer");
  if (referer) h.set("Referer", referer);

  return h;
}

function normalizeCreatePayload(body: any) {
  return {
    name: body?.name ?? "",
    email: body?.email ?? "",
    password: body?.password ?? "",
    password_confirmation: body?.password_confirmation ?? body?.passwordConfirmation ?? "",
    status:
      typeof body?.status === "string"
        ? body.status === "1" || body.status === "true"
        : typeof body?.status === "boolean"
        ? body.status
        : true,
  };
}

/** POST /api/auth/admin/register -> forwards to {{baseURL}}/api/v1/auth/admin/register */
export async function POST(req: NextRequest) {
  const headers = makeAuthHeaders(req);
  headers.set("Content-Type", "application/json");

  // baca body aman (hindari error '<!DOCTYPE' → JSON)
  const raw = await req.text().catch(() => "");
  const body = raw ? JSON.parse(raw) : {};
  const payload = normalizeCreatePayload(body);

  const res = await fetch(makeApiUrl("/auth/admin/register"), {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    cache: "no-store",
    // @ts-ignore
    next: { revalidate: 0 },
    credentials: "include",
  });

  const txt = await res.text().catch(() => "");
  // jangan paksa parse di sini; biarkan FE service yang handle
  return new Response(txt || "{}", {
    status: res.status,
    headers: noStoreHeaders,
  });
}