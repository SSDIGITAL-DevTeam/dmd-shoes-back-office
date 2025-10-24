// app/api/customers/[id]/route.ts
import { NextRequest } from "next/server";
import { ensureEnvOrThrow, makeApiUrl } from "../../../_utils/backend";
import { http } from "../../../_utils/http";

export async function GET(
  _: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  ensureEnvOrThrow();
  const { id } = await ctx.params;
  const data = await http<any>(makeApiUrl(`customers/${id}`));
  return Response.json(data);
}

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  ensureEnvOrThrow();
  const { id } = await ctx.params;
  const payload = await req.json().catch(() => ({}));
  const data = await http<any>(makeApiUrl(`customers/${id}`), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return Response.json(data);
}

export async function DELETE(
  _: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  ensureEnvOrThrow();
  const { id } = await ctx.params;
  const data = await http<any>(makeApiUrl(`customers/${id}`), { method: "DELETE" });
  return Response.json(data);
}
