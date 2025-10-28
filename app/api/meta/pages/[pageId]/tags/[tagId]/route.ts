// app/api/meta/pages/[pageId]/tags/[tagId]/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { ensureEnvOrThrow, makeApiUrl, readCookie } from "../../../../../../_utils/backend";

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

/** Helper: parse backend response safely (json or text) */
async function parseSafe(res: Response) {
  try {
    return await res.clone().json();
  } catch {
    try {
      return await res.clone().text();
    } catch {
      return {};
    }
  }
}

function baseHeaders(req: NextRequest) {
  return {
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
    ...(resolveAuth(req) ? { Authorization: resolveAuth(req)! } : {}),
  } as Record<string, string>;
}

/* ===================== GET (optional: fetch single tag) ===================== */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ pageId: string; tagId: string }> }
) {
  try {
    ensureEnvOrThrow();
    const { pageId, tagId } = await ctx.params;

    const upstream = await fetch(
      makeApiUrl(`meta/pages/${encodeURIComponent(pageId)}/tags/${encodeURIComponent(tagId)}`),
      {
        method: "GET",
        headers: baseHeaders(req),
        cache: "no-store",
      }
    );

    const data = (await parseSafe(upstream)) ?? {};
    return new NextResponse(typeof data === "string" ? data : JSON.stringify(data), {
      status: upstream.status || 200,
      headers: noStore,
    });
  } catch (e: any) {
    return NextResponse.json(
      { status: "error", message: e?.message || "Proxy GET meta tag failed" },
      { status: 502, headers: noStore }
    );
  }
}

/* ===================== PATCH /api/meta/pages/:pageId/tags/:tagId ===================== */
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ pageId: string; tagId: string }> }
) {
  try {
    ensureEnvOrThrow();
    const { pageId, tagId } = await ctx.params;

    const contentType = req.headers.get("content-type") || "application/json";
    const headers = { ...baseHeaders(req) } as Record<string, string>;
    headers["Content-Type"] = contentType.includes("application/json")
      ? "application/json"
      : contentType;

    // baca body sebagai text agar aman (menghindari stream lock)
    const body = await req.text().catch(() => "");

    const upstream = await fetch(
      makeApiUrl(`meta/pages/${encodeURIComponent(pageId)}/tags/${encodeURIComponent(tagId)}`),
      {
        method: "PATCH",
        headers,
        body,
        // @ts-ignore
        duplex: "half", // aman jika nanti ada multipart/stream
        cache: "no-store",
      }
    );

    const data = (await parseSafe(upstream)) ?? {};
    return new NextResponse(typeof data === "string" ? data : JSON.stringify(data), {
      status: upstream.status || 200,
      headers: noStore,
    });
  } catch (e: any) {
    return NextResponse.json(
      { status: "error", message: e?.message || "Proxy PATCH meta tag failed" },
      { status: 502, headers: noStore }
    );
  }
}

/* ===================== DELETE /api/meta/pages/:pageId/tags/:tagId ===================== */
export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ pageId: string; tagId: string }> }
) {
  try {
    ensureEnvOrThrow();
    const { pageId, tagId } = await ctx.params;

    const upstream = await fetch(
      makeApiUrl(`meta/pages/${encodeURIComponent(pageId)}/tags/${encodeURIComponent(tagId)}`),
      {
        method: "DELETE",
        headers: baseHeaders(req), // tanpa Content-Type
        cache: "no-store",
      }
    );

    const data = (await parseSafe(upstream)) ?? {};
    return new NextResponse(typeof data === "string" ? data : JSON.stringify(data), {
      status: upstream.status || 200,
      headers: noStore,
    });
  } catch (e: any) {
    return NextResponse.json(
      { status: "error", message: e?.message || "Proxy DELETE meta tag failed" },
      { status: 502, headers: noStore }
    );
  }
}
