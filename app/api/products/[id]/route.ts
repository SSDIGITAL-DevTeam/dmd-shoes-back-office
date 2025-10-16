// app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";

async function forward(req: NextRequest, targetUrl: string) {
  const hdrs = new Headers(req.headers);
  hdrs.set("Accept", "application/json");
  hdrs.set("X-Requested-With", "XMLHttpRequest");
  hdrs.delete("host");
  hdrs.delete("content-length");

  const init: RequestInit = {
    method: req.method,
    headers: hdrs,
  };
  if (!["GET", "HEAD"].includes(req.method)) {
    const buf = await req.arrayBuffer();
    init.body = buf;
  }
  const upstream = await fetch(targetUrl, init);
  const text = await upstream.text();
  let json: any = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { status: "error", message: "Invalid JSON from upstream" };
  }
  return NextResponse.json(json, { status: upstream.status });
}

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
  const target = `${base}/products/${ctx.params.id}`;
  return forward(req, target);
}

export async function PUT(req: NextRequest, ctx: { params: { id: string } }) {
  const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
  const target = `${base}/products/${ctx.params.id}`;
  return forward(req, target);
}

// jika backend kamu pakai PATCH:
export const PATCH = PUT;

export async function DELETE(req: NextRequest, ctx: { params: { id: string } }) {
  const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
  const target = `${base}/products/${ctx.params.id}`;
  return forward(req, target);
}