export function formatCurrency(n: number | string, locale: "id" | "en" = "id") {
  const num = typeof n === "string" ? Number(n) : n;
  const fmt = new Intl.NumberFormat(locale === "id" ? "id-ID" : "en-US", {
    style: "currency",
    currency: locale === "id" ? "IDR" : "USD",
    maximumFractionDigits: 0,
  });
  return fmt.format(Number.isFinite(num) ? num : 0);
}