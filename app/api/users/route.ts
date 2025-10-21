export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { ensureEnvOrThrow, makeApiUrl, readCookie } from "../../_utils/backend";

const noStore = {
  "content-type": "application/json",
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
} as const;

function resolveAuth(req: NextRequest) {
  // 1) Header Authorization jika ada
  const fromHeader = req.headers.get("authorization");
  if (fromHeader) return fromHeader;

  // 2) Fallback cookie access_token
  const bearer = readCookie(req.headers.get("cookie") || "", "access_token");
  if (bearer) return `Bearer ${bearer}`;

  return undefined;
}

export async function GET(req: NextRequest) {
  try {
    ensureEnvOrThrow();

    const base = makeApiUrl("users");
    const url = new URL(base);
    // teruskan seluruh query dari FE -> BE
    req.nextUrl.searchParams.forEach((v, k) => {
      url.searchParams.set(k, v);
    });

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
        ...(resolveAuth(req) ? { Authorization: resolveAuth(req)! } : {}),
      },
      cache: "no-store",
    });

    // coba JSON, kalau gagal ambil text agar tidak melempar error parsing
    const data =
      (await res
        .clone()
        .json()
        .catch(async () => await res.clone().text())) ?? {};

    return new NextResponse(
      typeof data === "string" ? data : JSON.stringify(data),
      { status: res.status || 200, headers: noStore }
    );
  } catch (e: any) {
    return NextResponse.json(
      { status: "error", message: e?.message || "Failed to fetch users" },
      { status: 500, headers: noStore }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    ensureEnvOrThrow();
    const body = await req
      .clone()
      .json()
      .catch(async () => (await req.clone().text()) || {});

    const res = await fetch(makeApiUrl("users"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        ...(resolveAuth(req) ? { Authorization: resolveAuth(req)! } : {}),
      },
      body: typeof body === "string" ? body : JSON.stringify(body),
      cache: "no-store",
    });

    const data =
      (await res
        .clone()
        .json()
        .catch(async () => await res.clone().text())) ?? {};

    return new NextResponse(
      typeof data === "string" ? data : JSON.stringify(data),
      { status: res.status || 200, headers: noStore }
    );
  } catch (e: any) {
    return NextResponse.json(
      { status: "error", message: e?.message || "Failed to create user" },
      { status: 500, headers: noStore }
    );
  }
}