// app/api/homepage/[...slug]/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { makeApiUrl, readCookie } from "../../../_utils/backend";

function authHeader(req: NextRequest) {
  const h = req.headers.get("authorization");
  if (h) return h;
  const b = readCookie(req.headers.get("cookie") || "", "access_token");
  return b ? `Bearer ${b}` : undefined;
}

async function forward(req: NextRequest, method: string, slug: string[]) {
  const url = makeApiUrl("/" + ["homepage", ...slug].join("/"));
  const headers = new Headers(req.headers);
  headers.set("accept", "application/json");
  const a = authHeader(req);
  if (a) headers.set("authorization", a);
  headers.delete("content-length");
  headers.delete("host");

  const ct = req.headers.get("content-type") || "";
  const init: RequestInit = { method, headers, cache: "no-store" };

  if (method !== "GET" && method !== "HEAD") {
    if (ct.startsWith("multipart/form-data")) {
      // stream FormData
      // @ts-ignore
      init.duplex = "half";
      init.body = req.body as any;
    } else {
      init.body = await req.text(); // JSON/x-www-form-urlencoded
    }
  }

  const res = await fetch(url, init);
  const buf = await res.arrayBuffer();
  return new NextResponse(buf, {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") || "application/json" },
  });
}

export async function PUT(req: NextRequest, { params }: { params: { slug: string[] } }) {
  return forward(req, "PUT", params.slug || []);
}
export async function POST(req: NextRequest, { params }: { params: { slug: string[] } }) {
  return forward(req, "POST", params.slug || []);
}
export async function PATCH(req: NextRequest, { params }: { params: { slug: string[] } }) {
  return forward(req, "PATCH", params.slug || []);
}
export async function GET(req: NextRequest, { params }: { params: { slug: string[] } }) {
  return forward(req, "GET", params.slug || []);
}
export async function DELETE(req: NextRequest, { params }: { params: { slug: string[] } }) {
  return forward(req, "DELETE", params.slug || []);
}