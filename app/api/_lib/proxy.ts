const trim = (s: string) => s.replace(/\/+$/, "");
const joinUrl = (a: string, p: string) => `${trim(a)}/${p.replace(/^\/+/, "")}`;

export function backendBase(): string {
    const base = process.env.BACKEND_API_BASE || "";
    if (!base) throw new Error("BACKEND_API_BASE is not set");
    return trim(base);
}

export async function proxyJson(req: Request, backendPath: string) {
    const base = backendBase();
    const url = new URL(req.url);
    const target = joinUrl(base, backendPath) + (url.search || "");

    const headers = new Headers();
    const auth = req.headers.get("authorization");
    const cookie = req.headers.get("cookie");
    if (auth) headers.set("authorization", auth);
    if (cookie) headers.set("cookie", cookie);

    let body: BodyInit | undefined;
    if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
        const ct = req.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
            headers.set("content-type", "application/json");
            const json = await req.json().catch(() => undefined);
            if (json !== undefined) body = JSON.stringify(json);
        } else {
            return new Response(
                JSON.stringify({ status: "error", message: "Only application/json supported" }),
                { status: 415, headers: { "content-type": "application/json" } }
            );
        }
    }

    try {
        const beRes = await fetch(target, {
            method: req.method,
            headers,
            body,
            cache: "no-store",
            redirect: "manual",
        });

        const text = await beRes.text();
        const ctRes = beRes.headers.get("content-type") || "application/json; charset=utf-8";

        // Tambahkan header debug agar kelihatan target yang dipanggil
        const res = new Response(text, {
            status: beRes.status,
            headers: { "content-type": ctRes, "x-proxy-target": target },
        });

        if (!beRes.ok) {
            // log ke server console Next (muncul di terminal)
            console.error("[PROXY ERROR]", beRes.status, target, text.slice(0, 500));
        }
        return res;
    } catch (e: any) {
        console.error("[PROXY THROW]", target, e?.message || e);
        return new Response(
            JSON.stringify({ status: "error", message: e?.message || "Proxy request failed", target }),
            { status: 502, headers: { "content-type": "application/json" } }
        );
    }
}
