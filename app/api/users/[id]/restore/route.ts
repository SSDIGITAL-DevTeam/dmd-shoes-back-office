export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { ensureEnvOrThrow, makeApiUrl } from "../../../_utils/backend";

function readCookie(header: string | null, name: string) {
  if (!header) return undefined;
  const target = `${name}=`;
  const hit = header.split(";").map(s => s.trim()).find(s => s.startsWith(target));
  return hit ? decodeURIComponent(hit.slice(target.length)) : undefined;
}

const apiUrl = (id: string) => makeApiUrl(`users/${encodeURIComponent(id)}/restore`);

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    ensureEnvOrThrow();

    const headers = new Headers({ Accept: "application/json" });
    const token = readCookie(req.headers.get("cookie"), "access_token");
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const res = await fetch(apiUrl(params.id), {
      method: "POST",
      headers,
      cache: "no-store",
    });

    const json = await res.json().catch(() => ({}));
    return NextResponse.json(json, { status: res.status || 200 });
  } catch (e: any) {
    return NextResponse.json(
      { status: "error", message: e?.message || "Failed to restore user" },
      { status: 500 }
    );
  }
}