// app/(admin)/api/articles/[id]/toggle/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ensureEnvOrThrow, makeApiUrl } from "../../../../_utils/backend";

function fwd(req: NextRequest) {
    return {
        Accept: "application/json",
        Cookie: req.headers.get("cookie") ?? "",
        Authorization: req.headers.get("authorization") ?? "",
        Origin: req.headers.get("origin") ?? "",
        Referer: req.headers.get("referer") ?? "",
        "X-Requested-With": "XMLHttpRequest",
    };
}

export async function PATCH(
    req: NextRequest,
    ctx: { params: Promise<{ id: string }> }
) {
    ensureEnvOrThrow();

    const { id } = await ctx.params;
    const url = new URL(req.url);
    const lang = url.searchParams.get("lang") || "";
    const body = await req.json().catch(() => ({}));

    const upstreamUrl = makeApiUrl(`articles/${id}/status`);
    const res = await fetch(upstreamUrl, {
        method: "PATCH",
        headers: { ...fwd(req), "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
    });

    const ct = res.headers.get("content-type") || "";
    const payload = ct.includes("json") ? await res.json() : await res.text();

    if (!res.ok) {
        return NextResponse.json(payload, { status: res.status });
    }

    const detailUrl = makeApiUrl(`articles/${id}${lang ? `?lang=${encodeURIComponent(lang)}` : ""}`);
    const detailRes = await fetch(detailUrl, { headers: fwd(req), cache: "no-store" });
    const detail = await detailRes.json().catch(() => ({}));

    return NextResponse.json(
        { status: "success", message: "Status updated", data: detail?.data ?? detail },
        { status: 200 }
    );
}
