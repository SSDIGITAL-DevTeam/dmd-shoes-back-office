import { NextRequest } from "next/server";
import { ensureEnvOrThrow, makeApiUrl } from "../../_utils/backend";

function passthrough(res: Response) {
  // helper untuk meneruskan status + body apa adanya
  const ct = res.headers.get("content-type") || "application/json";
  return res
    .clone()
    .text()
    .then((txt) => new Response(txt, { status: res.status, headers: { "content-type": ct } }));
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
  if (status) qs.set("status", status); // publish|draft
  if (lang) qs.set("lang", lang);     // id|en

  try {
    const upstream = await fetch(makeApiUrl(`articles?${qs.toString()}`), {
      headers: {
        Accept: "application/json",
        // forward auth bila perlu
        Cookie: req.headers.get("cookie") ?? "",
        Authorization: req.headers.get("authorization") ?? "",
      },
    });
    return await passthrough(upstream);
  } catch (e) {
    return Response.json({ status: "error", message: "Upstream unavailable" }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  ensureEnvOrThrow();

  const contentType = req.headers.get("content-type") || "";
  let init: RequestInit;

  if (contentType.includes("multipart/form-data")) {
    // support upload cover (file)
    const form = await req.formData();
    init = { method: "POST", body: form };
  } else {
    // JSON (mis. cover_url)
    const payload = await req.json().catch(() => ({}));
    init = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    };
  }

  // forward auth bila perlu
  init.headers = {
    ...(init.headers as Record<string, string>),
    Accept: "application/json",
    Cookie: req.headers.get("cookie") ?? "",
    Authorization: req.headers.get("authorization") ?? "",
  };

  try {
    const upstream = await fetch(makeApiUrl("articles"), init);
    return await passthrough(upstream);
  } catch {
    return Response.json({ status: "error", message: "Upstream unavailable" }, { status: 502 });
  }
}
