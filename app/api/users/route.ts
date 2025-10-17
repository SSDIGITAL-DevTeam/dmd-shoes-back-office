export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { ensureEnvOrThrow, makeApiUrl, readCookie } from "../../_utils/backend";

export async function GET(req: NextRequest) {
  try {
    ensureEnvOrThrow();
    const url = new URL(makeApiUrl("users"));
    Array.from(req.nextUrl.searchParams.entries()).forEach(([k, v]) => url.searchParams.set(k, v));

    const cookie = req.headers.get("cookie");
    const bearer = readCookie(cookie, "access_token");

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(bearer ? { Authorization: `Bearer ${bearer}` } : {})
      },
      cache: "no-store",
    });

    const json = await res.json().catch(() => ({}));
    return NextResponse.json(json, { status: res.status || 200 });
  } catch (e: any) {
    return NextResponse.json({ status: "error", message: e?.message || "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    ensureEnvOrThrow();
    const body = await req.json().catch(() => ({}));
    const cookie = req.headers.get("cookie");
    const bearer = readCookie(cookie, "access_token");

    const res = await fetch(makeApiUrl("users"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(bearer ? { Authorization: `Bearer ${bearer}` } : {})
      },
      body: JSON.stringify(body),
    });

    const json = await res.json().catch(() => ({}));
    return NextResponse.json(json, { status: res.status || 200 });
  } catch (e: any) {
    return NextResponse.json({ status: "error", message: e?.message || "Failed to create user" }, { status: 500 });
  }
}