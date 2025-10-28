// app/api/articles/[id]/restore/route.ts
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

function makeForwardInit(
  method: "POST",
  req: NextRequest,
  contentType: string
): RequestInit & { duplex?: "half" } {
  const headersToSend: Record<string, string> = { ...baseHeaders(req) };
  let body: BodyInit | null = null;

  if (contentType.toLowerCase().startsWith("multipart/form-data")) {
    headersToSend["Content-Type"] = contentType; // keep boundary
    body = req.body as any; // ReadableStream
  } else if (contentType.includes("application/json")) {
    headersToSend["Content-Type"] = "application/json";
    // read as text to avoid stream locking issues
    body = (req as any)
      .clone()
      .text()
      .catch(async () =>
        (await (req as any).clone().json()).then(JSON.stringify).catch(() => "{}")
      );
  } else if (contentType) {
    headersToSend["Content-Type"] = contentType;
    body = req.body as any;
  }

  const init: RequestInit & { duplex?: "half" } = {
    method,
    headers: headersToSend,
    body,
    cache: "no-store",
  };

  return init;
}

/* ===================== POST (restore) ===================== */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    ensureEnvOrThrow();
    const { id } = await ctx.params;
    const contentType = req.headers.get("content-type") || "";
    const init = makeForwardInit("POST", req, contentType);

    // If JSON: resolve Promise<string> body first
    if (init.body && typeof (init.body as any).then === "function") {
      init.body = await (init.body as any);
    }
    // If multipart streaming: require duplex
    if (init.body && typeof (init.body as any).getReader === "function") {
      init.duplex = "half";
    }

    const upstream = await fetch(makeApiUrl(`articles/${id}/restore`), init);
    const data = (await parseSafe(upstream)) ?? {};

    return new NextResponse(typeof data === "string" ? data : JSON.stringify(data), {
      status: upstream.status || 200,
      headers: noStore,
    });
  } catch (e: any) {
    return NextResponse.json(
      { status: "error", message: e?.message || "Failed to restore article" },
      { status: 500, headers: noStore }
    );
  }
}
