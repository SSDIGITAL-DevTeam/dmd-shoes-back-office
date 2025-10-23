// app/api/homepage/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { makeApiUrl, readCookie } from "../../_utils/backend"; // sesuaikan path util di project kamu

function authHeader(req: NextRequest) {
  const h = req.headers.get("authorization");
  if (h) return h;
  const bearer = readCookie(req.headers.get("cookie") || "", "access_token");
  return bearer ? `Bearer ${bearer}` : undefined;
}

export async function GET(req: NextRequest) {
  try {
    const url = makeApiUrl("/homepage");
    const headers = new Headers(req.headers);
    headers.set("accept", "application/json");
    const a = authHeader(req);
    if (a) headers.set("authorization", a);

    // Hindari header yang bikin upstream rejek
    headers.delete("content-length");
    headers.delete("host");

    const res = await fetch(url, { method: "GET", headers, cache: "no-store" });
    const body = await res.arrayBuffer();
    return new NextResponse(body, {
      status: res.status,
      headers: { "content-type": res.headers.get("content-type") || "application/json" },
    });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || "Proxy error" }, { status: 500 });
  }
}