import { NextRequest } from "next/server";
import { ensureEnvOrThrow, makeApiUrl } from "../../../_utils/backend";

function passthrough(res: Response) {
    const ct = res.headers.get("content-type") || "application/json";
    return res.clone().text().then(txt =>
        new Response(txt, { status: res.status, headers: { "content-type": ct } })
    );
}

export async function GET(req: NextRequest) {
    ensureEnvOrThrow();
    const url = new URL(req.url);
    const qs = new URLSearchParams({
        page: url.searchParams.get("page") || "1",
        per_page: url.searchParams.get("per_page") || "10",
        lang: url.searchParams.get("lang") || "id",
    });
    const search = url.searchParams.get("search") || "";
    if (search) qs.set("search", search);

    const upstream = await fetch(makeApiUrl(`articles/trashed?${qs.toString()}`), {
        headers: {
            Accept: "application/json",
            Cookie: req.headers.get("cookie") ?? "",
            Authorization: req.headers.get("authorization") ?? "",
        },
        cache: "no-store",
    });
    return passthrough(upstream);
}
