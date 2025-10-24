// app/api/homepage/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { ensureEnvOrThrow, makeApiUrl } from "../../_utils/backend";

const noStore = {
  "content-type": "application/json",
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
} as const;

export async function GET(req: NextRequest) {
  ensureEnvOrThrow();
  try {
    const res = await fetch(makeApiUrl("homepage"), {
      headers: {
        Accept: "application/json",
        Cookie: req.headers.get("cookie") ?? "",
        Authorization: req.headers.get("authorization") ?? "",
        "X-Requested-With": "XMLHttpRequest",
      },
      cache: "no-store",
      credentials: "include",
    });

    const text = await res.text().catch(() => "");
    return new NextResponse(text || "{}", { status: res.status || 200, headers: noStore });
  } catch (e: any) {
    return NextResponse.json(
      { status: "error", message: e?.message || "Proxy error (GET /homepage)" },
      { status: 503, headers: noStore }
    );
  }
}