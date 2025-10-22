// app/(admin)/products/[id]/edit/page.tsx
"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/lib/fetching";
import {
  CreateButton as UpdateButton,
  CancelButton,
} from "@/components/ui/ActionButton";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { DeleteButton as DeleteIcon } from "@/components/ui/DeleteIcon";
import AsyncSelect from "react-select/async";
import ProductGallery from "@/app/(admin)/products/create/_components/ProductGallery";
import PromotionProductPickers, {
  type PromotionProductPickersValue,
} from "@/components/products/PromotionProductPicker";

import {
  listProducts,
  type ProductItem,
  safeText as safeTextSrv,
} from "@/services/products.service";

/** ===== Types ===== */
interface LangText { id: string; en: string; }
interface Gallery {
  id: number;
  image: string;
  fileName: string;
  title: string;
  alt: string;
  file?: File | null;
  uploading?: boolean;
}
interface Variant { id: number; name: LangText; options: LangText[]; }
type ProductDetail = any;

type VPriceRow = {
  labels: { id?: string; en?: string }[];
  price?: number | string | null;
  stock?: number | string | null;
  active?: boolean;
  sku?: string | null;
  size_eu?: number | string | null;
};

/** ===== Utils ===== */
const parseNumber = (v: any) => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
};
const getLabelValue = (lb: any): string => {
  const candidates = [
    lb?.value?.en, lb?.value?.id, lb?.option?.en, lb?.option?.id,
    lb?.en, lb?.id, lb?.text, lb?.name?.en, lb?.name?.id,
  ];
  for (const c of candidates) if (typeof c === "string" && c.trim()) return c.trim();
  const s = String(lb ?? "").trim(); if (!s) return "";
  const parts = s.split(":"); return (parts.length > 1 ? parts.slice(1).join(":") : s).trim();
};
const asLang = (v: any): string => (typeof v === "string" ? v : v?.id ?? v?.en ?? v?.text ?? v?.name ?? "");
const toLangText = (v: any): LangText => {
  if (typeof v === "string") return { id: v, en: v };
  if (v && (v.id || v.en)) return { id: String(v.id ?? v.en ?? ""), en: String(v.en ?? v.id ?? "") };
  return { id: "", en: "" };
};
const normalizeDefs = (defs: any[]): Variant[] =>
  (defs || []).slice(0, 3).map((d, i) => {
    const name = toLangText(d?.name ?? d?.label ?? "");
    const rawOpts: any[] = d?.options ?? d?.values ?? d?.items ?? [];
    const options = rawOpts.map((o: any) => toLangText(o?.label ?? o?.value ?? o));
    if (!options.some((o) => (o.id || o.en).trim() === "")) options.push({ id: "", en: "" });
    return { id: i + 1, name, options };
  });
const ensure3Variants = (attrs: Variant[]): Variant[] => {
  let out = (attrs || []).slice(0, 3).map((v, i) => ({
    id: i + 1,
    name: v.name,
    options: v.options.some((o) => (o.id || o.en).trim() === "") ? v.options : [...v.options, { id: "", en: "" }],
  }));
  while (out.length < 3) out.push({ id: out.length + 1, name: { id: "", en: "" }, options: [{ id: "", en: "" }] });
  return out;
};
const mapAttributesDataToVariants = (attributes_data: any[]): Variant[] => {
  if (!Array.isArray(attributes_data)) return [];
  return attributes_data.slice(0, 3).map((a: any, idx: number) => {
    const nm = a?.name ?? {};
    const options = Array.isArray(a?.options) ? a.options.map((o: any) => toLangText(o?.value ?? o)) : [{ id: "", en: "" }];
    if (!options.some((o: { id: any; en: any }) => (o.id || o.en).trim() === "")) options.push({ id: "", en: "" });
    return { id: idx + 1, name: { id: asLang(nm?.id), en: asLang(nm?.en) }, options };
  });
};
const splitVariantLabelParts = (label: string): string[] =>
  String(label || "").split("|").map((s) => s.replace(/\s+/g, " ").trim()).filter(Boolean);
const optKey = (o: LangText) => (o.en?.trim() || o.id?.trim() || "").trim();
const findOption = (opts: LangText[], s: string): LangText | null => {
  const t = s.trim().toLowerCase();
  return opts.find((o) => o.en?.trim().toLowerCase() === t) || opts.find((o) => o.id?.trim().toLowerCase() === t) || null;
};
const valuesFromLabels = (labels: string[], variants: Variant[]): string[] =>
  labels.map((lab, idx) => {
    const raw = lab.includes(":") ? lab.split(":").slice(1).join(":").trim() : lab.trim();
    const v = variants[idx]; if (!v) return raw;
    const match = findOption(v.options.filter((o) => (o.id || o.en).trim() !== ""), raw);
    return match ? optKey(match) : raw;
  });
