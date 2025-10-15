export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { ensureEnvOrThrow, makeApiUrl } from "../_utils/backend";

function readCookie(header: string | null, name: string) {
  if (!header) return undefined;
  const p = header.split(";").map(s => s.trim()).find(s => s.startsWith(`${name}=`));
  return p ? decodeURIComponent(p.slice(name.length + 1)) : undefined;
}

export async function GET(req: Request) {
  try {
    ensureEnvOrThrow();

    const headers = new Headers({ Accept: "application/json" });
    const token = readCookie(req.headers.get("cookie"), "access_token");
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const res = await fetch(makeApiUrl("dashboard"), { method: "GET", headers, cache: "no-store" });
    const json = await res.json().catch(() => ({}));
    return NextResponse.json(json, { status: res.status || 200 });
  } catch (e: any) {
    return NextResponse.json({ status: "error", message: e?.message || "Failed to fetch dashboard" }, { status: 500 });
  }
}