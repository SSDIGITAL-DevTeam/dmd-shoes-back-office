// app/(admin)/products/create/page.tsx
"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/fetching";
import { CreateButton, CancelButton } from "@/components/ui/ActionButton";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { DeleteButton as DeleteIcon } from "@/components/ui/DeleteIcon";
import AsyncSelect from "react-select/async";
import ProductGallery from "./_components/ProductGallery";

/** ===== Utils: kunci kanonik bilingual (stabil) ===== */
type Bi = { id: string; en: string };
const norm = (s?: string) => (s ?? "").trim().toLowerCase();
const keyOf = (v: Bi) => `${norm(v.id)}|${norm(v.en)}`;
const comboKey = (arr: Bi[]) => arr.map(keyOf).join("||");
const display = (v: Bi, lang: "id" | "en") =>
  lang === "id" ? v.id || v.en : v.en || v.id;
const toSizeEU = (v: Bi) => {
  const raw = (v.en || v.id || "").trim();
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
};

interface Gallery {
  id: number;
  image: string;
  fileName: string;
  title: string;
  alt: string;
  file?: File | null;
  uploading?: boolean;
}
interface LangText {
  id: string;
  en: string;
}
interface Variant {
  id: number;
  name: LangText;
  options: LangText[];
}

export default function CreateProductPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [language, setLanguage] = useState<"id" | "en">("en");

  // --- FORM STATE ---
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    category: "",
    category_id: null as number | null,
    price: "",
    tags: "",
    keyword: "",
    seoDescription: "",
    featured: false,
    status: true,
    heel_height_cm: "",
    cover_url: "",
  });

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [pricingType, setPricingType] = useState<"single" | "per_variant">(
    "single"
  );

  // harga 1 dimensi (pakai keyOf(option))
  const [groupPrices, setGroupPrices] = useState<Record<string, string>>({});
  // harga ≥2 dimensi (pakai comboKey(labels))
  const [individualPrices, setIndividualPrices] = useState<
    Record<string, string>
  >({});
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [openSubGroups, setOpenSubGroups] = useState<
    Record<string, Record<string, boolean>>
  >({});

  const isGroupOpen = (k: string) => openGroups[k] !== false;
  const toggleGroup = (k: string) =>
    setOpenGroups((p) => ({ ...p, [k]: !isGroupOpen(k) }));
  const isSubOpen = (a: string, b: string) => openSubGroups[a]?.[b] ?? true;
  const toggleSub = (a: string, b: string) =>
    setOpenSubGroups((p) => ({
      ...p,
      [a]: { ...(p[a] || {}), [b]: !isSubOpen(a, b) },
    }));

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleToggleFeatured = () =>
    setFormData((p) => ({ ...p, featured: !p.featured }));
  const handleToggleStatus = () =>
    setFormData((p) => ({ ...p, status: !p.status }));
  const parseNumber = (v: any) =>
    v === null || v === undefined || v === ""
      ? null
      : Number.isFinite(Number(v))
      ? Number(v)
      : null;
  const handleCancel = () => router.push("/products");

  // Gallery
  const handleGalleryChange = (id: number, field: string, value: string) =>
    setGalleries((prev) =>
      prev.map((g) => (g.id === id ? { ...g, [field]: value } : g))
    );
  const handleRemoveGallery = (id: number) =>
    setGalleries((p) => p.filter((g) => g.id !== id));
  const handleAddGallery = () =>
    setGalleries((p) => [
      ...p,
      { id: p.length + 1, image: "", title: "", alt: "", fileName: "file.jpg" },
    ]);

  // Category & promo
  const loadCategoryOptions = useCallback(async (q: string) => {
    try {
      const res = await api.get(`/category`, {
        params: { status: "active", perPage: 100, search: q, parent: "top" },
      });
      const list = (res as any)?.data?.data || (res as any)?.data || [];
      return list.map((c: any) => ({
        value: c.id,
        label:
          (c.name && (c.name.id || c.name.en)) || c.slug || `Category ${c.id}`,
        image: c.cover_url || c.cover || null,
      }));
    } catch {
      return [];
    }
  }, []);

  const [promotionProduct, setPromotionProduct] = useState<{
    value: number;
    label: string;
  } | null>(null);
  const loadPromotionOptions = useCallback(async (q: string) => {
    try {
      const res = await api.get(`/products`, {
        params: { status: "publish", perPage: 100, search: q },
      });
      const list = (res as any)?.data?.data || (res as any)?.data || [];
      return list.map((p: any) => ({
        value: p.id,
        label:
          (p.name && (p.name.id || p.name.en)) || p.slug || `Product ${p.id}`,
        image: p.cover_url || p.cover || null,
      }));
    } catch {
      return [];
    }
  }, []);

  // Variant helpers
  const handleAddVariant = () => {
    if (variants.length >= 3) return;
    setVariants((p) => [
      ...p,
      {
        id: p.length + 1,
        name: { id: "", en: "" },
        options: [{ id: "", en: "" }],
      },
    ]);
  };
  const handleVariantNameChange = (
    id: number,
    value: string,
    lang: "id" | "en"
  ) =>
    setVariants((prev) =>
      prev.map((v) =>
        v.id === id ? { ...v, name: { ...v.name, [lang]: value } } : v
      )
    );
  const handleOptionChange = (
    variantId: number,
    optionIndex: number,
    value: string,
    lang: "id" | "en"
  ) =>
    setVariants((prev) =>
      prev.map((variant) => {
        if (variant.id !== variantId) return variant;
        const newOptions = variant.options.map((o, i) =>
          i === optionIndex ? { ...o, [lang]: value } : o
        );
        const hasEmpty = newOptions.some((o) => (o.id || o.en).trim() === "");
        return {
          ...variant,
          options: hasEmpty ? newOptions : [...newOptions, { id: "", en: "" }],
        };
      })
    );
  const handleRemoveOption = (variantId: number, optionIndex: number) =>
    setVariants((prev) =>
      prev.map((variant) => {
        if (variant.id !== variantId) return variant;
        const newOptions = variant.options.filter((_, i) => i !== optionIndex);
        if (!newOptions.some((o) => (o.id || o.en).trim() === ""))
          newOptions.push({ id: "", en: "" });
        return { ...variant, options: newOptions };
      })
    );
  const handleRemoveVariant = (id: number) =>
    setVariants((prev) => prev.filter((v) => v.id !== id));
  const handleIndividualPriceChange = (k: string, val: string) =>
    setIndividualPrices((p) => ({ ...p, [k]: val }));

  // Valid variants
  const getValidVariants = useMemo(
    () => () =>
      variants.filter((v) =>
        v.options.some((o) => (o.id || o.en).trim() !== "")
      ),
    [variants]
  );
  const validVariantCount = getValidVariants().length;

  // Reset group prices saat dimensi ≠ 1
  useEffect(() => {
    if (validVariantCount !== 1 && Object.keys(groupPrices).length)
      setGroupPrices({});
  }, [validVariantCount]); // eslint-disable-line

  // Kombinasi bilingual: Bi[][]
  const generateVariantCombinationsBi = useCallback((): Bi[][] => {
    const valid = getValidVariants();
    if (!valid.length) return [];
    let combos: Bi[][] = [[]];
    valid.forEach((variant) => {
      const opts: Bi[] = variant.options
        .filter((o) => (o.id || o.en).trim() !== "")
        .map((o) => ({ id: o.id || o.en, en: o.en || o.id }));
      const next: Bi[][] = [];
      combos.forEach((c) => opts.forEach((o) => next.push([...c, o])));
      combos = next;
    });
    return combos;
  }, [getValidVariants]);

  // Grouped (pakai key kanonik tapi label sesuai bahasa UI)
  const groupedCombinations = () => {
    const groups: Record<
      string,
      {
        firstKey: string;
        firstShown: string;
        combos: { labels: Bi[]; shown: string[]; comboKey: string }[];
      }
    > = {};
    generateVariantCombinationsBi().forEach((labels) => {
      const first = labels[0];
      const fk = keyOf(first);
      if (!groups[fk])
        groups[fk] = {
          firstKey: fk,
          firstShown: display(first, language),
          combos: [],
        };
      groups[fk].combos.push({
        labels,
        shown: labels.map((o) => display(o, language)),
        comboKey: comboKey(labels),
      });
    });
    return groups;
  };

  // ==== POST ====
  const handleCreate = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const slug = (formData.slug || "").trim();
    const categoryId = formData.category_id;

    const name_id =
      (formData as any).name_id?.trim() ||
      (formData as any).name_id ||
      (formData as any).name ||
      "";
    const name_en =
      (formData as any).name_en?.trim() || (formData as any).name_en || "";
    const description_id =
      (formData as any).description_id?.trim() ||
      (formData as any).description_id ||
      (formData as any).description ||
      "";
    const description_en =
      (formData as any).description_en?.trim() ||
      (formData as any).description_en ||
      "";

    // Tentukan pricing mode TEPAT SAAT SUBMIT dari radio
    const pricingMode: "single" | "per_variant" =
      pricingType === "single" ? "single" : "per_variant";

    const errs: string[] = [];
    if (!name_en) errs.push("Nama produk (EN) wajib diisi.");
    if (!slug) errs.push("Slug wajib diisi.");
    if (!description_en) errs.push("Deskripsi (EN) wajib diisi.");
    if (!categoryId) errs.push("Kategori wajib dipilih.");

    const rootPriceValue = parseNumber(formData.price);
    const validVariants = getValidVariants();
    const combosBi = generateVariantCombinationsBi();

    if (pricingMode === "single" && rootPriceValue == null)
      errs.push("Harga produk wajib diisi.");
    if (
      pricingMode === "per_variant" &&
      validVariants.length > 0 &&
      combosBi.length === 0
    )
      errs.push("Lengkapi opsi varian.");

    if (errs.length) {
      setErrorMessage(errs[0]);
      return;
    }
    setSubmitting(true);

    // builder helpers
    const buildAttributes = () =>
      validVariants.map((variant, index) => ({
        name: {
          id: variant.name.id || variant.name.en || `Variant ${index + 1}`,
          en: variant.name.en || variant.name.id || `Variant ${index + 1}`,
        },
        options: variant.options
          .filter((o) => (o.id || o.en).trim() !== "")
          .map((o) => ({ id: o.id || o.en, en: o.en || o.id })),
      }));

    const buildVariantPrices = () => {
      type V = {
        labels: { id: string; en: string }[];
        price: number;
        stock: number;
        active: boolean;
        size_eu?: number;
      };
      const out: V[] = [];
      if (!validVariants.length) return out;

      if (validVariantCount === 1) {
        combosBi.forEach((labels) => {
          const opt = labels[0];
          const k = keyOf(opt);
          const pv = groupPrices[k];
          const price = pv === "" || pv == null ? null : Number(pv);
          if (price != null && Number.isFinite(price)) {
            const v0 = validVariants[0];
            const label = {
              id: `${v0.name.id || v0.name.en}: ${opt.id || opt.en}`,
              en: `${v0.name.en || v0.name.id}: ${opt.en || opt.id}`,
            };
            const row: V = { labels: [label], price, stock: 0, active: true };
            const size = toSizeEU(opt);
            if (size !== undefined) row.size_eu = size;
            out.push(row);
          }
        });
      } else {
        combosBi.forEach((labels) => {
          const k = comboKey(labels);
          const pv = individualPrices[k];
          const price = pv === "" || pv == null ? null : Number(pv);
          if (price != null && Number.isFinite(price)) {
            const labelsBi = labels.map((opt, idx) => ({
              id: `${
                validVariants[idx].name.id || validVariants[idx].name.en
              }: ${opt.id || opt.en}`,
              en: `${
                validVariants[idx].name.en || validVariants[idx].name.id
              }: ${opt.en || opt.id}`,
            }));
            const row: V = { labels: labelsBi, price, stock: 0, active: true };
            const size = labels.map(toSizeEU).find((n) => n !== undefined);
            if (size !== undefined) row.size_eu = size;
            out.push(row);
          }
        });
      }
      return out;
    };

    try {
      const seoTags = formData.tags
        .split(/[,\n]/)
        .map((t) => t.trim())
        .filter(Boolean);
      const keyword_id = (formData as any).keyword_id?.trim() || "";
      const keyword_en = (formData as any).keyword_en?.trim() || "";
      const seoDesc_id = (formData as any).seoDescription_id?.trim() || "";
      const seoDesc_en = (formData as any).seoDescription_en?.trim() || "";

      // cek apakah ada file
      const hasGalleryFiles = galleries.some((g) => g.file);
      const hasCoverFile = !!coverFile;
      const hasFiles = hasGalleryFiles || hasCoverFile;

      if (!hasFiles) {
        // ===== JSON PATH =====
        const payload: any = {
          status: !!formData.status,
          featured: !!formData.featured,
          category_id: Number(categoryId),
          pricing_mode: pricingMode, // <<-- single / per_variant
          name: {
            id: (formData as any).name_id || "",
            en: (formData as any).name_en || "",
          },
          description: {
            id: (formData as any).description_id || "",
            en: (formData as any).description_en || "",
          },
          slug,
          heel_height_cm: Number(formData.heel_height_cm || 0),
          seo_tags: seoTags,
          seo_keyword: { id: keyword_id, en: keyword_en },
          seo_description: { id: seoDesc_id, en: seoDesc_en },
        };

        if (pricingMode === "single" && rootPriceValue != null) {
          payload.price = rootPriceValue;
        }

        const attributes = buildAttributes();
        if (attributes.length) payload.attributes = attributes;

        if (pricingMode === "per_variant" && attributes.length) {
          const vps = buildVariantPrices();
          if (vps.length) payload.variant_prices = vps;
        }

        const res = await api.post(`/products`, JSON.stringify(payload), {
          headers: { "Content-Type": "application/json" },
        });
        setSuccessMessage(res.data?.message || "Produk berhasil dibuat.");
        setTimeout(() => router.push("/products"), 800);
        return;
      }

      // ===== MULTIPART PATH =====
      const fd = new FormData();
      fd.append("status", formData.status ? "1" : "0");
      fd.append("featured", formData.featured ? "1" : "0");
      fd.append("category_id", String(Number(categoryId)));
      fd.append("pricing_mode", pricingMode); // "single" | "per_variant"

      fd.append("name[id]", (formData as any).name_id || "");
      fd.append("name[en]", (formData as any).name_en || "");
      fd.append("description[id]", (formData as any).description_id || "");
      fd.append("description[en]", (formData as any).description_en || "");
      fd.append("slug", slug);
      fd.append("heel_height_cm", String(Number(formData.heel_height_cm || 0)));

      seoTags.forEach((tag, i) => fd.append(`seo_tags[${i}]`, tag));
      if (keyword_id) fd.append("seo_keyword[id]", keyword_id);
      if (keyword_en) fd.append("seo_keyword[en]", keyword_en);
      if (seoDesc_id) fd.append("seo_description[id]", seoDesc_id);
      if (seoDesc_en) fd.append("seo_description[en]", seoDesc_en);

      if (coverFile) fd.append("cover", coverFile);

      // HANYA kirim base price ketika mode single
      if (pricingMode === "single" && rootPriceValue != null) {
        fd.append("price", String(rootPriceValue));
      }

      // attributes
      const attributes = buildAttributes();
      if (attributes.length) {
        attributes.forEach((attr, i) => {
          fd.append(`attributes[${i}][name][id]`, attr.name.id);
          fd.append(`attributes[${i}][name][en]`, attr.name.en);
          attr.options.forEach((opt, j) => {
            fd.append(`attributes[${i}][options][${j}][id]`, opt.id);
            fd.append(`attributes[${i}][options][${j}][en]`, opt.en);
          });
        });
      }

      // variant_prices untuk per_variant
      if (pricingMode === "per_variant" && attributes.length) {
        const vps = buildVariantPrices() || [];
        vps.forEach((vp, i) => {
          vp.labels.forEach((l, j) => {
            fd.append(`variant_prices[${i}][labels][${j}][id]`, l.id);
            fd.append(`variant_prices[${i}][labels][${j}][en]`, l.en);
          });
          fd.append(`variant_prices[${i}][price]`, String(vp.price));
          fd.append(`variant_prices[${i}][stock]`, String(vp.stock));
          fd.append(`variant_prices[${i}][active]`, vp.active ? "1" : "0");
          if (vp.size_eu != null) {
            fd.append(`variant_prices[${i}][size_eu]`, String(vp.size_eu));
          }
        });
      }

      // galleries (tidak diubah)
      galleries.forEach((g, i) => {
        if (g.file) fd.append(`gallery[${i}][image]`, g.file);
        if (g.title) fd.append(`gallery[${i}][title]`, g.title);
        if (g.alt) fd.append(`gallery[${i}][alt]`, g.alt);
        fd.append(`gallery[${i}][sort]`, String(i));
      });

      // ===== DEBUG: log isi FormData sebelum post
      try {
        const debugEntries: any[] = [];
        (fd as any).forEach((v: any, k: string) => {
          debugEntries.push([
            k,
            v instanceof File ? `(File:${v.name}, ${v.size} bytes)` : v,
          ]);
        });
        console.log(
          "%c[CREATE PRODUCT] FormData to backend",
          "color:#2563EB;font-weight:bold",
          Object.fromEntries(debugEntries)
        );
      } catch (e) {
        console.log(
          "[CREATE PRODUCT] (debug) failed to read FormData entries",
          e
        );
      }

      // POST
      const res = await api.post(`/products`, fd as any);
      setSuccessMessage(res.data?.message || "Produk berhasil dibuat.");
      setTimeout(() => router.push("/products"), 800);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Gagal membuat produk.";
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-full">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <span>Products</span>
          <span className="text-gray-300">›</span>
          <span className="text-gray-600">Create</span>
        </nav>
      </div>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">New Product</h1>
        <div className="flex items-center gap-2">
          <label
            htmlFor="language"
            className="text-sm font-medium text-gray-700"
          >
            Language:
          </label>
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
          {errorMessage && (
            <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className="mb-6 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              {successMessage}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left */}
            <div className="lg:col-span-2 space-y-6">
              {/* Details */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">
                  Details
                </h2>

                {/* Name */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  {(["id", "en"] as const).map((langKey) => (
                    <div
                      key={langKey}
                      className={language !== langKey ? "hidden" : "block"}
                    >
                      <input
                        type="text"
                        name={`name_${langKey}`}
                        value={(formData as any)[`name_${langKey}`] || ""}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            [`name_${langKey}`]: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                        placeholder={
                          langKey === "id"
                            ? "Nama produk (Indonesia)"
                            : "Product name (English)"
                        }
                      />
                    </div>
                  ))}
                </div>

                {/* Slug */}
                <div className="mb-6">
                  <label
                    htmlFor="slug"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Slug <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="slug"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                    placeholder="product-slug"
                  />
                </div>

                {/* Featured & Status */}
                <div className="mb-6">
                  <div className="flex items-center gap-3">
                    <ToggleSwitch
                      checked={formData.featured}
                      onChange={handleToggleFeatured}
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Featured
                    </label>
                  </div>
                </div>
                <div className="mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ToggleSwitch
                        checked={formData.status}
                        onChange={handleToggleStatus}
                      />
                      <label className="text-sm font-medium text-gray-700">
                        Status
                      </label>
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
                    <div
                      key={langKey}
                      className={language !== langKey ? "hidden" : "block"}
                    >
                      <textarea
                        name={`description_${langKey}`}
                        value={
                          (formData as any)[`description_${langKey}`] || ""
                        }
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            [`description_${langKey}`]: e.target.value,
                          }))
                        }
                        rows={8}
                        className="w-full px-3 py-2 border border-gray-300 border-t-0 rounded-b-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black resize-none"
                        placeholder={
                          langKey === "id"
                            ? "Deskripsi produk (Indonesia)"
                            : "Product description (English)"
                        }
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
                    cacheOptions
                    defaultOptions
                    isClearable
                    loadOptions={loadCategoryOptions}
                    placeholder="Search and select category..."
                    onChange={(selected: any) =>
                      setFormData((p) => ({
                        ...p,
                        category: selected?.label || "",
                        category_id: selected?.value ?? null,
                      }))
                    }
                    formatOptionLabel={(option: any) => (
                      <div className="flex items-center gap-2">
                        {option.image && (
                          <img
                            src={option.image}
                            alt={option.label}
                            className="w-6 h-6 rounded object-cover"
                          />
                        )}
                        <span className="text-gray-700">{option.label}</span>
                      </div>
                    )}
                    styles={{
                      control: (base: any) => ({
                        ...base,
                        borderRadius: "0.5rem",
                        borderColor: "#d1d5db",
                        padding: "2px",
                      }),
                    }}
                    value={
                      formData.category_id
                        ? {
                            value: formData.category_id,
                            label: formData.category,
                          }
                        : null
                    }
                  />
                </div>

                {/* Base Price */}
                <div className="mb-6">
                  <label
                    htmlFor="price"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Price (Rp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                    placeholder="Product price"
                    min={0}
                  />
                </div>

                {/* Heel Height */}
                <div className="mb-6">
                  <label
                    htmlFor="heel_height_cm"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Heel Height (cm)
                  </label>
                  <input
                    type="number"
                    id="heel_height_cm"
                    name="heel_height_cm"
                    value={(formData as any).heel_height_cm ?? ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                    placeholder="e.g. 12"
                    min={0}
                  />
                </div>
              </div>

              {/* Cover */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Cover
                </h3>
                <div className="mb-4">
                  <label
                    htmlFor="cover_file"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Cover File
                  </label>
                  <input
                    id="cover_file"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-gray-900 file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-gray-700 hover:file:bg-gray-200"
                  />
                  {(coverFile || formData.cover_url) && (
                    <div className="mt-3">
                      <img
                        src={
                          coverFile
                            ? URL.createObjectURL(coverFile)
                            : formData.cover_url ||
                              "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIGZpbGw9IiNGM0Y0RjYiLz48cGF0aCBkPSJNMjQgMzZDMzAuNjI3NCAzNiAzNiAzMC42Mjc0IDM2IDI0QzM2IDE3LjM3MjYgMzAuNjI3NCAxMiAyNCAxMkMxNy4zNzI2IDEyIDEyIDE3LjM3MjYgMTIgMjRDMTIgMzAuNjI3NiAxNy4zNzI2IDM2IDI0IDM2WiIgc3Ryb2tlPSIjOUNBM0FGIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNMjQgMjhDMjYuMjA5MSAyOCAyOCAyNi4yMDkxIDI4IDI0QzI4IDIxLjc5MDkgMjYuMjA5MSAyMCAyNCAyMEMyMS43OTA5IDIwIDIwIDIxLjc5MDkgMjAgMjRDMjAgMjYuMjA5MSAyMS43OTA5IDI4IDI0IDI4WiIgc3Ryb2tlPSIjOUNBM0FGIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4="
                        }
                        alt="Cover preview"
                        className="h-28 w-full max-w-xs rounded border object-cover"
                        onLoad={(e) => {
                          if (coverFile)
                            URL.revokeObjectURL(
                              (e.target as HTMLImageElement).src
                            );
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Gallery */}
              <ProductGallery
                galleries={galleries}
                onAddGallery={handleAddGallery}
                onRemoveGallery={handleRemoveGallery}
                onGalleryChange={handleGalleryChange}
              />

              {/* Variants + Pricing */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Variant
                  </h2>
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    disabled={variants.length >= 3}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      variants.length >= 3
                        ? "text-gray-400 bg-gray-100 border border-gray-200 cursor-not-allowed"
                        : "text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100"
                    }`}
                  >
                    Add Variant {variants.length >= 3 ? "(Max 3)" : ""}
                  </button>
                </div>

                {/* Builder */}
                <div className="space-y-4 mb-8">
                  {variants.map((variant, idx) => (
                    <div
                      key={variant.id}
                      className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-700">
                            Variant {idx + 1}
                          </span>
                          <input
                            type="text"
                            value={
                              language === "id"
                                ? variant.name.id || ""
                                : variant.name.en || ""
                            }
                            onChange={(e) =>
                              handleVariantNameChange(
                                variant.id,
                                e.target.value,
                                language
                              )
                            }
                            className="px-3 py-1 border border-gray-300 rounded text-sm text-black bg-white"
                            placeholder={
                              language === "id"
                                ? "Nama varian (Indonesia)"
                                : "Variant name (English)"
                            }
                          />
                        </div>
                        <DeleteIcon
                          label=""
                          onClick={() => handleRemoveVariant(variant.id)}
                          className="text-gray-400 hover:text-red-600 text-lg"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Option
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {variant.options.map((option, oi) => (
                            <div key={oi} className="flex items-center gap-1">
                              <input
                                type="text"
                                value={
                                  language === "id"
                                    ? option.id || ""
                                    : option.en || ""
                                }
                                onChange={(e) =>
                                  handleOptionChange(
                                    variant.id,
                                    oi,
                                    e.target.value,
                                    language
                                  )
                                }
                                className="px-3 py-1 border border-gray-300 rounded text-sm text-black bg-white w-24"
                                placeholder={
                                  oi === variant.options.length - 1
                                    ? language === "id"
                                      ? "Isi di sini"
                                      : "Input here"
                                    : "Option"
                                }
                              />
                              {variant.options.length > 1 &&
                                (option.id || option.en).trim() !== "" && (
                                  <DeleteIcon
                                    label=""
                                    onClick={() =>
                                      handleRemoveOption(variant.id, oi)
                                    }
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
                {variants.some((v) =>
                  v.options.some((o) => (o.id || o.en).trim() !== "")
                ) && (
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Product Variant
                    </h3>

                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        Set Pricing
                      </h4>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="pricingType"
                            value="single"
                            checked={pricingType === "single"}
                            onChange={(e) =>
                              setPricingType(
                                e.target.value as "single" | "per_variant"
                              )
                            }
                            className="text-blue-600"
                          />
                          <span className="text-sm text-gray-700">
                            Single Price for All Variant
                          </span>
                        </label>
                        <label className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="pricingType"
                            value="per_variant"
                            checked={pricingType === "per_variant"}
                            onChange={(e) =>
                              setPricingType(
                                e.target.value as "single" | "per_variant"
                              )
                            }
                            className="text-blue-600"
                          />
                          <span className="text-sm text-gray-700">
                            Set Individual Prices
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* 1D */}
                    {pricingType === "per_variant" &&
                      validVariantCount === 1 && (
                        <div className="space-y-4">
                          {Object.values(groupedCombinations()).map((g) => (
                            <div
                              key={g.firstKey}
                              className="border border-gray-200 rounded-lg"
                            >
                              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                                <h5 className="font-medium text-gray-900">
                                  {g.firstShown}
                                </h5>
                                <button
                                  type="button"
                                  onClick={() => toggleGroup(g.firstKey)}
                                  className="text-gray-400 hover:text-gray-600"
                                  aria-label={`Toggle ${g.firstShown}`}
                                >
                                  <svg
                                    className={`w-4 h-4 transition-transform ${
                                      isGroupOpen(g.firstKey)
                                        ? ""
                                        : "rotate-180"
                                    }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 9l-7 7-7-7"
                                    />
                                  </svg>
                                </button>
                              </div>
                              {isGroupOpen(g.firstKey) && (
                                <div className="p-4">
                                  <div className="flex items-center gap-3 text-sm">
                                    <span className="text-gray-600">Rp</span>
                                    <input
                                      type="number"
                                      value={groupPrices[g.firstKey] ?? ""}
                                      onChange={(e) =>
                                        setGroupPrices((p) => ({
                                          ...p,
                                          [g.firstKey]: e.target.value,
                                        }))
                                      }
                                      className="px-2 py-1 border border-gray-300 rounded text-sm text-black w-32"
                                      placeholder="0"
                                      min={0}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                    {/* ≥2D */}
                    {pricingType === "per_variant" &&
                      validVariantCount >= 2 && (
                        <div className="space-y-4">
                          {Object.values(groupedCombinations()).map((g) => {
                            const secondMap: Record<
                              string,
                              {
                                secondShown: string;
                                items: {
                                  labels: Bi[];
                                  shown: string[];
                                  key: string;
                                }[];
                              }
                            > = {};
                            g.combos.forEach((c) => {
                              const secondShown = c.shown[1] ?? "Price";
                              const k = c.comboKey;
                              if (!secondMap[secondShown])
                                secondMap[secondShown] = {
                                  secondShown,
                                  items: [],
                                };
                              secondMap[secondShown].items.push({
                                labels: c.labels,
                                shown: c.shown,
                                key: k,
                              });
                            });
                            return (
                              <div
                                key={g.firstKey}
                                className="border border-gray-200 rounded-lg"
                              >
                                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                                  <h5 className="font-medium text-gray-900">
                                    {g.firstShown}
                                  </h5>
                                  <button
                                    type="button"
                                    onClick={() => toggleGroup(g.firstKey)}
                                    className="text-gray-400 hover:text-gray-600"
                                    aria-label={`Toggle ${g.firstShown}`}
                                  >
                                    <svg
                                      className={`w-4 h-4 transition-transform ${
                                        isGroupOpen(g.firstKey)
                                          ? ""
                                          : "rotate-180"
                                      }`}
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 9l-7 7-7-7"
                                      />
                                    </svg>
                                  </button>
                                </div>

                                {isGroupOpen(g.firstKey) && (
                                  <div className="p-4">
                                    {Object.values(secondMap).map((sec) => (
                                      <div
                                        key={`${g.firstKey}-${sec.secondShown}`}
                                        className="mb-4"
                                      >
                                        <div className="bg-gray-100 px-3 py-2 border border-gray-200 rounded flex items-center justify-between">
                                          <h6 className="font-medium text-gray-800">
                                            {sec.secondShown}
                                          </h6>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              toggleSub(
                                                g.firstKey,
                                                sec.secondShown
                                              )
                                            }
                                            className="text-gray-400 hover:text-gray-600"
                                            aria-label={`Toggle ${g.firstShown} - ${sec.secondShown}`}
                                          >
                                            <svg
                                              className={`w-4 h-4 transition-transform ${
                                                isSubOpen(
                                                  g.firstKey,
                                                  sec.secondShown
                                                )
                                                  ? ""
                                                  : "rotate-180"
                                              }`}
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M19 9l-7 7-7-7"
                                              />
                                            </svg>
                                          </button>
                                        </div>

                                        {isSubOpen(
                                          g.firstKey,
                                          sec.secondShown
                                        ) && (
                                          <div className="mt-2 space-y-2">
                                            {sec.items.map((it, idx) => (
                                              <div
                                                key={`${it.key}-${idx}`}
                                                className="flex items-center gap-3 text-sm"
                                              >
                                                <span className="w-24 text-gray-600">
                                                  {it.shown[2] || "Price"}
                                                </span>
                                                <span className="text-gray-500">
                                                  Rp
                                                </span>
                                                <input
                                                  type="number"
                                                  value={
                                                    individualPrices[it.key] ||
                                                    ""
                                                  }
                                                  onChange={(e) =>
                                                    handleIndividualPriceChange(
                                                      it.key,
                                                      e.target.value
                                                    )
                                                  }
                                                  className="px-2 py-1 border border-gray-300 rounded text-sm text-black w-32"
                                                  placeholder="0"
                                                  min={0}
                                                />
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>

            {/* Right side (SEO + Promo) */}
            <div className="space-y-6">
              {/* SEO */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  SEO
                </h3>
                <div className="mb-6">
                  <label
                    htmlFor="tags"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Tags
                  </label>
                  <input
                    type="text"
                    id="tags"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                    placeholder="Product tags"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Keyword
                  </label>
                  {(["id", "en"] as const).map((langKey) => (
                    <div
                      key={langKey}
                      className={language !== langKey ? "hidden" : "block"}
                    >
                      <input
                        type="text"
                        name={`keyword_${langKey}`}
                        value={(formData as any)[`keyword_${langKey}`] || ""}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            [`keyword_${langKey}`]: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                        placeholder={
                          langKey === "id"
                            ? "Kata kunci SEO (Indonesia)"
                            : "SEO keywords (English)"
                        }
                      />
                    </div>
                  ))}
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  {(["id", "en"] as const).map((langKey) => (
                    <div
                      key={langKey}
                      className={language !== langKey ? "hidden" : "block"}
                    >
                      <textarea
                        name={`seoDescription_${langKey}`}
                        value={
                          (formData as any)[`seoDescription_${langKey}`] || ""
                        }
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            [`seoDescription_${langKey}`]: e.target.value,
                          }))
                        }
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black resize-none"
                        placeholder={
                          langKey === "id"
                            ? "Deskripsi SEO (Indonesia)"
                            : "SEO description (English)"
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Promotion (opsional) */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Promotion Product
                </h3>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Promotion Product
                </label>
                <AsyncSelect
                  cacheOptions
                  defaultOptions
                  isClearable
                  loadOptions={loadPromotionOptions}
                  placeholder="Select Promotion Product"
                  onChange={(opt: any) =>
                    setPromotionProduct(
                      opt ? { value: opt.value, label: opt.label } : null
                    )
                  }
                  formatOptionLabel={(option: any) => (
                    <div className="flex items-center gap-2">
                      {option.image && (
                        <img
                          src={option.image}
                          alt={option.label}
                          className="w-6 h-6 rounded object-cover"
                        />
                      )}
                      <span>{option.label}</span>
                    </div>
                  )}
                  styles={{
                    control: (base: any) => ({
                      ...base,
                      borderRadius: "0.75rem",
                      borderColor: "#e5e7eb",
                      padding: "2px",
                      minHeight: "44px",
                    }),
                    valueContainer: (base: any) => ({
                      ...base,
                      padding: "0 10px",
                    }),
                    placeholder: (base: any) => ({ ...base, color: "#6b7280" }),
                  }}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex items-center gap-4">
            <CreateButton onClick={handleCreate} disabled={submitting}>
              {submitting ? "Menyimpan..." : "Create"}
            </CreateButton>
            <CancelButton onClick={handleCancel} disabled={submitting} />
          </div>
        </div>
      </div>
    </div>
  );
}
