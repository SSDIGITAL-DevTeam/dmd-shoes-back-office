// app/api/articles/[id]/force/route.ts
import { ensureEnvOrThrow, makeApiUrl } from "../../../../_utils/backend";

function passthrough(res: Response) {
  const ct = res.headers.get("content-type") || "application/json";
  return res.clone().text().then((txt) =>
    new Response(txt, { status: res.status, headers: { "content-type": ct } })
  );
}

// (opsional) hindari caching route ini
export const dynamic = "force-dynamic";
// (opsional) jika perlu Node runtime
export const runtime = "nodejs";

export async function DELETE(
  req: Request,
  ctx: { params: Record<string, string | string[]> } // <-- longgar & kompatibel
) {
  ensureEnvOrThrow();

  const raw = ctx?.params?.id;
  const id = Array.isArray(raw) ? raw[0] : raw; // pastikan string

  if (!id) {
    return new Response(JSON.stringify({ status: "error", message: "Missing id" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
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