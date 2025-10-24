// app/api/articles/[id]/force/route.ts
import { NextResponse } from "next/server";
import { ensureEnvOrThrow, makeApiUrl } from "../../../../_utils/backend";

export const runtime = "nodejs";          // opsional (kalau kamu butuh Node fetch)
export const dynamic = "force-dynamic";   // opsional (hindari cache)

function passthrough(res: Response) {
  const ct = res.headers.get("content-type") || "application/json";
  return res.clone().text().then((txt) =>
    new Response(txt, { status: res.status, headers: { "content-type": ct } })
  );
}

export async function DELETE(
  req: Request,                               // ← ganti dari NextRequest ke Request
  { params }: { params: { id: string } }      // ← param shape yang benar
) {
  ensureEnvOrThrow();

  const upstream = await fetch(makeApiUrl(`articles/${params.id}/force`), {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      Cookie: req.headers.get("cookie") ?? "",
      Authorization: req.headers.get("authorization") ?? "",
      "X-Requested-With": "XMLHttpRequest",
    },
    // cache: "no-store", // atau pakai dynamic=force-dynamic di atas
  });

  return passthrough(upstream);
}