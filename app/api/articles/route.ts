import { NextRequest } from "next/server";
import { ensureEnvOrThrow, makeApiUrl, readCookie } from "../../_utils/backend";

/** Passthrough: teruskan body+status apa adanya dari upstream */
function passthrough(res: Response) {
  const ct = res.headers.get("content-type") || "application/json";
  return res.clone().text().then((txt) =>
    new Response(txt, { status: res.status, headers: { "content-type": ct } })
  );
}

/** Ambil token dari Authorization header atau cookie access_token */
function resolveAuth(req: NextRequest): string | undefined {
  const fromHeader = req.headers.get("authorization");
  if (fromHeader && fromHeader.trim()) return fromHeader; // e.g. "Bearer xxx"
  const bearer = readCookie(req.headers.get("cookie") || "", "access_token");
  if (bearer && bearer.trim()) return `Bearer ${bearer}`;
  return undefined;
}

/** Bangun header untuk forward ke upstream, hanya set Authorization jika ada token */
function buildUpstreamHeaders(req: NextRequest, extra?: Record<string, string>) {
  const h = new Headers();
  h.set("Accept", "application/json");
  h.set("X-Requested-With", "XMLHttpRequest");

  // Kirim Cookie hanya jika kamu memang masih membutuhkan cookie di upstream
  const cookie = req.headers.get("cookie");
  if (cookie) h.set("Cookie", cookie);

  const auth = resolveAuth(req);
  if (auth) h.set("Authorization", auth);

  if (extra) {
    for (const [k, v] of Object.entries(extra)) h.set(k, v);
  }
  return h;
}

export async function GET(req: NextRequest) {
  ensureEnvOrThrow();

  const { searchParams } = new URL(req.url);
  const page = searchParams.get("page") ?? "1";
  const perPage = searchParams.get("perPage") ?? searchParams.get("per_page") ?? "10";
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";
  const lang = searchParams.get("lang") ?? "";

  const qs = new URLSearchParams({ page, per_page: perPage });
  if (search) qs.set("search", search);
  if (status) qs.set("status", status);
  if (lang) qs.set("lang", lang);

  try {
    const upstream = await fetch(makeApiUrl(`articles?${qs.toString()}`), {
      method: "GET",
      headers: buildUpstreamHeaders(req),
      // credentials tidak diperlukan di server-side fetch, cookie sudah dipasang manual
    });
    return await passthrough(upstream);
  } catch {
    return Response.json({ status: "error", message: "Upstream unavailable" }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  ensureEnvOrThrow();

  const contentType = req.headers.get("content-type") || "";
  let init: RequestInit;

  if (contentType.toLowerCase().includes("multipart/form-data")) {
    // FormData (biarkan boundary di-set otomatis)
    const form = await req.formData();
    init = { method: "POST", body: form };
  } else {
    // JSON
    const payload = await req.json().catch(() => ({}));
    init = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    };
  }

  // Tambah header standar + Authorization (jika ada)
  const headers = buildUpstreamHeaders(req, (init.headers as Record<string, string>) || undefined);
  init.headers = headers;

  try {
    const upstream = await fetch(makeApiUrl("articles"), init);
    return await passthrough(upstream);
  } catch {
    return Response.json({ status: "error", message: "Upstream unavailable" }, { status: 502 });
  }
}