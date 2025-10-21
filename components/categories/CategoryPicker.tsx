// components/categories/CategoryPicker.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AsyncSelect from "react-select/async";
import type { GroupBase } from "react-select";
import {
  fetchAllCategories,
  fetchParentCategories,
  categoryLabel,
  type CategoryItem,
} from "@/services/categories.service";

type Locale = "id" | "en";

export type CategoryOption = { value: number; label: string };

type Props = {
  /** "all" => parent & child (Create Product), "parentOnly" => hanya parent (Create Category) */
  mode: "all" | "parentOnly";
  label: string;
  placeholder?: string;
  value: CategoryOption | null;
  onChange: (v: CategoryOption | null) => void;
  locale?: Locale;
  perPage?: number;    // default 500
  isDisabled?: boolean;
  className?: string;  // agar tidak mengubah layout, biarkan parent yg atur
};

/** Debounce kecil supaya search tidak flood */
function useDebounced<T extends (...args: any[]) => void>(fn: T, delay = 350) {
  const timer = useRef<number | undefined>(undefined);
  return useCallback(
    (...args: Parameters<T>) => {
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => fn(...args), delay);
    },
    [fn, delay]
  );
}

/** Build map id -> CategoryItem untuk susun label hirarki */
function indexById(items: CategoryItem[]) {
  const map = new Map<string | number, CategoryItem>();
  for (const it of items) map.set(it.id, it);
  return map;
}

/** Bentuk label "Parent › Child" (atau lebih dalam jika ada) */
function makeHierLabel(node: CategoryItem, idx: Map<string | number, CategoryItem>, locale: Locale) {
  const chain: string[] = [];
  let cur: CategoryItem | undefined = node;
  let guard = 0;
  while (cur && guard < 10) {
    chain.push(categoryLabel(cur, locale));
    if (cur.parent_id == null) break;
    cur = idx.get(cur.parent_id);
    guard++;
  }
  return chain.reverse().join(" › ");
}

/** Map parent & child jadi flat options (dengan label hirarkis) */
function toAllOptions(items: CategoryItem[], locale: Locale): CategoryOption[] {
  const idx = indexById(items);
  // sort kecil agar stabil (opsional)
  const ordered = [...items].sort((a, b) => String(categoryLabel(a, locale)).localeCompare(categoryLabel(b, locale)));
  return ordered.map((it) => ({
    value: Number(it.id),
    label: it.parent_id == null ? categoryLabel(it, locale) : makeHierLabel(it, idx, locale),
  }));
}

/** Map hanya parent ke options */
function toParentOptions(items: CategoryItem[], locale: Locale): CategoryOption[] {
  const parents = items.filter((c) => c.parent_id == null);
  const ordered = parents.sort((a, b) => String(categoryLabel(a, locale)).localeCompare(categoryLabel(b, locale)));
  return ordered.map((it) => ({ value: Number(it.id), label: categoryLabel(it, locale) }));
}

export default function CategoryPicker({
  mode,
  label,
  placeholder = "Pilih kategori...",
  value,
  onChange,
  locale = "id",
  perPage = 500,
  isDisabled = false,
  className,
}: Props) {
  const [defaultOptions, setDefaultOptions] = useState<CategoryOption[]>([]);
  const [loaded, setLoaded] = useState(false);

  /** Prefetch list awal supaya dropdown langsung berisi */
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (mode === "parentOnly") {
          const parents = await fetchParentCategories(perPage);
          if (!mounted) return;
          setDefaultOptions(toParentOptions(parents, locale));
        } else {
          const all = await fetchAllCategories(perPage);
          if (!mounted) return;
          setDefaultOptions(toAllOptions(all, locale));
        }
      } catch {
        if (!mounted) return;
        setDefaultOptions([]);
      } finally {
        if (mounted) setLoaded(true);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [mode, locale, perPage]);

  /** Loader untuk pencarian client-side (biar tidak ubah route BE) */
  const debounced = useDebounced(
    (input: string, cb: (opts: CategoryOption[]) => void) => {
      const term = (input || "").trim().toLowerCase();
      if (!term) return cb(defaultOptions);
      const filtered = defaultOptions.filter((o) => o.label.toLowerCase().includes(term));
      cb(filtered);
    },
    250
  );

  const loadOptions = useCallback(
    (inputValue: string, callback: (options: CategoryOption[]) => void) => {
      debounced(inputValue, callback);
    },
    [debounced]
  );

  /** Refresh data saat menu dibuka (agar up-to-date) */
  const handleMenuOpen = useCallback(async () => {
    try {
      if (mode === "parentOnly") {
        const parents = await fetchParentCategories(perPage);
        setDefaultOptions(toParentOptions(parents, locale));
      } else {
        const all = await fetchAllCategories(perPage);
        setDefaultOptions(toAllOptions(all, locale));
      }
    } catch {
      /* noop */
    }
  }, [mode, locale, perPage]);

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <AsyncSelect<CategoryOption, false, GroupBase<CategoryOption>>
        isDisabled={isDisabled}
        cacheOptions
        defaultOptions={loaded ? defaultOptions : []}
        loadOptions={loadOptions}
        value={value}
        onChange={(opt) => onChange(opt as CategoryOption | null)}
        placeholder={placeholder}
        openMenuOnFocus
        openMenuOnClick
        onMenuOpen={handleMenuOpen}
        filterOption={() => true}
        getOptionLabel={(o) => o.label}
        getOptionValue={(o) => String(o.value)}
        noOptionsMessage={() => "Tidak ada kategori"}
        loadingMessage={() => "Memuat..."}
        className={className}
        classNamePrefix="select"
        menuPortalTarget={typeof document !== "undefined" ? document.body : null}
        styles={{
          menuPortal: (base) => ({ ...base, zIndex: 50 }),
          control: (base) => ({ ...base, minHeight: 40 }),
        }}
      />
    </div>
  );
}