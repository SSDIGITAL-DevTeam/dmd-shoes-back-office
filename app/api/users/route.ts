import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BASE = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "";

export async function GET(req: NextRequest) {
  if (!BASE) {
    return NextResponse.json(
      { status: "error", message: "API_BASE_URL is not set" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(req.url);

  // forward query params exactly as Laravel expects
  const url = new URL("/api/v1/users", BASE.replace(/\/$/, ""));
  for (const [k, v] of Array.from(searchParams.entries())) {
    url.searchParams.set(k, v);
  }

  try {
    const token = cookies().get("access_token")?.value;

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    });

    const json = await res.json().catch(() => ({}));
    return NextResponse.json(json, { status: res.status || 200 });
  } catch (e) {
    return NextResponse.json(
      { status: "error", message: "Failed to fetch users from backend" },
      { status: 502 }
    );
  }
}