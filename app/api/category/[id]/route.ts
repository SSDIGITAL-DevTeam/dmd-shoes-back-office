// app/api/categories/[id]/route.ts
import { NextRequest } from "next/server";
import { ensureEnvOrThrow, makeApiUrl } from "../../_utils/backend";
import { http } from "../../_utils/http";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  ensureEnvOrThrow();
  const data = await http<any>(makeApiUrl(`categories/${params.id}`));
  return Response.json(data);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  ensureEnvOrThrow();
  const payload = await req.json().catch(() => ({}));
  const data = await http<any>(makeApiUrl(`categories/${params.id}`), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return Response.json(data);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  ensureEnvOrThrow();
  const data = await http<any>(makeApiUrl(`categories/${params.id}`), { method: "DELETE" });
  return Response.json(data);
}