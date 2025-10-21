// app/api/products/[id]/route.ts
export const runtime = "nodejs";

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

/** Helper: build backend URL + carry all search params */
function buildBackendUrl(req: NextRequest, id: string) {
  const be = new URL(makeApiUrl(`products/${id}`));
  req.nextUrl.searchParams.forEach((v, k) => be.searchParams.set(k, v));
  return be.toString();
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
  method: "PATCH" | "PUT" | "POST",
  req: NextRequest,
  contentType: string
): RequestInit & { duplex?: "half" } {
  const headersToSend: Record<string, string> = { ...baseHeaders(req) };
  let body: BodyInit | null = null;

  if (contentType.toLowerCase().startsWith("multipart/form-data")) {
    headersToSend["Content-Type"] = contentType; // keep boundary
    body = req.body as any; // ReadableStream
  } else if (contentType.includes("application/json")) {
    // robust read
    body = undefined as any;
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

  // JSON bodies: read safely
  if (contentType.includes("application/json")) {
    init.body = undefined;
    // read raw text or fallback json stringify
    init.body = (req as any)
      .clone()
      .text()
      .catch(async () => (await (req as any).clone().json()).then(JSON.stringify).catch(() => "{}"));
    // above returns Promise<string>; await it here synchronously is better:
  }

  return init;
}

/** GET detail product */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    ensureEnvOrThrow();

    const res = await fetch(buildBackendUrl(req, params.id), {
      method: "GET",
      headers: baseHeaders(req),
      cache: "no-store",
    });

    const data = (await parseSafe(res)) ?? {};
    return new NextResponse(typeof data === "string" ? data : JSON.stringify(data), {
      status: res.status || 200,
      headers: noStore,
    });
  } catch (e: any) {
    return NextResponse.json(
      { status: "error", message: e?.message || "Failed to fetch product" },
      { status: 500, headers: noStore }
    );
  }
}

/** Forward PATCH with support for JSON or multipart/form-data */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    ensureEnvOrThrow();
    const contentType = req.headers.get("content-type") || "";
    const init = makeForwardInit("PATCH", req, contentType);

    // penting: Node/undici butuh duplex saat streaming
    if (init.body && typeof (init.body as any).getReader === "function") {
      init.duplex = "half";
    }
    // jika init.body adalah Promise<string> (JSON di atas), selesaikan terlebih dulu
    if (init.body && typeof (init.body as any).then === "function") {
      init.body = await (init.body as any);
    }

    const res = await fetch(buildBackendUrl(req, params.id), init);

    const data = (await parseSafe(res)) ?? {};
    return new NextResponse(typeof data === "string" ? data : JSON.stringify(data), {
      status: res.status || 200,
      headers: noStore,
    });
  } catch (e: any) {
    return NextResponse.json(
      { status: "error", message: e?.message || "Failed to update product" },
      { status: 500, headers: noStore }
    );
  }
}

/** Some backends use PUT for update */
export async function PUT(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    ensureEnvOrThrow();
    const contentType = req.headers.get("content-type") || "";
    const init = makeForwardInit("PUT", req, contentType);

    if (init.body && typeof (init.body as any).getReader === "function") {
      init.duplex = "half";
    }
    if (init.body && typeof (init.body as any).then === "function") {
      init.body = await (init.body as any);
    }

    const res = await fetch(buildBackendUrl(req, ctx.params.id), init);

    const data = (await parseSafe(res)) ?? {};
    return new NextResponse(typeof data === "string" ? data : JSON.stringify(data), {
      status: res.status || 200,
      headers: noStore,
    });
  } catch (e: any) {
    return NextResponse.json(
      { status: "error", message: e?.message || "Failed to update product" },
      { status: 500, headers: noStore }
    );
  }
}

/** Allow POST (for backends expecting POST + _method override) */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    ensureEnvOrThrow();
    const contentType = req.headers.get("content-type") || "";
    const init = makeForwardInit("POST", req, contentType);

    if (init.body && typeof (init.body as any).getReader === "function") {
      init.duplex = "half";
    }
    if (init.body && typeof (init.body as any).then === "function") {
      init.body = await (init.body as any);
    }

    const res = await fetch(buildBackendUrl(req, params.id), init);

    const data = (await parseSafe(res)) ?? {};
    return new NextResponse(typeof data === "string" ? data : JSON.stringify(data), {
      status: res.status || 200,
      headers: noStore,
    });
  } catch (e: any) {
    return NextResponse.json(
      { status: "error", message: e?.message || "Failed to update product (POST)" },
      { status: 500, headers: noStore }
    );
  }
}

/** DELETE product */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    ensureEnvOrThrow();

    const res = await fetch(buildBackendUrl(req, params.id), {
      method: "DELETE",
      headers: baseHeaders(req),
      cache: "no-store",
    });

    const data = (await parseSafe(res)) ?? {};
    return new NextResponse(typeof data === "string" ? data : JSON.stringify(data), {
      status: res.status || 200,
      headers: noStore,
    });
  } catch (e: any) {
    return NextResponse.json(
      { status: "error", message: e?.message || "Failed to delete product" },
      { status: 500, headers: noStore }
    );
  }
}