import { NextRequest } from "next/server";
import { ensureEnvOrThrow, makeApiUrl } from "../../../_utils/backend";

function passthrough(res: Response) {
  const ct = res.headers.get("content-type") || "application/json";
  return res
    .clone()
    .text()
    .then((txt) => new Response(txt, { status: res.status, headers: { "content-type": ct } }));
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  ensureEnvOrThrow();
  try {
    const upstream = await fetch(makeApiUrl(`articles/${params.id}`), {
      headers: {
        Accept: "application/json",
        Cookie: req.headers.get("cookie") ?? "",
        Authorization: req.headers.get("authorization") ?? "",
      },
      cache: "no-store",
    });
    return await passthrough(upstream);
  } catch {
    return Response.json({ status: "error", message: "Upstream unavailable" }, { status: 502 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  ensureEnvOrThrow();

  const contentType = req.headers.get("content-type") || "";
  let init: RequestInit;

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    // Laravel update kamu menerima PUT/PATCH; aman langsung PUT body=form
    init = { method: "PUT", body: form };
  } else {
    const payload = await req.json().catch(() => ({}));
    init = {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    };
  }

  init.headers = {
    ...(init.headers as Record<string, string>),
    Accept: "application/json",
    Cookie: req.headers.get("cookie") ?? "",
    Authorization: req.headers.get("authorization") ?? "",
  };

  try {
    const upstream = await fetch(makeApiUrl(`articles/${params.id}`), init);
    return await passthrough(upstream);
  } catch {
    return Response.json({ status: "error", message: "Upstream unavailable" }, { status: 502 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  ensureEnvOrThrow();
  try {
    const upstream = await fetch(makeApiUrl(`articles/${params.id}`), {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Cookie: req.headers.get("cookie") ?? "",
        Authorization: req.headers.get("authorization") ?? "",
      },
    });
    return await passthrough(upstream);
  } catch {
    return Response.json({ status: "error", message: "Upstream unavailable" }, { status: 502 });
  }
}
