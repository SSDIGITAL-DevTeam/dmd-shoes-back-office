import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BASE = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "";

function backendUrl(id: string) {
  return `${BASE.replace(/\/$/, "")}/users/${encodeURIComponent(id)}`;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!BASE) {
    return NextResponse.json({ status: "error", message: "API_BASE_URL is not set" }, { status: 500 });
  }
  try {
    const token = cookies().get("access_token")?.value;
    const res = await fetch(backendUrl(params.id), {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    });
    const json = await res.json().catch(() => ({}));
    return NextResponse.json(json, { status: res.status || 200 });
  } catch {
    return NextResponse.json({ status: "error", message: "Failed to fetch user" }, { status: 502 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!BASE) {
    return NextResponse.json({ status: "error", message: "API_BASE_URL is not set" }, { status: 500 });
  }
  try {
    const token = cookies().get("access_token")?.value;
    const body = await req.json().catch(() => ({}));
    const res = await fetch(backendUrl(params.id), {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const json = await res.json().catch(() => ({}));
    return NextResponse.json(json, { status: res.status || 200 });
  } catch {
    return NextResponse.json({ status: "error", message: "Failed to update user" }, { status: 502 });
  }
}