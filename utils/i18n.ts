export type Localized =
  | string
  | { en: string; id?: string }
  | null
  | undefined;

export function t(value: Localized, locale: "en" | "id" = "en"): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (locale === "id" && value.id) return value.id;
  return value.en ?? value.id ?? "";
}