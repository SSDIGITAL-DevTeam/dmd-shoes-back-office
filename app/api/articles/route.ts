// app/api/articles/route.ts
import { NextRequest } from "next/server";
import { ensureEnvOrThrow, makeApiUrl } from "../../_utils/backend";
import { http } from "../../_utils/http";

export async function GET(req: NextRequest) {
  ensureEnvOrThrow();
  const { searchParams } = new URL(req.url);
  const page    = searchParams.get("page")    ?? "1";
  const perPage = searchParams.get("perPage") ?? "10";
  const search  = searchParams.get("search")  ?? "";
  const qs = new URLSearchParams({ page, per_page: perPage });
  if (search) qs.set("search", search);

  const data = await http<any>(makeApiUrl(`articles?${qs.toString()}`));
  return Response.json(data);
}

export async function POST(req: NextRequest) {
  ensureEnvOrThrow();
  const payload = await req.json().catch(() => ({}));
  const data = await http<any>(makeApiUrl("articles"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return Response.json(data, { status: 201 });
}