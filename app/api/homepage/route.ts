// app/api/homepage/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { ensureEnvOrThrow, makeApiUrl } from "../../_utils/backend";

/** Header anti-cache untuk semua response proxy */
const noStore = {
  "content-type": "application/json",
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
} as const;

/** GET /api/homepage -> BE /api/v1/homepage */
export async function GET(req: NextRequest) {
  try {
    ensureEnvOrThrow();

    const url = new URL(req.url);
    const qs = url.search || "";

    const res = await fetch(makeApiUrl(`homepage${qs}`), {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      cache: "no-store",
      // @ts-ignore
      next: { revalidate: 0 },
      credentials: "include",
    });

    const text = await res.text().catch(() => "");
    return new NextResponse(text || "{}", {
      status: res.status || 200,
      headers: noStore,
    });
  } catch (e: any) {
    return NextResponse.json(
      { status: "error", message: e?.message || "Proxy error (GET /homepage)" },
      { status: 503, headers: noStore }
    );
  }
}