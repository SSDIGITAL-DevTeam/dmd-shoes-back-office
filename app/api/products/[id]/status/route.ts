export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { ensureEnvOrThrow, makeApiUrl, readCookie } from "../../../../_utils/backend";

/** PATCH /api/products/:id/status  →  Laravel contoh: PATCH /api/v1/products/:id/status */
export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    ensureEnvOrThrow();
    const body = await req.json().catch(() => ({}));
    const cookie = req.headers.get("cookie");
    const bearer = readCookie(cookie, "access_token");

    const res = await fetch(makeApiUrl(`products/${ctx.params.id}/status`), {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(bearer ? { Authorization: `Bearer ${bearer}` } : {})
      },
      body: JSON.stringify(body), // { status: true/false / "publish"/"draft" }
    });

    const json = await res.json().catch(() => ({}));
    return NextResponse.json(json, { status: res.status || 200 });
  } catch (e: any) {
    return NextResponse.json({ status: "error", message: e?.message || "Failed to update status" }, { status: 500 });
  }
}