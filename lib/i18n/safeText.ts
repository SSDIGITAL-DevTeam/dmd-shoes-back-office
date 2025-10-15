export type MaybeI18n = string | { id?: string; en?: string } | null | undefined;

export function safeText(value: MaybeI18n, locale: "id" | "en" = "id"): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  // object case
  const obj = value as { id?: string; en?: string };
  // prioritas sesuai locale, lalu fallback
  if (locale === "id") return obj.id ?? obj.en ?? "";
  return obj.en ?? obj.id ?? "";
}