import { NextRequest } from "next/server";
import { makeApiUrl } from "../../../_utils/backend"; // sesuaikan bila pakai src/

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
    const raw = req.headers.get("cookie") || "";
    const token = raw.split(";").map(s=>s.trim()).find(s=>s.startsWith("access_token="))?.split("=")[1];
    if (token) h.set("Authorization", `Bearer ${decodeURIComponent(token)}`);
  }
  const cookie = req.headers.get("cookie"); if (cookie) h.set("Cookie", cookie);
  const origin = req.headers.get("origin"); if (origin) h.set("Origin", origin);
  const referer = req.headers.get("referer"); if (referer) h.set("Referer", referer);
  return h;
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const res = await fetch(makeApiUrl(`/users/${id}`), {
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

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const headers = makeAuthHeaders(req);
  headers.set("Content-Type", "application/json");
  const raw = await req.text().catch(() => "");
  const body = raw ? JSON.parse(raw) : {};
  const res = await fetch(makeApiUrl(`/users/${id}`), {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
    cache: "no-store",
    // @ts-ignore
    next: { revalidate: 0 },
    credentials: "include",
  });
  const txt = await res.text().catch(() => "");
  return new Response(txt || "{}", { status: res.status, headers: noStoreHeaders });
}

/** DELETE /api/users/:id */
export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const headers = makeAuthHeaders(req);

  // coba DELETE murni dulu
  let res = await fetch(makeApiUrl(`/users/${id}`), {
    method: "DELETE",
    headers,
    cache: "no-store",
    // @ts-ignore
    next: { revalidate: 0 },
    credentials: "include",
  });

  // jika backend menolak (405/404), fallback ke POST + _method=DELETE (Laravel spoof)
  if (res.status === 405 || res.status === 404) {
    const fh = new Headers(headers);
    fh.set("Content-Type", "application/json");
    res = await fetch(makeApiUrl(`/users/${id}`), {
      method: "POST",
      headers: fh,
      body: JSON.stringify({ _method: "DELETE" }),
      cache: "no-store",
      // @ts-ignore
      next: { revalidate: 0 },
      credentials: "include",
    });
  }

  const txt = await res.text().catch(() => "");
  return new Response(txt || "{}", { status: res.status, headers: noStoreHeaders });
}
