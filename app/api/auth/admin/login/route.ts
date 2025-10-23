import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs"; // penting untuk cookies & fetch server

const API = process.env.NEXT_PUBLIC_API_URL!.replace(/\/+$/, ""); // e.g. https://api.dmdshoeparts.com/api/v1

export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => ({}));
    const upstream = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
    });

    const text = await upstream.text();
    let data: any = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = { message: text }; }

    // teruskan status + body
    const res = NextResponse.json(data, { status: upstream.status });

    // kalau backend mengirim Set-Cookie, teruskan juga ke client (opsional)
    const setCookie = upstream.headers.get("set-cookie");
    if (setCookie) res.headers.set("set-cookie", setCookie);

    // OPTIONAL (lebih aman): kalau backend return token di JSON, set cookie httpOnly di sini
    if (upstream.ok && data?.token) {
        res.cookies.set("access_token", data.token, {
            httpOnly: true,
            sameSite: "lax",    // kalau lintas domain pakai 'none' + secure:true
            secure: true,
            path: "/",
            maxAge: 60 * 60 * 24 * 30, // 30 hari
        });
    }

    return res;
}
