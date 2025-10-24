// app/api/articles/[id]/route.ts
import { ensureEnvOrThrow, makeApiUrl } from "../../../_utils/backend";

function passthrough(res: Response) {
  const ct = res.headers.get("content-type") || "application/json";
  return res
    .clone()
    .text()
    .then((txt) => new Response(txt, { status: res.status, headers: { "content-type": ct } }));
}

// Opsional: hindari cache & pastikan Node runtime
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function extractArticleIdFromUrl(url: string): string | null {
  const u = new URL(url);
  // path contoh: /api/articles/123 -> segmen: ["api","articles","123"]
  const seg = u.pathname.split("/").filter(Boolean);
  const idx = seg.lastIndexOf("articles");
  return idx >= 0 && seg[idx + 1] ? seg[idx + 1] : null;
}

function forwardBaseHeaders(req: Request): HeadersInit {
  return {
    Accept: "application/json",
    Cookie: req.headers.get("cookie") ?? "",
    Authorization: req.headers.get("authorization") ?? "",
    "X-Requested-With": "XMLHttpRequest",
  };
}

/* ===================== GET ===================== */
export async function GET(req: Request) {
  ensureEnvOrThrow();
  const id = extractArticleIdFromUrl(req.url);
  if (!id) {
    return Response.json({ status: "error", message: "Missing article id" }, { status: 400 });
  }

  try {
    const upstream = await fetch(makeApiUrl(`articles/${id}`), {
      headers: forwardBaseHeaders(req),
      cache: "no-store",
    });
    return passthrough(upstream);
  } catch {
    return Response.json({ status: "error", message: "Upstream unavailable" }, { status: 502 });
  }
}

/* ===================== PUT ===================== */
export async function PUT(req: Request) {
  ensureEnvOrThrow();
  const id = extractArticleIdFromUrl(req.url);
  if (!id) {
    return Response.json({ status: "error", message: "Missing article id" }, { status: 400 });
  }

  const contentType = req.headers.get("content-type") || "";
  let init: RequestInit = { method: "PUT", headers: { ...forwardBaseHeaders(req) } };

  try {
    if (contentType.includes("multipart/form-data")) {
      // Biarkan runtime menetapkan boundary — JANGAN set Content-Type manual
      const form = await req.formData();
      init.body = form;
    } else if (contentType.includes("application/json")) {
      const json = await req.json().catch(() => ({}));
      (init.headers as Record<string, string>)["Content-Type"] = "application/json";
      init.body = JSON.stringify(json);
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await req.text();
      (init.headers as Record<string, string>)["Content-Type"] =
        "application/x-www-form-urlencoded";
      init.body = text;
    } else {
      // fallback aman: pass-through sebagai binary
      const buf = await req.arrayBuffer();
      init.body = buf;
      // Content-Type dibiarkan kosong (backend bisa menebak / tidak perlu)
    }

    const upstream = await fetch(makeApiUrl(`articles/${id}`), init);
    return passthrough(upstream);
  } catch {
    return Response.json({ status: "error", message: "Upstream unavailable" }, { status: 502 });
  }
}

/* ===================== DELETE ===================== */
export async function DELETE(req: Request) {
  ensureEnvOrThrow();
  const id = extractArticleIdFromUrl(req.url);
  if (!id) {
    return Response.json({ status: "error", message: "Missing article id" }, { status: 400 });
  }

  try {
    const upstream = await fetch(makeApiUrl(`articles/${id}`), {
      method: "DELETE",
      headers: forwardBaseHeaders(req),
    });
    return passthrough(upstream);
  } catch {
    return Response.json({ status: "error", message: "Upstream unavailable" }, { status: 502 });
  }
}