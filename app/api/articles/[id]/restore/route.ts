// app/api/articles/[id]/restore/route.ts
import { ensureEnvOrThrow, makeApiUrl } from "../../../../_utils/backend";

function passthrough(res: Response) {
  const ct = res.headers.get("content-type") || "application/json";
  return res.clone().text().then((txt) =>
    new Response(txt, { status: res.status, headers: { "content-type": ct } })
  );
}

export const dynamic = "force-dynamic"; // hindari cache route ini
export const runtime = "nodejs";        // opsional, jika perlu Node runtime

export async function POST(req: Request) {
  ensureEnvOrThrow();

  // Ambil id dari URL tanpa memakai argumen context
  const url = new URL(req.url);
  const segments = url.pathname.split("/").filter(Boolean); // ["api","articles","{id}","restore"]
  const idx = segments.lastIndexOf("articles");
  const id = idx >= 0 && segments[idx + 1] ? segments[idx + 1] : null;

  if (!id) {
    return new Response(
      JSON.stringify({ status: "error", message: "Missing article id in URL" }),
      { status: 400, headers: { "content-type": "application/json" } }
    );
  }

  const upstream = await fetch(makeApiUrl(`articles/${id}/restore`), {
    method: "POST",
    headers: {
      Accept: "application/json",
      Cookie: req.headers.get("cookie") ?? "",
      Authorization: req.headers.get("authorization") ?? "",
      "X-Requested-With": "XMLHttpRequest",
    },
    // cache: "no-store", // atau andalkan dynamic=force-dynamic
  });

  return passthrough(upstream);
}