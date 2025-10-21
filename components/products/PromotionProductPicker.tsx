// components/products/PromotionProductPickers.tsx
"use client";

import React, { useCallback, useMemo, useState } from "react";
import AsyncSelect from "react-select/async";
import type { GroupBase, OptionsOrGroups } from "react-select";
import {
  listProducts,
  type I18nText,
  type ProductItem,
  safeText as safeTextSrv,
} from "@/services/products.service";

/* ===== Types ===== */
export type Locale = "id" | "en";
export type I18n = I18nText;

export type ProductOption = { value: number; label: string };

export type PromotionProductPickersValue = {
  p1: ProductOption | null;
  p2: ProductOption | null;
  p3: ProductOption | null;
  p4: ProductOption | null;
};

type GroupProps = {
  value: PromotionProductPickersValue;
  onChange: (next: PromotionProductPickersValue) => void;
  /** Locale untuk fallback penamaan */
  locale?: Locale;
  /**
   * Loader opsional dari parent (mis. pakai API berbeda).
   * Signature harus mengembalikan array ProductOption.
   */
  loadOptions?: (search: string) => Promise<ProductOption[]>;
};

type PickerProps = {
  label: string;
  placeholder?: string;
  value: ProductOption | null;
  onChange: (v: ProductOption | null) => void;
  excludeIds: number[];
  locale?: Locale;
  maxVisibleItems?: number;
  /** Loader opsional; prioritas di level item */
  loadOptions?: (search: string) => Promise<ProductOption[]>;
};

/* ===== Helpers ===== */
const safeText = (value: I18n, locale: Locale = "id"): string =>
  safeTextSrv(value, locale);

function mapToOptions(rows: ProductItem[], locale: Locale = "id"): ProductOption[] {
  const seen = new Set<number>();
  const out: ProductOption[] = [];
  for (const row of rows || []) {
    const idNum = Number(row?.id);
    if (!Number.isFinite(idNum) || seen.has(idNum)) continue;
    seen.add(idNum);

    const name =
      (row as any)?.name_text ||
      safeText((row as any)?.name, locale) ||
      String((row as any)?.slug ?? (row as any)?.id);

    out.push({ value: idNum, label: String(name) });
  }
  return out;
}

/** Default fetcher (pakai services) */
async function defaultFetchProductOptions(search: string, locale: Locale = "id") {
  try {
    const res = await listProducts({ search: search || "", per_page: 500 });
    const rows: ProductItem[] = Array.isArray((res as any)?.data)
      ? (res as any).data
      : Array.isArray(res as any)
      ? (res as any)
      : [];
    return mapToOptions(rows, locale);
  } catch (err) {
    console.error("[PROMO PICKER] fetch error", err);
    return [];
  }
}

/* ===== Single picker ===== */
function SinglePromotionPicker({
  label,
  placeholder = "Pilih produk...",
  value,
  onChange,
  excludeIds,
  locale = "id",
  maxVisibleItems = 10,
  loadOptions,
}: PickerProps) {
  const [initialOptions, setInitialOptions] =
    useState<OptionsOrGroups<ProductOption, GroupBase<ProductOption>>>([]);

  const loader = useCallback(
    async (inputValue: string) => {
      const all = loadOptions
        ? await loadOptions(inputValue)
        : await defaultFetchProductOptions(inputValue, locale);
      return all.filter((opt) => !excludeIds.includes(opt.value));
    },
    [excludeIds, loadOptions, locale]
  );

  const onMenuOpen = useCallback(async () => {
    const all = loadOptions
      ? await loadOptions("")
      : await defaultFetchProductOptions("", locale);
    setInitialOptions(all.filter((opt) => !excludeIds.includes(opt.value)));
  }, [excludeIds, loadOptions, locale]);

  const maxMenuHeight = Math.max(280, Math.floor(maxVisibleItems * 38));

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <AsyncSelect<ProductOption, false, GroupBase<ProductOption>>
        cacheOptions
        defaultOptions={initialOptions}
        loadOptions={loader}
        value={value}
        onChange={(opt) => onChange(opt as ProductOption | null)}
        placeholder={placeholder}
        openMenuOnFocus
        openMenuOnClick
        onMenuOpen={onMenuOpen}
        maxMenuHeight={maxMenuHeight}
        filterOption={() => true}
        getOptionValue={(o) => String(o.value)}
        getOptionLabel={(o) => o.label}
        noOptionsMessage={() => "Tidak ada produk"}
        loadingMessage={() => "Memuat..."}
        classNamePrefix="select"
        menuPortalTarget={
          typeof document !== "undefined" ? document.body : null
        }
        styles={{
          menuPortal: (base) => ({ ...base, zIndex: 50 }),
          control: (base, state) => ({
            ...base,
            borderRadius: "0.5rem",
            borderColor: state.isFocused ? "#3B82F6" : "#d1d5db",
            boxShadow: state.isFocused ? "0 0 0 2px rgba(59,130,246,0.3)" : "none",
            padding: "2px",
          }),
          // pastikan teks hitam
          singleValue: (base) => ({ ...base, color: "#000" }),
          input: (base) => ({ ...base, color: "#000" }),
          placeholder: (base) => ({ ...base, color: "#000" }),
          valueContainer: (base) => ({ ...base, color: "#000" }),
          option: (base, state) => ({
            ...base,
            backgroundColor: state.isFocused
              ? "#EFF6FF" // blue-50
              : state.isSelected
              ? "#F9FAFB" // gray-50
              : "white",
            color: "#000",
            cursor: "pointer",
          }),
          menu: (base) => ({ ...base }),
          menuList: (base) => ({
            ...base,
            backgroundColor: "white",
            color: "#000",
          }),
        }}
        isOptionDisabled={(opt) => excludeIds.includes(opt.value)}
      />
    </div>
  );
}

/* ===== Group of 4 pickers ===== */
export default function PromotionProductPickers({
  value,
  onChange,
  locale = "id",
  loadOptions,
}: GroupProps) {
  const chosenIds = useMemo(
    () =>
      [value.p1?.value, value.p2?.value, value.p3?.value, value.p4?.value].filter(
        Boolean
      ) as number[],
    [value]
  );

  const makeExclude = useCallback(
    (self?: ProductOption | null) => {
      const ids = chosenIds.slice();
      if (self?.value) return ids.filter((id) => id !== self.value);
      return ids;
    },
    [chosenIds]
  );

  const setP =
    (k: keyof PromotionProductPickersValue) =>
    (opt: ProductOption | null) =>
      onChange({ ...value, [k]: opt });

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <SinglePromotionPicker
        label="Promotion Product 1"
        value={value.p1}
        onChange={setP("p1")}
        excludeIds={makeExclude(value.p1)}
        locale={locale}
        loadOptions={loadOptions}
      />
      <SinglePromotionPicker
        label="Promotion Product 2"
        value={value.p2}
        onChange={setP("p2")}
        excludeIds={makeExclude(value.p2)}
        locale={locale}
        loadOptions={loadOptions}
      />
      <SinglePromotionPicker
        label="Promotion Product 3"
        value={value.p3}
        onChange={setP("p3")}
        excludeIds={makeExclude(value.p3)}
        locale={locale}
        loadOptions={loadOptions}
      />
      <SinglePromotionPicker
        label="Promotion Product 4"
        value={value.p4}
        onChange={setP("p4")}
        excludeIds={makeExclude(value.p4)}
        locale={locale}
        loadOptions={loadOptions}
      />
    </div>
  );
}