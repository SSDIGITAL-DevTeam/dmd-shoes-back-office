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

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    ensureEnvOrThrow();

    const res = await fetch(makeApiUrl(`users/${params.id}`), {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
        ...(resolveAuth(_req) ? { Authorization: resolveAuth(_req)! } : {}),
      },
      cache: "no-store",
    });

    const data =
      (await res
        .clone()
        .json()
        .catch(async () => await res.clone().text())) ?? {};

    return new NextResponse(
      typeof data === "string" ? data : JSON.stringify(data),
      { status: res.status || 200, headers: noStore }
    );
  } catch (e: any) {
    return NextResponse.json(
      { status: "error", message: e?.message || "Failed to fetch user" },
      { status: 500, headers: noStore }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    ensureEnvOrThrow();
    const body = await req
      .clone()
      .json()
      .catch(async () => (await req.clone().text()) || {});

    const res = await fetch(makeApiUrl(`users/${params.id}`), {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        ...(resolveAuth(req) ? { Authorization: resolveAuth(req)! } : {}),
      },
      body: typeof body === "string" ? body : JSON.stringify(body),
      cache: "no-store",
    });

    const data =
      (await res
        .clone()
        .json()
        .catch(async () => await res.clone().text())) ?? {};

    return new NextResponse(
      typeof data === "string" ? data : JSON.stringify(data),
      { status: res.status || 200, headers: noStore }
    );
  } catch (e: any) {
    return NextResponse.json(
      { status: "error", message: e?.message || "Failed to update user" },
      { status: 500, headers: noStore }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    ensureEnvOrThrow();

    const res = await fetch(makeApiUrl(`users/${params.id}`), {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
        ...(resolveAuth(req) ? { Authorization: resolveAuth(req)! } : {}),
      },
      cache: "no-store",
    });

    const data =
      (await res
        .clone()
        .json()
        .catch(async () => await res.clone().text())) ?? {};

    return new NextResponse(
      typeof data === "string" ? data : JSON.stringify(data),
      { status: res.status || 200, headers: noStore }
    );
  } catch (e: any) {
    return NextResponse.json(
      { status: "error", message: e?.message || "Failed to delete user" },
      { status: 500, headers: noStore }
    );
  }
}