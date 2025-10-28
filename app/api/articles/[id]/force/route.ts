// app/api/articles/[id]/force/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { ensureEnvOrThrow, makeApiUrl, readCookie } from "../../../../_utils/backend";

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

/* ===================== DELETE (force delete) ===================== */
export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    ensureEnvOrThrow();
    const { id } = await ctx.params;

    const upstream = await fetch(makeApiUrl(`articles/${id}/force`), {
      method: "DELETE",
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
      { status: "error", message: e?.message || "Failed to force delete article" },
      { status: 500, headers: noStore }
    );
  }
}
