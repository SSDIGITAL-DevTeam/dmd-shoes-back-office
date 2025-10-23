// app/api/dashboard/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { ensureEnvOrThrow, makeApiUrl } from "../../_utils/backend";

export async function GET(req: NextRequest) {
  try {
    ensureEnvOrThrow();

    const token = req.cookies.get("access_token")?.value;
    const headers = new Headers({ Accept: "application/json" });
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const res = await fetch(makeApiUrl("dashboard"), {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", message: err?.message ?? "Failed to fetch dashboard" },
      { status: 500 },
    );
  }
}