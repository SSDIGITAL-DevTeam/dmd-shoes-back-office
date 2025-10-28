// app/(admin)/api/articles/[id]/toggle/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { ensureEnvOrThrow, makeApiUrl, readCookie } from "../../../../_utils/backend";

/** PATCH /api/articles/:id/toggle  →  Laravel: PATCH /api/v1/articles/:id/status */
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    ensureEnvOrThrow();
    const { id } = await ctx.params;

    // ambil body JSON; jika invalid/empty fallback {}
    const body = await req.json().catch(() => ({}));

    // ambil bearer token dari cookie access_token (format sama dengan product route)
    const cookie = req.headers.get("cookie") || "";
    const bearer = readCookie(cookie, "access_token");

    // forward ke backend
    const res = await fetch(makeApiUrl(`articles/${id}/status`), {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
      },
      body: JSON.stringify(body), // contoh: { status: true/false } atau { status: "publish"/"draft" }
    });

    const json = await res.json().catch(() => ({}));
    return NextResponse.json(json, { status: res.status || 200 });
  } catch (e: any) {
    return NextResponse.json(
      { status: "error", message: e?.message || "Failed to update status" },
      { status: 500 }
    );
  }
}