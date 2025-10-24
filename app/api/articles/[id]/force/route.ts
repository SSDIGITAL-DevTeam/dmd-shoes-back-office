// app/api/articles/[id]/force/route.ts
import { ensureEnvOrThrow, makeApiUrl } from "../../../../_utils/backend";

function passthrough(res: Response) {
  const ct = res.headers.get("content-type") || "application/json";
  return res.clone().text().then((txt) =>
    new Response(txt, { status: res.status, headers: { "content-type": ct } })
  );
}

// (opsional, biar gak ke-cache)
export const dynamic = "force-dynamic";
// (opsional, kalau butuh Node runtime)
export const runtime = "nodejs";

export async function DELETE(req: Request) {
  ensureEnvOrThrow();

  // Ambil id dari URL tanpa butuh argumen context
  const url = new URL(req.url);
  // Contoh path: /api/articles/123/force
  // cari segmen setelah "articles"
  const segments = url.pathname.split("/").filter(Boolean);
  const idx = segments.lastIndexOf("articles");
  const id = idx >= 0 && segments[idx + 1] ? segments[idx + 1] : null;

  if (!id) {
    return new Response(
      JSON.stringify({ status: "error", message: "Missing article id in URL" }),
      { status: 400, headers: { "content-type": "application/json" } }
    );
  }

  const upstream = await fetch(makeApiUrl(`articles/${id}/force`), {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      Cookie: req.headers.get("cookie") ?? "",
      Authorization: req.headers.get("authorization") ?? "",
      "X-Requested-With": "XMLHttpRequest",
    },
    // cache: "no-store",
  });

  return passthrough(upstream);
}