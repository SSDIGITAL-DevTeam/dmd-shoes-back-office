// app/api/dashboard/route.ts
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { ensureEnvOrThrow, makeApiUrl } from "../../_utils/backend";
import { readBearer } from "../../_utils/auth";

export async function GET(req: NextRequest) {
  try {
    ensureEnvOrThrow();
    const token = readBearer(req);

    const r = await fetch(makeApiUrl("dashboard"), {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    });

    const text = await r.text().catch(() => "");
    const data = text ? JSON.parse(text) : {};
    return NextResponse.json(data, { status: r.status || 200 });
  } catch (e: any) {
    return NextResponse.json(
      { status: "error", message: e?.message || "Failed to fetch dashboard" },
      { status: 500 },
    );
  }
}