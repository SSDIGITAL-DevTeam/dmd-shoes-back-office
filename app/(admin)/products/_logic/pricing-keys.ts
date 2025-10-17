// app/(admin)/products/_logic/pricing-keys.ts
export type Bi = { id: string; en: string };

const norm = (s?: string) => (s ?? "").trim().toLowerCase();

/** Kunci stabil lintas bahasa untuk 1 opsi (contoh: "42|42", "merah|red") */
export const keyOf = (v: Bi) => `${norm(v.id)}|${norm(v.en)}`;

/** Kunci stabil untuk kombinasi opsi */
export const comboKey = (arr: Bi[]) => arr.map(keyOf).join("||");

/** Label tampilan sesuai bahasa saat render */
export const display = (v: Bi, lang: "id" | "en") => (lang === "id" ? v.id || v.en : v.en || v.id);

/** Parse angka size EU bila ada; selain angka → undefined */
export const toSizeEU = (v: Bi) => {
  const raw = (v.en || v.id || "").trim();
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
};