import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const API = process.env.NEXT_PUBLIC_API_URL!.replace(/\/+$/, "");

export async function POST(req: NextRequest) {
    const upstream = await fetch(`${API}/logout`, {
        method: "POST",
        headers: { Accept: "application/json" },
        cache: "no-store",
    });

    // hapus cookie lokal
    const res = NextResponse.json(null, { status: upstream.status || 200 });
    res.cookies.set("access_token", "", { path: "/", maxAge: 0 });
    return res;
}
