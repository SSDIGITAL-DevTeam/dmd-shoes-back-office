export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { ensureEnvOrThrow, makeApiUrl, readCookie } from "../../_utils/backend";

export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  try {
    ensureEnvOrThrow();
    const res = await fetch(makeApiUrl(`users/${ctx.params.id}`), {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    const json = await res.json().catch(() => ({}));
    return NextResponse.json(json, { status: res.status || 200 });
  } catch (e: any) {
    return NextResponse.json({ status: "error", message: e?.message || "Failed to fetch user" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    ensureEnvOrThrow();
    const body = await req.json().catch(() => ({}));
    const cookie = req.headers.get("cookie");
    const bearer = readCookie(cookie, "access_token");

    const res = await fetch(makeApiUrl(`users/${ctx.params.id}`), {
      method: "PATCH",
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
    return NextResponse.json({ status: "error", message: e?.message || "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    ensureEnvOrThrow();
    const cookie = req.headers.get("cookie");
    const bearer = readCookie(cookie, "access_token");

    const res = await fetch(makeApiUrl(`users/${ctx.params.id}`), {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        ...(bearer ? { Authorization: `Bearer ${bearer}` } : {})
      },
    });

    if (res.status === 204) return NextResponse.json({ status: "success" }, { status: 200 });
    const json = await res.json().catch(() => ({}));
    return NextResponse.json(json, { status: res.status || 200 });
  } catch (e: any) {
    return NextResponse.json({ status: "error", message: e?.message || "Failed to delete user" }, { status: 500 });
  }
}