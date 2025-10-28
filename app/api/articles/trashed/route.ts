// app/api/articles/trashed/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ensureEnvOrThrow, makeApiUrl, readCookie } from "../../../_utils/backend";

const noStore = {
  "content-type": "application/json",
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
} as const;

function resolveAuth(req: NextRequest) {
  const fromHeader = req.headers.get("authorization");
  if (fromHeader) return fromHeader;
  const bearer = readCookie(req.headers.get("cookie") || "", "access_token");
  if (bearer) return `Bearer ${bearer}`;
  return undefined;
}

function baseHeaders(req: NextRequest) {
  return {
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
    ...(resolveAuth(req) ? { Authorization: resolveAuth(req)! } : {}),
    ...(req.headers.get("cookie") ? { Cookie: req.headers.get("cookie")! } : {}),
    ...(req.headers.get("origin") ? { Origin: req.headers.get("origin")! } : {}),
    ...(req.headers.get("referer") ? { Referer: req.headers.get("referer")! } : {}),
  } as Record<string, string>;
}

async function parseSafe(res: Response) {
  try { return await res.clone().json(); } catch {
    try { return await res.clone().text(); } catch { return {}; }
  }
}

/** Build upstream URL and carry ALL query params transparently */
function buildBackendUrl(req: NextRequest) {
  const be = new URL(makeApiUrl("articles/trashed"));
  // carry all params as-is (page, per_page, lang, search, etc.)
  req.nextUrl.searchParams.forEach((v, k) => be.searchParams.set(k, v));
  // default values if not provided
  if (!be.searchParams.get("page")) be.searchParams.set("page", "1");
  if (!be.searchParams.get("per_page")) be.searchParams.set("per_page", "10");
  if (!be.searchParams.get("lang")) be.searchParams.set("lang", "id");
  return be.toString();
}

export async function GET(req: NextRequest) {
  try {
    ensureEnvOrThrow();

    const upstream = await fetch(buildBackendUrl(req), {
      method: "GET",
      headers: baseHeaders(req),
      cache: "no-store",
    });

    const data = (await parseSafe(upstream)) ?? {};
    return new NextResponse(typeof data === "string" ? data : JSON.stringify(data), {
      status: upstream.status || 200,
      headers: noStore,
    });
  } catch (e: any) {
    return NextResponse.json(
      { status: "error", message: e?.message || "Failed to fetch trashed articles" },
      { status: 500, headers: noStore }
    );
  }
}
