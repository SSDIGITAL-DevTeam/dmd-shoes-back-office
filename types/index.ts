// types/index.ts
export type Locale = "id" | "en";
export type I18nText = string | { id?: string; en?: string } | null | undefined;

export type PaginationMeta = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};

export type ListResponse<T> = {
  status?: string;
  message?: string;
  data: T[];
  meta?: PaginationMeta;
};

export type ItemBase = {
  id: number | string;
  name?: I18nText;
  title?: I18nText;
  status?: string | boolean | number;
  cover_url?: string | null;
  [key: string]: any;
};

export function t(value: I18nText, locale: Locale = "id"): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  return locale === "id" ? (value.id ?? value.en ?? "") : (value.en ?? value.id ?? "");
}

export function normalizeStatus(s: unknown): boolean {
  if (typeof s === "boolean") return s;
  const str = String(s ?? "").trim().toLowerCase();
  return str === "active" || str === "publish" || str === "1" || str === "true";
}