const comboKeyDash = (arr: string[]) => arr.join("-");
const comboKeyPipe = (arr: string[]) => arr.join("||"); // dipakai untuk field `key` ke backend
const getLabelName = (lb: any): { id?: string; en?: string } => {
  const rawId = typeof lb?.id === "string" ? lb.id : "";
  const rawEn = typeof lb?.en === "string" ? lb.en : "";
  const getLeft = (s: string) => (s.includes(":") ? s.split(":")[0].trim() : "");
  return { id: getLeft(rawId) || undefined, en: getLeft(rawEn) || undefined };
};
const inferAttributesFromVariantPrices = (rawVariantPrices: any[]): Variant[] => {
  if (!Array.isArray(rawVariantPrices) || rawVariantPrices.length === 0) return [];
  type Slot = { name: { id?: string; en?: string }; options: Set<string> };
  const slots = new Map<number, Slot>();
  for (const vp of rawVariantPrices) {
    const labels = Array.isArray(vp?.labels) ? vp.labels : [];
    labels.forEach((lb: any, idx: number) => {
      if (!slots.has(idx)) slots.set(idx, { name: {}, options: new Set() });
      const slot = slots.get(idx)!;
      const nm = getLabelName(lb);
      if (nm.id && !slot.name.id) slot.name.id = nm.id;
      if (nm.en && !slot.name.en) slot.name.en = nm.en;
      const rightId = (() => {
        const s = typeof lb?.id === "string" ? lb.id : "";
        const v = s.includes(":") ? s.split(":").slice(1).join(":").trim() : s.trim();
        return v || getLabelValue(lb);
      })();
      const rightEn = (() => {
        const s = typeof lb?.en === "string" ? lb.en : "";
        const v = s.includes(":") ? s.split(":").slice[1]?.join(":")?.trim() : s.trim?.() ?? "";
        return v || getLabelValue(lb);
      })();
      const opt = JSON.stringify({ id: rightId || rightEn || "", en: rightEn || rightId || "" });
      const parsed = JSON.parse(opt);
      if ((parsed.id || parsed.en).trim() !== "") slot.options.add(opt);
    });
  }
  const attributes: Variant[] = [];
  Array.from(slots.entries()).sort((a, b) => a[0] - b[0]).slice(0, 3).forEach(([_, slot], idx) => {
    const name_id = slot.name.id || slot.name.en || `Variant ${idx + 1}`;
    const name_en = slot.name.en || slot.name.id || `Variant ${idx + 1}`;
    const options = Array.from(slot.options).map((s) => JSON.parse(s) as LangText);
    if (!options.some((o) => (o.id || o.en).trim() === "")) options.push({ id: "", en: "" });
    attributes.push({ id: idx + 1, name: { id: name_id, en: name_en }, options });
  });
  return attributes;
};
const extractRawVariantPrices = (d: any): VPriceRow[] => {
  const rows: VPriceRow[] = [];
  if (Array.isArray(d?.variants_data)) {
    d.variants_data.forEach((v: any) => {
      const parts = Array.isArray(v?.labels)
        ? v.labels.map(getLabelValue)
        : splitVariantLabelParts(String(v?.label_text ?? v?.label ?? "")); 
      const labels = parts.map((p: string) => ({ id: p, en: p }));
      rows.push({
        labels,
        price: v?.price ?? v?.price_min ?? null,
        stock: v?.stock ?? v?.qty ?? null,
        active: v?.active ?? true,
        sku: v?.sku ?? null,
        size_eu: v?.size_eu ?? null,
      });
    });
  }
  const vpRaw = d?.variant_prices?.data ?? d?.variant_prices ?? d?.variants_prices ?? d?.variants?.prices ?? d?.prices;
  if (Array.isArray(vpRaw)) {
    vpRaw.forEach((it: any) => {
      let labels: any[] = [];
      if (Array.isArray(it?.labels) && it.labels.length) labels = it.labels;
      else if (it?.key) {
        labels = String(it.key).split("||").map((s: string) => s.trim()).filter(Boolean).map((p: string) => ({ id: p, en: p }));
      } else if (it?.combination || it?.combo) {
        const c = it?.combination ?? it?.combo;
        labels = Array.isArray(c) ? c.map((x: any) => {
          if (typeof x === "string") return { id: x, en: x };
          const id = x?.en ?? x?.id ?? x?.value ?? x?.text ?? "";
          return { id, en: id };
        }) : [];
      } else if (it?.variant_names || it?.options) {
        const names = it?.variant_names ?? it?.options;
        if (Array.isArray(names)) {
          labels = names.map((name: any) => typeof name === "string" ? { id: name, en: name } : { id: name?.id || name?.en || "", en: name?.en || name?.id || "" });
        }
      }
      if (labels.length > 0) {
        rows.push({ labels, price: it?.price ?? null, stock: it?.stock ?? null, active: it?.active ?? true, sku: it?.sku ?? null, size_eu: it?.size_eu ?? null });
      }
    });
  } else if (vpRaw && typeof vpRaw === "object") {
    Object.entries(vpRaw).forEach(([k, v]: any) => {
      const parts = String(k).split("||").map((s: string) => s.trim()).filter(Boolean).map((p: string) => ({ id: p, en: p }));
      rows.push({ labels: parts, price: typeof v === "object" ? v?.price : v, stock: typeof v === "object" ? v?.stock ?? null : null, active: typeof v === "object" ? v?.active ?? true : true, sku: typeof v === "object" ? v?.sku ?? null : null });
    });
  }
  if (Array.isArray(d?.variants)) {
    d.variants.forEach((variant: any) => {
      if (variant?.price !== undefined) {
        const labels: any[] = [];
        if (variant?.name) labels.push({ id: variant.name, en: variant.name });
        if (variant?.size) labels.push({ id: variant.size, en: variant.size });
        if (variant?.color) labels.push({ id: variant.color, en: variant.color });
        if (labels.length > 0) rows.push({ labels, price: variant.price, stock: variant.stock ?? null, active: variant.active ?? true, sku: variant.sku ?? null, size_eu: variant.size_eu ?? null });
      }
    });
  }
  return rows;
};

/** ===== Kategori helpers ===== */
type CategoryOption = { value: number | string; label: string; image?: string | null; };
const mapCategoryToOption = (cat: any): CategoryOption => ({
  value: cat?.id ?? cat?.uuid ?? cat?.value ?? cat?.slug ?? "",
  label:
    (cat?.name && (cat.name.id || cat.name.en)) ||
    cat?.title?.en || cat?.title?.id || cat?.label || cat?.slug ||
    `Category ${cat?.id ?? ""}`,
  image: cat?.cover_url || cat?.cover || cat?.image_url || null,
});
const tryFetchCategories = async (search: string) => {
  const bases = ["/api/categories", "/api/category", "/api/product-categories"];
  const paramVariants: Array<Record<string, any>> = [
    { per_page: 100, search }, { per_page: 100, q: search },
    { per_page: 100, status: "active", search }, { per_page: 100, status: "active", q: search },
    { per_page: 100, status: "publish", search }, { per_page: 100, status: "publish", q: search },
    { per_page: 100, status: "published", search }, { per_page: 100, status: "published", q: search },
    { limit: 100, search }, { limit: 100, q: search },
  ];
  const extraHints = [{ type: "product" }, { kind: "product" }];
  const attempts: Array<{ url: string; params: Record<string, any> }> = [];
  for (const base of bases) for (const pv of paramVariants) {
    attempts.push({ url: base, params: pv });
    for (const hint of extraHints) attempts.push({ url: base, params: { ...pv, ...hint } });
  }
  const extractList = (payload: any) => {
    if (Array.isArray(payload)) return payload;
    const d = payload?.data ?? payload;
    if (Array.isArray(d)) return d;
    if (Array.isArray(d?.data)) return d.data;
    if (Array.isArray(d?.items)) return d.items;
    if (Array.isArray(payload?.data?.data)) return payload.data.data;
    return [];
  };
  for (const att of attempts) {
    try {
      const res = await api.get(att.url as any, { params: att.params } as any);
      const payload = (res as any)?.data ?? res;
      const list = extractList(payload);
      if (Array.isArray(list)) return list.map(mapCategoryToOption);
    } catch {}
  }
  return [] as CategoryOption[];
};
const tryFetchCategoryById = async (id: number | string) => {
  const paths = ["/api/categories", "/api/category", "/api/product-categories"];
  for (const base of paths) {
    try {
      const res = await api.get(`${base}/${id}` as any);
      const payload = (res as any)?.data ?? res;
      const cat = payload?.data && !Array.isArray(payload.data) ? payload.data : payload;
      if (cat && (cat.id !== undefined || cat.slug)) return mapCategoryToOption(cat);
    } catch {}
  }
  return null as CategoryOption | null;
};

