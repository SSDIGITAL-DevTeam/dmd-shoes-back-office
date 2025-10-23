// app/api/auth/login/route.ts
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";

const API = process.env.NEXT_PUBLIC_API_URL!.replace(/\/+$/, "");
const isProd = process.env.NODE_ENV === "production";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const upstream = await fetch(`${API}/login`, {
    method: "POST",
    headers: {
      "Content-Type": req.headers.get("content-type") ?? "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    body,
    cache: "no-store",
  });

  const text = await upstream.text();
  const res = new NextResponse(text || "{}", {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "application/json",
      "cache-control": "no-store",
    },
  });

  // kalau backend kirim Set-Cookie sendiri:
  const setCookie = upstream.headers.get("set-cookie");
  if (setCookie) res.headers.set("set-cookie", setCookie);

  // kalau backend mengembalikan token di body:
  let data: any;
  try { data = text ? JSON.parse(text) : null; } catch { data = null; }
  if (upstream.ok && data?.token) {
    res.cookies.set("access_token", data.token, {
      httpOnly: true,
      sameSite: isProd ? "none" : "lax", // dev=lax, prod=none (butuh https)
      secure: isProd,                    // dev=false, prod=true
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return res;
}