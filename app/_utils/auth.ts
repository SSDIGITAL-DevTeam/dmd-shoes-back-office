// app/api/_utils/auth.ts
import { NextRequest } from "next/server";

export function readBearer(req: NextRequest): string | null {
  const h = req.headers.get("authorization");
  if (h?.toLowerCase().startsWith("bearer ")) return h.slice(7);
  const cookie = req.cookies.get("access_token")?.value;
  return cookie || null;
}