/** ========================================================================= */

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const productId = params?.id;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [language, setLanguage] = useState<"id" | "en">("en");

  // Cover file (baru diupload)
  const [coverFile, setCoverFile] = useState<File | null>(null);

  // form state
  const [formData, setFormData] = useState({
    slug: "",
    category: "",
    category_id: null as number | null,
    price: "",
    tags: "",
    featured: false,
    status: true,
    heel_height_cm: "",
    name_id: "",
    name_en: "",
    description_id: "",
    description_en: "",
    keyword_id: "",
    keyword_en: "",
    seoDescription_id: "",
    seoDescription_en: "",
    cover_url: "" as string | null,
  });

  const [categoryOption, setCategoryOption] = useState<CategoryOption | null>(null);
  const [galleries, setGalleries] = useState<Gallery[]>([]);

  // Variants & pricing
  const [variants, setVariants] = useState<Variant[]>(ensure3Variants([]));
  const [pricingType, setPricingType] = useState<"single" | "per_variant">("single");
  const [variantPriceRows, setVariantPriceRows] = useState<VPriceRow[]>([]);
  const [promoPick, setPromoPick] = useState<PromotionProductPickersValue>({ p1: null, p2: null, p3: null, p4: null });
  const [groupPrices, setGroupPrices] = useState<Record<string, string>>({});
  const [individualPrices, setIndividualPrices] = useState<Record<string, string>>({});
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [openSubGroups, setOpenSubGroups] = useState<Record<string, Record<string, boolean>>>({});

  const isGroupOpen = (first: string) => openGroups[first] !== false;
  const toggleGroup = (first: string) => setOpenGroups((prev) => ({ ...prev, [first]: !isGroupOpen(first) }));
  const isSubOpen = (first: string, second: string) => openSubGroups[first]?.[second] ?? true;
  const toggleSub = (first: string, second: string) =>
    setOpenSubGroups((prev) => ({ ...prev, [first]: { ...(prev[first] || {}), [second]: !isSubOpen(first, second) } }));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleToggleFeatured = () => setFormData((p) => ({ ...p, featured: !p.featured })); 
  const handleToggleStatus = () => setFormData((p) => ({ ...p, status: !p.status }));

  /** ======= LOAD DETAIL ======= */
  useEffect(() => {
    if (!productId) return;
    let mounted = true;

    const fetchDetail = async (id: string | number) => {
      const attempts: Array<{ url: string; params?: Record<string, any> }> = [
        { url: `/api/products/${id}`, params: { include: "attributes_data,variants_data,variant_prices,gallery,category", lang: "id" } },
        { url: `/api/products/${id}` },
      ];
      for (const att of attempts) {
        try {
          const res = await api.get<ProductDetail>(att.url as any, { params: att.params } as any);
          const root = (res as any)?.data ?? res;
          const d: any = (root?.data && !Array.isArray(root.data) ? root.data : root) ?? {};
          if (d && (d.id !== undefined || d.slug || d.name)) return d;
        } catch {}
      }
      throw new Error("Gagal memuat detail produk.");
    };

    (async () => {
      try {
        setLoading(true);
        setErrorMessage(null);
        const d = await fetchDetail(productId);
        if (!mounted) return;

        const name_id = d?.name?.id ?? "";
        const name_en = d?.name?.en ?? d?.title?.en ?? "";
        const desc_id = d?.description?.id ?? "";
        const desc_en = d?.description?.en ?? "";
        const statusStr = String(d?.status ?? "").toLowerCase();
        const isActive =
          statusStr === "active" || statusStr === "publish" || d?.published === true || d?.status === true || d?.status === 1;

        const seo = d?.seo || {};
        const seoKeyword = seo?.keyword || {};
        const seoDesc = seo?.description || {};
        const seoTags = Array.isArray(seo?.tags) ? seo.tags : Array.isArray(d?.seo_tags) ? d.seo_tags : [];

        setFormData((prev) => ({
          ...prev,
          slug: d?.slug ?? "",
          category: d?.category?.name?.id || d?.category?.name?.en || d?.category?.slug || "",
          category_id: d?.category_id ?? d?.category?.id ?? null,
          price: d?.price != null ? String(d.price) : "",
          featured: !!d?.featured,
          status: !!isActive,
          heel_height_cm: d?.heel_height_cm != null ? String(d.heel_height_cm) : "",
          name_id,
          name_en,
          description_id: desc_id,
          description_en: desc_en,
          tags: (seoTags || []).join(", "),
          keyword_id: seoKeyword?.id ?? "",
          keyword_en: seoKeyword?.en ?? "",
          seoDescription_id: seoDesc?.id ?? "",
          seoDescription_en: seoDesc?.en ?? "",
          cover_url: d?.cover_url || d?.cover || "",
        }));

        // category option
        const catId = d?.category_id ?? d?.category?.id ?? null;
        const catLabel = d?.category?.name?.id || d?.category?.name?.en || d?.category?.slug || "";
        if (catId) setCategoryOption(catLabel ? { value: catId, label: catLabel } : (await tryFetchCategoryById(catId)) ?? { value: catId, label: `#${catId}` });
        else setCategoryOption(null);

        /** ===== VARIANTS & PRICE ===== */
        const pricingMode = String(d?.pricing_mode ?? "").toLowerCase();
        let attrs: Variant[] = [];

        // 1) Definisi variant/attributes dari beberapa bentuk payload
        if (Array.isArray(d?.attributes_data) && d.attributes_data.length > 0) {
          attrs = mapAttributesDataToVariants(d.attributes_data);
        } else if (Array.isArray(d?.attributes) && d.attributes.length > 0) {
          attrs = d.attributes.map((a: any, idx: number) => ({
            id: idx + 1,
            name: { id: asLang(a?.name?.id ?? a?.name), en: asLang(a?.name?.en ?? a?.name) },
            options: Array.isArray(a?.options) ? a.options.map((o: any) => toLangText(o?.label ?? o)) : [{ id: "", en: "" }],
          }));
        } else if (Array.isArray(d?.variant_definitions) && d.variant_definitions.length > 0) {
          attrs = normalizeDefs(d.variant_definitions);
        } else if (d?.variants) {
          if (Array.isArray(d.variants.definitions)) attrs = normalizeDefs(d.variants.definitions);
          else if (Array.isArray(d.variants.attributes)) attrs = normalizeDefs(d.variants.attributes);
        }

        // 2) Ambil semua kemungkinan data harga varian
        let rawVariantPrices: VPriceRow[] = extractRawVariantPrices(d);

        // 3) Jika belum ada attrs tapi ada rows harga varian, infer
        if ((!attrs || attrs.length === 0) && rawVariantPrices.length > 0) {
          const inferred = inferAttributesFromVariantPrices(rawVariantPrices);
          if (inferred.length > 0) attrs = inferred;
        }

        // 4) Pastikan 3 slot variant & trailing option kosong
        attrs = ensure3Variants(attrs);
        setVariants(attrs);

        // 5) Tentukan pricing type berdasar DB; fallback infer bila kosong
        const hasAnyVariantPrice = (rawVariantPrices || []).some((r) => {
          const v = r?.price;
          if (v === null || v === undefined) return false;
          const s = String(v).trim().toLowerCase();
          return s !== "" && s !== "null" && s !== "undefined" && s !== "nan";
        });

        const initialPricingType: "single" | "per_variant" =
          pricingMode === "single" || pricingMode === "per_variant"
            ? (pricingMode as "single" | "per_variant")
            : (hasAnyVariantPrice ? "per_variant" : "single");

        if (initialPricingType === "per_variant") {
          setPricingType("per_variant");

          // Normalisasi rows
          const rows = rawVariantPrices.map((vp: any) => ({
            labels: Array.isArray(vp?.labels) ? vp.labels : [],
            price: vp?.price ?? null,
            stock: vp?.stock ?? null,
            active: !!vp?.active || vp?.active === 1,
            sku: vp?.sku ?? null,
            size_eu: vp?.size_eu ?? null,
          }));
          setVariantPriceRows(rows);

          // Build groupPrices/individualPrices sesuai dimensi variant
          const validAttrs = (attrs || []).filter((v) => v.options.some((o) => (o.id || o.en).trim() !== ""));
          if (validAttrs.length === 1) {
            const v0 = validAttrs[0];
            const gp: Record<string, string> = {};
            rows.forEach((r) => {
              const labels = (r.labels || []).map(getLabelValue).filter(Boolean);
              if (!labels.length) return;
              const firstLabel = labels[0];
              const matchingOption = v0.options.find((opt) => {
                const k = optKey(opt);
                return (
                  k === firstLabel || opt.id === firstLabel || opt.en === firstLabel ||
                  (firstLabel.includes(":") && firstLabel.split(":")[1]?.trim() === k) ||
                  firstLabel.includes(opt.id) || firstLabel.includes(opt.en)
                );
              });
              const key = matchingOption
                ? optKey(matchingOption)
                : (firstLabel.includes(":") ? firstLabel.split(":")[1]?.trim() : firstLabel);
              if (key && key.trim() && key !== "undefined" && key !== "[object Object]") {
                gp[key] = String(r.price ?? "");
              }
            });
            setGroupPrices(gp);
            setIndividualPrices({});
          } else if (validAttrs.length >= 2) {
            const ip: Record<string, string> = {};
            rows.forEach((r) => {
              const labels = (r.labels || []).map(getLabelValue).filter(Boolean);
              const vals = valuesFromLabels(labels, validAttrs).filter(Boolean);
              if (vals.length >= 2) ip[comboKeyDash(vals)] = String(r.price ?? "");
            });
            setIndividualPrices(ip);
            setGroupPrices({});
          } else {
            // Tidak ada opsi valid
            setGroupPrices({});
            setIndividualPrices({});
          }
        } else {
          setPricingType("single");
          setVariantPriceRows([]);
          setGroupPrices({});
          setIndividualPrices({});
        }

        // gallery
        const gal: Gallery[] = Array.isArray(d?.gallery)
          ? d.gallery.map((g: any, idx: number) => ({
              id: idx + 1,
              image: g?.image_url || g?.url || g?.image || "",
              fileName: g?.file_name || `image-${idx + 1}.jpg`,
              title: g?.title?.en ?? g?.title?.id ?? (typeof g?.title === "string" ? g.title : "") ?? "",
              alt: g?.alt?.en ?? g?.alt?.id ?? (typeof g?.alt === "string" ? g.alt : "") ?? "",
              file: null,
            }))
          : [];
        setGalleries(gal);

        // promotion
        if (Array.isArray(d?.related_products)) {
          const toOption = (p: any) => {
            const idNum = Number(p?.id);
            const label =
              p?.name?.id || p?.name?.en || p?.name_text || safeTextSrv(p?.name, "id") ||
              p?.slug || (Number.isFinite(idNum) ? `Product ${idNum}` : "Product");
            return Number.isFinite(idNum) ? { value: idNum, label: String(label) } : null;
          };
          const opts = d.related_products.map(toOption).filter(Boolean).slice(0, 4) as any[];
          setPromoPick({ p1: opts[0] ?? null, p2: opts[1] ?? null, p3: opts[2] ?? null, p4: opts[3] ?? null });
        } else if (Array.isArray(d?.related_ids)) {
          const ids = d.related_ids.slice(0, 4).filter((n: any) => Number.isFinite(Number(n)));
          setPromoPick({
            p1: ids[0] ? { value: Number(ids[0]), label: String(ids[0]) } : null,
            p2: ids[1] ? { value: Number(ids[1]), label: String(ids[1]) } : null,
            p3: ids[2] ? { value: Number(ids[2]), label: String(ids[2]) } : null,
            p4: ids[3] ? { value: Number(ids[3]), label: String(ids[3]) } : null,
          });
        }
      } catch (err: any) {
        setErrorMessage(err?.response?.data?.message || err?.message || "Gagal memuat detail produk.");
      } finally {
        setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [productId]);

  /** ======= LOADERS ======= */
  const loadCategoryOptions = useCallback(async (inputValue: string) => {
    try { return await tryFetchCategories(inputValue || ""); } catch { return []; }
  }, []);
  const loadPromotionOptions = useCallback(async (inputValue: string) => {
    try {
      const res = await listProducts({ search: inputValue || "", per_page: 100 });
      const rows: ProductItem[] =
        Array.isArray((res as any)?.data) ? (res as any).data :
        Array.isArray(res as any) ? (res as any) :
        Array.isArray((res as any)?.data?.data) ? (res as any).data.data : [];
      const seen = new Set<number>();
      const options = rows.map((p) => {
        const idNum = Number((p as any)?.id);
        if (!Number.isFinite(idNum) || seen.has(idNum)) return null;
        seen.add(idNum);
        const lbl = (p as any)?.name_text || safeTextSrv((p as any)?.name, "id") || String((p as any)?.slug ?? (p as any)?.id);
        return { value: idNum, label: String(lbl) };
      }).filter(Boolean) as { value: number; label: string }[];
      return options;
    } catch { return []; }
  }, []);

  /** ======= VARIANT OPS ======= */
  const handleVariantNameChange = (id: number, value: string, lang: "id" | "en") =>
    setVariants((prev: Variant[]) => prev.map((v) => (v.id === id ? { ...v, name: { ...v.name, [lang]: value } } : v)));
  const handleOptionChange = (variantId: number, optionIndex: number, value: string, lang: "id" | "en") =>
    setVariants((prev: Variant[]) =>
      prev.map((variant) => {
        if (variant.id !== variantId) return variant;
        const newOptions = variant.options.map((o, i) => (i === optionIndex ? { ...o, [lang]: value } : o));
        const hasEmpty = newOptions.some((opt) => (opt.id || opt.en).trim() === "");
        const finalOptions = hasEmpty ? newOptions : [...newOptions, { id: "", en: "" }];
        return { ...variant, options: finalOptions };
      })
    );
  const handleRemoveOption = (variantId: number, optionIndex: number) =>
    setVariants((prev: Variant[]) =>
      prev.map((variant) => {
        if (variant.id !== variantId) return variant;
        const newOptions = variant.options.filter((_, i) => i !== optionIndex);
        if (!newOptions.some((opt) => (opt.id || opt.en).trim() === "")) newOptions.push({ id: "", en: "" });
        return { ...variant, options: newOptions };
      })
    );

  const getValidVariants = useMemo(
    () => () => (variants as Variant[]).filter((v) => v.options.some((o) => (o.id || o.en).trim() !== "")),
    [variants]
  );
  const validVariantCount = getValidVariants().length;

  useEffect(() => {
    if (validVariantCount !== 1 && Object.keys(groupPrices).length > 0) setGroupPrices({});
  }, [validVariantCount]);

  const generateVariantCombinations = () => {
    const valid = getValidVariants();
    if (valid.length === 0) return [];
    const combinations: string[][] = [[]];
    valid.forEach((variant) => {
      const opts = variant.options.filter((o) => (o.id || o.en).trim() !== "").map((o) => optKey(o));
      const next: string[][] = [];
      combinations.forEach((c) => opts.forEach((o) => next.push([...c, o])));
      (combinations as string[][]).length = 0;
      combinations.push(...next);
    });
    return combinations;
  };
  const groupedCombinations = () => {
    const grouped: { [key: string]: string[][] } = {};
    generateVariantCombinations().forEach((comb) => {
      const first = comb[0] || "Default";
      if (!grouped[first]) grouped[first] = [];
      grouped[first].push(comb);
    });
    return grouped;
  };

  useEffect(() => {
    const combos = generateVariantCombinations();
    const groups: Record<string, boolean> = {};
    const subGroups: Record<string, Record<string, boolean>> = {};
    combos.forEach((c) => {
      const first = c[0] || "Default";
      const second = c[1];
      groups[first] = true;
      if (second) {
        if (!subGroups[first]) subGroups[first] = {};
        subGroups[first][String(second)] = true;
      }
    });
    setOpenGroups(groups);
    setOpenSubGroups(subGroups);
  }, [variants, language]);

  // Gallery handlers
  const handleGalleryChange = (id: number, field: string, value: string) =>
    setGalleries((prev) => prev.map((g) => (g.id === id ? { ...g, [field]: value } : g)));
  const handleRemoveGallery = (id: number) => setGalleries((prev) => prev.filter((g) => g.id !== id));
  const handleAddGallery = () =>
    setGalleries((prev) => [...prev, { id: prev.length + 1, image: "", title: "", alt: "", fileName: "file.jpg" }]);

  /** ======= SUBMIT (POST + _method=PATCH ke /api/products/[id]) ======= */
  const handleUpdate = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    const slug = formData.slug.trim();
    const categoryId = formData.category_id;
    const pricingMode: "single" | "per_variant" = pricingType === "single" ? "single" : "per_variant";
    const rootPriceValue = parseNumber(formData.price);

    const errors: string[] = [];
    if (!formData.name_en && !formData.name_id) errors.push("Nama produk wajib diisi (ID/EN).");
    if (!slug) errors.push("Slug wajib diisi.");
    if (!formData.description_en && !formData.description_id) errors.push("Deskripsi wajib diisi (ID/EN).");
    if (!categoryId) errors.push("Kategori wajib dipilih.");
    const validVariants = getValidVariants();
    const variantCombinations = generateVariantCombinations();
    if (pricingMode === "single" && rootPriceValue == null) errors.push("Harga produk wajib diisi.");
    if (pricingMode === "per_variant" && validVariants.length > 0 && variantCombinations.length === 0) {
      errors.push("Lengkapi opsi varian sebelum menyimpan.");
    }
    if (errors.length > 0) { setErrorMessage(errors[0]); return; }

    setSubmitting(true);
    try {
      const fd = new FormData();

      // spoof method Laravel agar multipart aman via proxy
      fd.append("_method", "PATCH");

      // status & flags
      fd.append("status", formData.status ? "1" : "0");
      fd.append("featured", formData.featured ? "1" : "0");
      fd.append("category_id", String(categoryId));
      fd.append("pricing_mode", pricingMode);
      fd.append("slug", slug);
      fd.append("heel_height_cm", formData.heel_height_cm || "0");

      // bilingual fields
      fd.append("name[id]", formData.name_id || "");
      fd.append("name[en]", formData.name_en || "");
      fd.append("description[id]", formData.description_id || "");
      fd.append("description[en]", formData.description_en || "");

      // COVER — kirim file jika ada
      if (coverFile) {
        fd.append("cover", coverFile);
        fd.append("cover_file", coverFile);
      }

      // SEO
      const seoTags = formData.tags.split(/[,\n]/).map((t) => t.trim()).filter(Boolean);
      seoTags.forEach((tag, i) => fd.append(`seo_tags[${i}]`, tag));
      if (formData.keyword_id) fd.append("seo_keyword[id]", formData.keyword_id);
      if (formData.keyword_en) fd.append("seo_keyword[en]", formData.keyword_en);
      if (formData.seoDescription_id) fd.append(`seo_description[id]`, formData.seoDescription_id);
      if (formData.seoDescription_en) fd.append(`seo_description[en]`, formData.seoDescription_en);

      // Attributes
      const attributes = validVariants.map((variant, index) => ({
        name: { id: variant.name.id || variant.name.en || `Variant ${index + 1}`, en: variant.name.en || variant.name.id || `Variant ${index + 1}` },
        options: variant.options.filter((o) => (o.id || o.en).trim() !== "").map((o) => ({ id: o.id || o.en, en: o.en || o.id })),
      }));
      attributes.forEach((attr, i) => {
        fd.append(`attributes[${i}][name][id]`, attr.name.id);
        fd.append(`attributes[${i}][name][en]`, attr.name.en);
        attr.options.forEach((opt, j) => {
          fd.append(`attributes[${i}][options][${j}][id]`, opt.id);
          fd.append(`attributes[${i}][options][${j}][en]`, opt.en);
        });
      });
      // alias kunci (jaga-jaga)
      attributes.forEach((attr, i) => {
        fd.append(`variant_attributes[${i}][name][id]`, attr.name.id);
        fd.append(`variant_attributes[${i}][name][en]`, attr.name.en);
        attr.options.forEach((opt, j) => {
          fd.append(`variant_attributes[${i}][options][${j}][id]`, opt.id);
          fd.append(`variant_attributes[${i}][options][${j}][en]`, opt.en);
        });
      });

      // Variant prices
      type VPrice = { labels: { id: string; en: string }[]; price: number; stock: number; active: boolean; size_eu?: number; key?: string };
      let combos: LangText[][] = [[]];
      validVariants.forEach((v) => {
        const opts = v.options.filter((o) => (o.id || o.en).trim() !== "");
        const next: LangText[][] = [];
        combos.forEach((c) => opts.forEach((o) => next.push([...c, o])));
        combos = next;
      });

      const rightSideFromLabel = (s: string) => (s.includes(":") ? s.split(":").slice(1).join(":").trim() : s.trim());

      const pushVariantPrices = (items: VPrice[]) => {
        items.forEach((vp, i) => {
          // kirim labels (sesuai kode lama)
          vp.labels.forEach((label, j) => {
            fd.append(`variant_prices[${i}][labels][${j}][id]`, label.id);
            fd.append(`variant_prices[${i}][labels][${j}][en]`, label.en);
          });
          // sekaligus kirim KEY (kombinasi sisi kanan label) agar backend yang butuh key bisa terima
          const keyParts = vp.labels.map((l) => rightSideFromLabel(l.id || l.en || ""));
          const key = comboKeyPipe(keyParts.filter(Boolean));
          if (key) fd.append(`variant_prices[${i}][key]`, key);

          fd.append(`variant_prices[${i}][price]`, String(vp.price));
          fd.append(`variant_prices[${i}][stock]`, String(vp.stock));
          fd.append(`variant_prices[${i}][active]`, vp.active ? "1" : "0");
          if (vp.size_eu != null) fd.append(`variant_prices[${i}][size_eu]`, String(vp.size_eu));
        });
      };

      if (pricingMode === "per_variant" && validVariants.length > 0) {
        const items: VPrice[] = [];
        if (validVariants.length === 1) {
          combos.forEach((comb) => {
            const opt = comb[0];
            const key = optKey(opt);
            const priceValue = parseNumber(groupPrices[key]);
            if (priceValue != null) {
              const v0 = validVariants[0];
              const label = { id: `${v0.name.id || v0.name.en}: ${opt.id || opt.en}`, en: `${v0.name.en || v0.name.id}: ${opt.en || opt.id}` };
              const entry: VPrice = { labels: [label], price: priceValue, stock: 0, active: true };
              const numericSize = Number(opt.en || opt.id);
              if (!Number.isNaN(numericSize)) entry.size_eu = numericSize;
              items.push(entry);
            }
          });
        } else {
          combos.forEach((comb) => {
            const keys = comb.map(optKey);
            const priceValue = parseNumber(individualPrices[comboKeyDash(keys)]);
            if (priceValue != null) {
              const labels = comb.map((opt, idx) => {
                const v = validVariants[idx];
                return { id: `${v.name.id || v.name.en}: ${opt.id || opt.en}`, en: `${v.name.en || v.name.id}: ${opt.en || opt.id}` };
              });
              items.push({ labels, price: priceValue, stock: 0, active: true });
            }
          });
        }
        pushVariantPrices(items);
      } else if (pricingMode === "single" && rootPriceValue != null) {
        fd.append("price", String(rootPriceValue));
      }

      // Gallery (only new files)
      galleries.forEach((g, i) => {
        if (g.file) {
          fd.append(`gallery[${i}][image]`, g.file);
          if (g.title) fd.append(`gallery[${i}][title]`, g.title);
          if (g.alt) fd.append(`gallery[${i}][alt]`, g.alt);
          fd.append(`gallery[${i}][sort]`, String(i));
        }
      });

      // Related products
      const relatedProducts = [promoPick.p1?.value, promoPick.p2?.value, promoPick.p3?.value, promoPick.p4?.value]
        .map((v) => (v == null ? null : Number(v)))
        .filter((v): v is number => Number.isFinite(v));
      Array.from(new Set(relatedProducts)).slice(0, 4).forEach((id) => {
        fd.append("related_products[]", String(id));
      });

      // === Penting: gunakan POST + _method=PATCH ke proxy API ===
      await api.post(`/api/products/${productId}`, fd as any);

      setSuccessMessage("Produk berhasil diperbarui.");
      setTimeout(() => router.push("/products"), 800);
    } catch (err: any) {
      const response = err?.data || err?.response?.data;
      if (response?.errors) {
        const messages = Object.values(response.errors).flat().map((m: any) => String(m));
        setErrorMessage(messages[0] || response.message || "Gagal memperbarui produk.");
      } else {
        setErrorMessage(response?.message || err?.message || "Gagal memperbarui produk.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  /** ======= RENDER (layout tetap) ======= */
  return (
    <div className="min-h-full">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <span>Products</span>
          <span className="text-gray-300">›</span>
          <span className="text-gray-600">Edit</span>
        </nav>
      </div>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Edit Product</h1>
        <div className="flex items-center gap-2">
          <label htmlFor="language" className="text-sm font-medium text-gray-700">Language:</label>
          <select
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value as "id" | "en")}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
          >
            <option value="id">🇮🇩 Indonesia</option>
            <option value="en">🇬🇧 English</option>
          </select>
        </div>
      </div>

      {/* Main */}
      <div className="bg-gray-50 min-h-screen">
        <div className="px-6 py-6">
          {loading && <div className="mb-6 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">Memuat detail produk...</div>}
          {errorMessage && <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</div>}
          {successMessage && <div className="mb-6 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{successMessage}</div>}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Details */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Details</h2>

                {/* Name */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  {(["id", "en"] as const).map((langKey) => (
                    <div key={langKey} className={`${language !== langKey ? "hidden" : "block"}`}>
                      <input
                        type="text"
                        name={`name_${langKey}`}
                        value={(formData as any)[`name_${langKey}`] || ""}
                        onChange={(e) => setFormData((prev) => ({ ...prev, [`name_${langKey}`]: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                        placeholder={langKey === "id" ? "Nama produk (Indonesia)" : "Product name (English)"}
                      />
                    </div>
                  ))}
                </div>

                {/* Slug */}
                <div className="mb-6">
                  <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
                    Slug <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text" id="slug" name="slug" value={formData.slug} onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                    placeholder="product-slug"
                  />
                </div>

                {/* Featured */}
                <div className="mb-6">
                  <div className="flex items-center gap-3">
                    <ToggleSwitch checked={formData.featured} onChange={handleToggleFeatured} />
                    <label className="text-sm font-medium text-gray-700">Featured</label>
                  </div>
                </div>

                {/* Status */}
                <div className="mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ToggleSwitch checked={formData.status} onChange={handleToggleStatus} />
                      <label className="text-sm font-medium text-gray-700">Status</label>
                    </div>
                    <span
                      className={
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium " +
                        (formData.status
                          ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-200"
                          : "bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-300")
                      }
                    >
                      {formData.status ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  {(["id", "en"] as const).map((langKey) => (
                    <div key={langKey} className={`${language !== langKey ? "hidden" : "block"}`}>
                      <textarea
                        name={`description_${langKey}`}
                        value={(formData as any)[`description_${langKey}`] || ""}
                        onChange={(e) => setFormData((prev) => ({ ...prev, [`description_${langKey}`]: e.target.value }))}
                        rows={8}
                        className="w-full px-3 py-2 border border-gray-300 border-t-0 rounded-b-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black resize-none"
                        placeholder={langKey === "id" ? "Deskripsi produk (Indonesia)" : "Product description (English)"}
                      />
                    </div>
                  ))}
                </div>

                {/* Category */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <AsyncSelect
                    cacheOptions defaultOptions isClearable
                    loadOptions={loadCategoryOptions}
                    placeholder="Search and select category..."
                    value={categoryOption}
                    onChange={(selected: any) => {
                      const opt = selected as CategoryOption | null;
                      setCategoryOption(opt);
                      setFormData((prev) => ({
                        ...prev,
                        category: opt?.label || "",
                        category_id: (opt?.value as number | null) ?? null,
                      }));
                    }}
                    formatOptionLabel={(option: any) => (
                      <div className="flex items-center gap-2">
                        {option.image /* eslint-disable-next-line @next/next/no-img-element */ && (
                          <img src={option.image} alt={option.label} className="w-6 h-6 rounded object-cover" />
                        )}
                        <span className="text-black">{option.label}</span>
                      </div>
                    )}
                    styles={{
                      control: (base: any) => ({ ...base, borderRadius: "0.5rem", borderColor: "#d1d5db", padding: "2px" }),
                      singleValue: (base: any) => ({ ...base, color: "#000" }),
                      input: (base: any) => ({ ...base, color: "#000" }),
                      option: (base: any) => ({ ...base, color: "#000" }),
                      placeholder: (base: any) => ({ ...base, color: "#6b7280" }),
                      menuPortal: (base: any) => ({ ...base, zIndex: 50 }),
                    }}
                    menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                  />
                </div>

                {/* Base Price */}
                <div className="mb-6">
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                    Price (Rp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number" id="price" name="price" value={formData.price} onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                    placeholder="Product price" min={0}
                  />
                </div>

                {/* Heel Height */}
                <div className="mb-6">
                  <label htmlFor="heel_height_cm" className="block text-sm font-medium text-gray-700 mb-2">
                    Heel Height (cm)
                  </label>
                  <input
                    type="number" step="0.1" id="heel_height_cm" name="heel_height_cm"
                    value={(formData as any).heel_height_cm ?? ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                    placeholder="e.g. 12.5" min={0}
                  />
                </div>
              </div>

              {/* Cover */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Cover</h3>
                <div className="mb-4">
                  <label htmlFor="cover_file" className="block text-sm font-medium text-gray-700 mb-2">
                    Cover File
                  </label>
                  <input
                    id="cover_file" type="file" accept="image/*"
                    onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-gray-900 file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-gray-700 hover:file:bg-gray-200"
                  />
                  {(coverFile || formData.cover_url) && (
                    <div className="mt-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={
                          coverFile
                            ? URL.createObjectURL(coverFile)
                            : (formData.cover_url as string) ||
                              "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIGZpbGw9IiNGM0Y0RjYiLz48cGF0aCBkPSJNMjQgMzZDMzAuNjI3NCAzNiAzNiAzMC42Mjc0IDM2IDI0QzM2IDE3LjM3MjYgMzAuNjI3NCAxMiAyNCAxMkMxNy4zNzI2IDEyIDEyIDE3LjM3MjYgMTIgMjRDMTIgMzAuNjI3NiAxNy4zNzI2IDM2IDI0IDM2WiIgc3Ryb2tlPSIjOUNBM0FGIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNMjQgMjhDMjYuMjA5MSAyOCAyOCAyNi4yMDkxIDI4IDI0QzI4IDIxLjc5MDkgMjYuMjA5MSAyMCAyNCAyMEMyMS43OTA5IDIwIDIwIDIxLjc5MDkgMjAgMjRDMjAgMjYuMjA5MSAyMS43OTA5IDI4IDI0IDI4WiIgc3Ryb2tlPSIjOUNBM0FGIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4="
                        }
                        alt="Cover preview"
                        className="h-28 w-full max-w-xs rounded border object-cover"
                        onLoad={(e) => {
                          if (coverFile) URL.revokeObjectURL((e.target as HTMLImageElement).src);
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <ProductGallery
                galleries={galleries}
                onAddGallery={() =>
                  setGalleries((prev) => [...prev, { id: prev.length + 1, image: "", title: "", alt: "", fileName: "file.jpg" }])
                }
                onRemoveGallery={(id) => setGalleries((prev) => prev.filter((g) => g.id !== id))}
                onGalleryChange={(id, field, value) =>
                  setGalleries((prev) => prev.map((g) => (g.id === id ? { ...g, [field]: value } : g)))
                }
              />

              {/* Variants builder + pricing */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Variant</h2>
                </div>

                {/* 3 sections variant */}
                <div className="space-y-4 mb-8">
                  {variants.map((variant, variantIndex) => (
                    <div key={variant.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-700">Variant {variantIndex + 1}</span>
                          <input
                            type="text"
                            value={language === "id" ? variant.name.id || "" : variant.name.en || ""}
                            onChange={(e) => handleVariantNameChange(variant.id, e.target.value, language)}
                            className="px-3 py-1 border border-gray-300 rounded text-sm text-black bg-white"
                            placeholder={language === "id" ? "Nama varian (Indonesia)" : "Variant name (English)"}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Option</label>
                        <div className="flex flex-wrap gap-2">
                          {variant.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center gap-1">
                              <input
                                type="text"
                                value={language === "id" ? option.id || "" : option.en || ""}
                                onChange={(e) => handleOptionChange(variant.id, optionIndex, e.target.value, language)}
                                className="px-3 py-1 border border-gray-300 rounded text-sm text-black bg-white w-24"
                                placeholder={optionIndex === variant.options.length - 1 ? (language === "id" ? "Isi di sini" : "Input here") : "Option"}
                              />
                              {variant.options.length > 1 && (option.id || option.en).trim() !== "" && (
                                <DeleteIcon
                                  label=""
                                  onClick={() => handleRemoveOption(variant.id, optionIndex)}
                                  className="text-red-500 hover:text-red-700 w-4 h-4"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pricing */}
                {variants.some((v) => v.options.some((o) => (o.id || o.en).trim() !== "")) && (
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Variant</h3>

                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Set Pricing</h4>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3">
                          <input
                            type="radio" name="pricingType" value="single"
                            checked={pricingType === "single"}
                            onChange={(e) => setPricingType(e.target.value as "single" | "per_variant")}
                            className="text-blue-600"
                          />
                          <span className="text-sm text-gray-700">Single Price for All Variant</span>
                        </label>
                        <label className="flex items-center gap-3">
                          <input
                            type="radio" name="pricingType" value="per_variant"
                            checked={pricingType === "per_variant"}
                            onChange={(e) => setPricingType(e.target.value as "single" | "per_variant")}
                            className="text-blue-600"
                          />
                          <span className="text-sm text-gray-700">Set Individual Prices</span>
                        </label>
                      </div>
                    </div>

                    {/* 1 dimensi */}
                    {pricingType === "per_variant" &&
                      (variants.filter((v) => v.options.some((o) => (o.id || o.en).trim() !== "")).length === 1) && (
                        <div className="space-y-4">
                          {Object.keys(groupedCombinations()).map((firstOption) => (
                            <div key={firstOption} className="border border-gray-200 rounded-lg">
                              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                                <h5 className="font-medium text-gray-900">{firstOption}</h5>
                                <button
                                  type="button" onClick={() => toggleGroup(firstOption)}
                                  className="text-gray-400 hover:text-gray-600" aria-label={`Toggle ${firstOption}`}
                                >
                                  <svg className={`w-4 h-4 transition-transform ${isGroupOpen(firstOption) ? "" : "rotate-180"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>
                              </div>
                              {isGroupOpen(firstOption) && (
                                <div className="p-4">
                                  <div className="flex items-center gap-3 text-sm">
                                    <span className="text-gray-600">Rp</span>
                                    <input
                                      type="number" value={groupPrices[firstOption] ?? ""} min={0}
                                      onChange={(e) => setGroupPrices((prev) => ({ ...prev, [firstOption]: e.target.value }))}
                                      className="px-2 py-1 border border-gray-300 rounded text-sm text-black w-32"
                                      placeholder="0"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                    {/* >=2 dimensi */}
                    {pricingType === "per_variant" &&
                      (variants.filter((v) => v.options.some((o) => (o.id || o.en).trim() !== "")).length >= 2) && (
                        <div className="space-y-4">
                          {Object.entries(groupedCombinations()).map(([firstOption, combinations]) => (
                            <div key={firstOption} className="border border-gray-200 rounded-lg">
                              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                                <h5 className="font-medium text-gray-900">{firstOption}</h5>
                                <button
                                  type="button" onClick={() => toggleGroup(firstOption)}
                                  className="text-gray-400 hover:text-gray-600" aria-label={`Toggle ${firstOption}`}
                                >
                                  <svg className={`w-4 h-4 transition-transform ${isGroupOpen(firstOption) ? "" : "rotate-180"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>
                              </div>

                              {isGroupOpen(firstOption) && (
                                <div className="p-4">
                                  {Array.from(new Set(combinations.map((c) => c[1])))
                                    .filter(Boolean)
                                    .map((secondOption) => (
                                      <div key={String(secondOption)} className="mb-4">
                                        <div className="bg-gray-100 px-3 py-2 border border-gray-200 rounded flex items-center justify-between">
                                          <h6 className="font-medium text-gray-800">{String(secondOption)}</h6>
                                          <button
                                            type="button" onClick={() => toggleSub(firstOption, String(secondOption))}
                                            className="text-gray-400 hover:text-gray-600" aria-label={`Toggle ${firstOption} - ${String(secondOption)}`}
                                          >
                                            <svg className={`w-4 h-4 transition-transform ${isSubOpen(firstOption, String(secondOption)) ? "" : "rotate-180"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                          </button>
                                        </div>

                                        {isSubOpen(firstOption, String(secondOption)) && (
                                          <div className="mt-2 space-y-2">
                                            {combinations
                                              .filter((c) => c[1] === secondOption)
                                              .map((combination, idx) => {
                                                const key = comboKeyDash(combination);
                                                const thirdOption = combination[2];
                                                return (
                                                  <div key={`${key}-${idx}`} className="flex items-center gap-3 text-sm">
                                                    <span className="w-24 text-gray-600">{thirdOption || "Price"}</span>
                                                    <span className="text-gray-500">Rp</span>
                                                    <input
                                                      type="number" value={individualPrices[key] || ""} min={0}
                                                      onChange={(e) => setIndividualPrices((p) => ({ ...p, [key]: e.target.value }))}
                                                      className="px-2 py-1 border border-gray-300 rounded text-sm text-black w-32"
                                                      placeholder="0"
                                                    />
                                                  </div>
                                                );
                                              })}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>

            {/* Right - SEO + Promotion */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">SEO</h3>
                <div className="mb-6">
                  <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  <input
                    type="text" id="tags" name="tags" value={formData.tags} onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                    placeholder="Product tags"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Keyword</label>
                  {(["id", "en"] as const).map((langKey) => (
                    <div key={langKey} className={`${language !== langKey ? "hidden" : "block"}`}>
                      <input
                        type="text" name={`keyword_${langKey}`} value={(formData as any)[`keyword_${langKey}`] || ""}
                        onChange={(e) => setFormData((prev) => ({ ...prev, [`keyword_${langKey}`]: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                        placeholder={langKey === "id" ? "Kata kunci SEO (Indonesia)" : "SEO keywords (English)"}
                      />
                    </div>
                  ))}
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  {(["id", "en"] as const).map((langKey) => (
                    <div key={langKey} className={`${language !== langKey ? "hidden" : "block"}`}>
                      <textarea
                        name={`seoDescription_${langKey}`} value={(formData as any)[`seoDescription_${langKey}`] || ""}
                        onChange={(e) => setFormData((prev) => ({ ...prev, [`seoDescription_${langKey}`]: e.target.value }))}
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black resize-none"
                        placeholder={langKey === "id" ? "Deskripsi SEO (Indonesia)" : "SEO description (English)"}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Promotion Product</h3>
                <PromotionProductPickers value={promoPick} onChange={setPromoPick} loadOptions={loadPromotionOptions} />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex items-center gap-4">
            <UpdateButton onClick={handleUpdate} disabled={submitting}>
              {submitting ? "Menyimpan..." : "Update"}
            </UpdateButton>
            <CancelButton onClick={() => router.push("/products")} disabled={submitting} />
          </div>
        </div>
      </div>
    </div>
  );
}