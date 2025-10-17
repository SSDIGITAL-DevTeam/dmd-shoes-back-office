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

interface Gallery {
  id: number;
  image: string;      // preview
  fileName: string;
  title: string;
  alt: string;
  file?: File | null; // file asli untuk FormData
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

  // Bahasa UI untuk input bilingual
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
    status: true, // toggle UI -> di-serialize jadi boolean (JSON) atau "true"/"false" (multipart)
    heel_height_cm: "",
  });

  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [pricingType, setPricingType] = useState<"single" | "individual">("single");

  // harga per 1 dimensi (group)
  const [groupPrices, setGroupPrices] = useState<{ [group: string]: string }>({});
  // harga per kombinasi (≥2 dimensi)
  const [individualPrices, setIndividualPrices] = useState<{ [key: string]: string }>({});
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [openSubGroups, setOpenSubGroups] = useState<Record<string, Record<string, boolean>>>({});

  const isGroupOpen = (first: string) => openGroups[first] !== false; // undefined => open
  const toggleGroup = (first: string) =>
    setOpenGroups((prev) => ({ ...prev, [first]: !isGroupOpen(first) }));

  const isSubOpen = (first: string, second: string) =>
    openSubGroups[first]?.[second] ?? true;
  const toggleSub = (first: string, second: string) =>
    setOpenSubGroups((prev) => ({
      ...prev,
      [first]: { ...(prev[first] || {}), [second]: !isSubOpen(first, second) },
    }));

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleFeatured = () => {
    setFormData((prev) => ({ ...prev, featured: !prev.featured }));
  };

  const parseNumber = (value: string | number | null | undefined) => {
    if (value === null || value === undefined || value === "") return null;
    const numeric = typeof value === "number" ? value : Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  };

  // ==============================
  // CREATE (POST) PRODUCT
  // ==============================
  const handleCreate = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const slug = formData.slug.trim();
    const categoryId = formData.category_id;

    const name_id = (formData as any).name_id?.trim() || "";
    const name_en = (formData as any).name_en?.trim() || "";
    const description_id = (formData as any).description_id?.trim() || "";
    const description_en = (formData as any).description_en?.trim() || "";

    const errors: string[] = [];
    if (!name_en) errors.push("Nama produk (EN) wajib diisi.");
    if (!slug) errors.push("Slug wajib diisi.");
    if (!description_en) errors.push("Deskripsi (EN) wajib diisi.");
    if (!categoryId) errors.push("Kategori wajib dipilih.");

    const pricingMode = pricingType === "single" ? "single" : "per_variant";
    const rootPriceValue = parseNumber(formData.price);
    if (pricingMode === "single" && rootPriceValue == null) {
      errors.push("Harga produk wajib diisi.");
    }

    const validVariants = variants.filter((v) =>
      v.options.some((o) => (o.id || o.en).trim() !== "")
    );

    // varian combinations (sekadar validasi)
    const generateVariantCombinations = () => {
      if (validVariants.length === 0) return [];
      let combos: string[][] = [[]];
      validVariants.forEach((variant) => {
        const opts = variant.options
          .filter((o) => (o.id || o.en).trim() !== "")
          .map((o) => (language === "id" ? o.id || o.en : o.en || o.id));
        const next: string[][] = [];
        combos.forEach((c) => opts.forEach((o) => next.push([...c, o])));
        combos = next;
      });
      return combos;
    };

    const variantCombinations = generateVariantCombinations();
    if (pricingMode === "per_variant" && validVariants.length > 0 && variantCombinations.length === 0) {
      errors.push("Lengkapi opsi varian sebelum menyimpan.");
    }

    if (errors.length > 0) {
      setErrorMessage(errors[0]);
      return;
    }

    setSubmitting(true);

    // helpers builder
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
      type VPrice = {
        labels: { id: string; en: string }[];
        price: number;
        stock: number;
        active: boolean;
        size_eu?: number;
      };

      // LangText combos
      let combos: { id: string; en: string }[][] = [[]];
      validVariants.forEach((v) => {
        const opts = v.options
          .filter((o) => (o.id || o.en).trim() !== "")
          .map((o) => ({ id: o.id || o.en, en: o.en || o.id }));
        const next: { id: string; en: string }[][] = [];
        combos.forEach((c) => opts.forEach((o) => next.push([...c, o])));
        combos = next;
      });

      const result: VPrice[] = [];

      if (validVariants.length === 1) {
        combos.forEach((combination) => {
          const opt = combination[0];
          const displayFirst = opt.en || opt.id;
          const priceValue =
            groupPrices[displayFirst] === "" ? null : Number(groupPrices[displayFirst]);
          if (priceValue != null && Number.isFinite(priceValue)) {
            const v0 = validVariants[0];
            const label = {
              id: `${v0.name.id || v0.name.en}: ${opt.id || opt.en}`,
              en: `${v0.name.en || v0.name.id}: ${opt.en || opt.id}`,
            };
            const vp: VPrice = { labels: [label], price: priceValue, stock: 0, active: true };
            const numericSize = Number(opt.en || opt.id);
            if (!Number.isNaN(numericSize)) vp.size_eu = numericSize;
            result.push(vp);
          }
        });
      } else if (validVariants.length >= 2) {
        combos.forEach((combination) => {
          const enKey = combination.map((o) => o.en || o.id).join("-");
          const priceValue =
            individualPrices[enKey] === "" ? null : Number(individualPrices[enKey]);
          if (priceValue != null && Number.isFinite(priceValue)) {
            const labels = combination.map((opt, idx) => {
              const v = validVariants[idx];
              return {
                id: `${v.name.id || v.name.en}: ${opt.id || opt.en}`,
                en: `${v.name.en || v.name.id}: ${opt.en || opt.id}`,
              };
            });
            result.push({ labels, price: priceValue, stock: 0, active: true });
          }
        });
      }

      return result;
    };

    try {
      // SEO
      const seoTags = formData.tags
        .split(/[,\n]/)
        .map((t) => t.trim())
        .filter(Boolean);
      const keyword_id = (formData as any).keyword_id?.trim() || "";
      const keyword_en = (formData as any).keyword_en?.trim() || "";
      const seoDesc_id = (formData as any).seoDescription_id?.trim() || "";
      const seoDesc_en = (formData as any).seoDescription_en?.trim() || "";

      const hasFiles = galleries.some((g) => g.file);

      if (!hasFiles) {
        // ===== JSON PATH (boolean asli) =====
        const payload: any = {
          status: !!formData.status,
          featured: !!formData.featured,
          category_id: Number(categoryId),
          pricing_mode: pricingMode,
          name: { id: name_id, en: name_en },
          description: { id: description_id, en: description_en },
          slug,
          heel_height_cm: Number(formData.heel_height_cm || 0),
          seo_tags: seoTags,
          seo_keyword: { id: keyword_id, en: keyword_en },
          seo_description: { id: seoDesc_id, en: seoDesc_en },
        };
        if (pricingMode === "single" && rootPriceValue != null) payload.price = rootPriceValue;

        const attributes = buildAttributes();
        if (attributes.length) payload.attributes = attributes;

        if (pricingMode === "per_variant" && attributes.length) {
          const variant_prices = buildVariantPrices();
          if (variant_prices.length) payload.variant_prices = variant_prices;
        }

        const res = await api.post(`/products`, JSON.stringify(payload), {
          headers: { "Content-Type": "application/json" },
        });

        setSuccessMessage(res.data?.message || "Produk berhasil dibuat.");
        setTimeout(() => router.push("/products"), 800);
        return;
      }

      // ===== MULTIPART PATH (ada file) =====
      const fd = new FormData();
      // kirim sebagai string "true"/"false" untuk aman di validator boolean backend
      fd.append("status", String(!!formData.status));
      fd.append("featured", String(!!formData.featured));
      fd.append("category_id", String(categoryId));
      fd.append("pricing_mode", pricingMode);
      fd.append("name[id]", name_id);
      fd.append("name[en]", name_en);
      fd.append("description[id]", description_id);
      fd.append("description[en]", description_en);
      fd.append("slug", slug);
      fd.append("heel_height_cm", String(Number(formData.heel_height_cm || 0)));
      seoTags.forEach((tag, i) => fd.append(`seo_tags[${i}]`, tag));
      if (keyword_id) fd.append("seo_keyword[id]", keyword_id);
      if (keyword_en) fd.append("seo_keyword[en]", keyword_en);
      if (seoDesc_id) fd.append("seo_description[id]", seoDesc_id);
      if (seoDesc_en) fd.append("seo_description[en]", seoDesc_en);
      if (pricingMode === "single" && rootPriceValue != null) {
        fd.append("price", String(rootPriceValue));
      }
      const attributes = buildAttributes();
      attributes.forEach((attr, i) => {
        fd.append(`attributes[${i}][name][id]`, attr.name.id);
        fd.append(`attributes[${i}][name][en]`, attr.name.en);
        attr.options.forEach((opt, j) => {
          fd.append(`attributes[${i}][options][${j}][id]`, opt.id);
          fd.append(`attributes[${i}][options][${j}][en]`, opt.en);
        });
      });
      if (pricingMode === "per_variant" && attributes.length) {
        const vps = buildVariantPrices();
        vps.forEach((vp, i) => {
          vp.labels.forEach((label, j) => {
            fd.append(`variant_prices[${i}][labels][${j}][id]`, label.id);
            fd.append(`variant_prices[${i}][labels][${j}][en]`, label.en);
          });
          fd.append(`variant_prices[${i}][price]`, String(vp.price));
          fd.append(`variant_prices[${i}][stock]`, String(vp.stock));
          fd.append(`variant_prices[${i}][active]`, vp.active ? "1" : "0");
          if (vp.size_eu != null) fd.append(`variant_prices[${i}][size_eu]`, String(vp.size_eu));
        });
      }
      galleries.forEach((g, i) => {
        if (g.file) fd.append(`gallery[${i}][image]`, g.file);
        if (g.title) fd.append(`gallery[${i}][title]`, g.title);
        if (g.alt) fd.append(`gallery[${i}][alt]`, g.alt);
        fd.append(`gallery[${i}][sort]`, String(i));
      });

      const res = await api.post(`/products`, fd as any);
      setSuccessMessage(res.data?.message || "Produk berhasil dibuat.");
      setTimeout(() => router.push("/products"), 800);
    } catch (err: any) {
      console.error("Gagal membuat produk:", err);
      const response = err?.response?.data;
      if (response?.errors) {
        const messages = Object.values(response.errors)
          .flat()
          .map((m: unknown) => String(m));
        setErrorMessage(messages.length ? messages.join(", ") : response.message || "Gagal membuat produk.");
      } else {
        const errorMsg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          response?.message ||
          err?.message ||
          "Terjadi kesalahan saat membuat produk. Silakan coba lagi.";
        setErrorMessage(errorMsg);
      }
      setSuccessMessage(null);
    } finally {
      setSubmitting(false);
    }
  };

  // === SEO/Status toggles ===
  const handleCancel = () => router.push("/products");
  const handleToggleStatus = () => setFormData((p) => ({ ...p, status: !p.status }));

  // === Gallery handlers ===
  const handleGalleryChange = (id: number, field: string, value: string) => {
    setGalleries((prev) => prev.map((g) => (g.id === id ? { ...g, [field]: value } : g)));
  };
  const handleRemoveGallery = (id: number) => {
    setGalleries((prev) => prev.filter((g) => g.id !== id));
  };
  const handleAddGallery = () => {
    const newGallery: Gallery = {
      id: galleries.length + 1,
      image: "",
      title: "",
      alt: "",
      fileName: "file_name.jpg",
    };
    setGalleries((prev) => [...prev, newGallery]);
  };

  // === Load Category options (top level/active) ===
  const loadCategoryOptions = useCallback(async (inputValue: string) => {
    try {
      const res = await api.get<{ status: string; data: any[] }>(`/category`, {
        params: { status: "active", perPage: 100, search: inputValue, parent: "top" },
      });
      const list = (res as any)?.data?.data || (res as any)?.data || [];
      return list.map((cat: any) => ({
        value: cat.id,
        label:
          (cat.name && (cat.name.id || cat.name.en)) ||
          cat.slug ||
          `Category ${cat.id}`,
        image: cat.cover_url || cat.cover || null,
      }));
    } catch {
      return [];
    }
  }, []);

  // Produk promosi (opsional)
  const [promotionProduct, setPromotionProduct] =
    useState<{ value: number; label: string } | null>(null);
  const loadPromotionOptions = useCallback(async (inputValue: string) => {
    try {
      const res = await api.get<{ status: string; data: any[] }>(`/products`, {
        params: { status: "publish", perPage: 100, search: inputValue },
      });
      const list = (res as any)?.data?.data || (res as any)?.data || [];
      return list.map((p: any) => ({
        value: p.id,
        label:
          (p.name && (p.name.id || p.name.en)) ||
          p.slug ||
          `Product ${p.id}`,
        image: p.cover_url || p.cover || null,
      }));
    } catch {
      return [];
    }
  }, []);

  // === Variant helpers ===
  const handleAddVariant = () => {
    if (variants.length >= 3) return;
    const newVariant: Variant = {
      id: variants.length + 1,
      name: { id: "", en: "" },
      options: [{ id: "", en: "" }],
    };
    setVariants((prev) => [...prev, newVariant]);
  };

  const handleVariantNameChange = (id: number, value: string, lang: "id" | "en") => {
    setVariants((prev) =>
      prev.map((v) => (v.id === id ? { ...v, name: { ...v.name, [lang]: value } } : v))
    );
  };

  const handleOptionChange = (
    variantId: number,
    optionIndex: number,
    value: string,
    lang: "id" | "en"
  ) => {
    setVariants((prev) =>
      prev.map((variant) => {
        if (variant.id !== variantId) return variant;
        const newOptions = variant.options.map((o, i) =>
          i === optionIndex ? { ...o, [lang]: value } : o
        );
        const hasEmpty = newOptions.some((opt) => (opt.id || opt.en).trim() === "");
        const finalOptions = hasEmpty ? newOptions : [...newOptions, { id: "", en: "" }];
        return { ...variant, options: finalOptions };
      })
    );
  };

  const handleRemoveOption = (variantId: number, optionIndex: number) => {
    setVariants((prev) =>
      prev.map((variant) => {
        if (variant.id !== variantId) return variant;
        const newOptions = variant.options.filter((_, i) => i !== optionIndex);
        if (!newOptions.some((opt) => (opt.id || opt.en).trim() === "")) {
          newOptions.push({ id: "", en: "" });
        }
        return { ...variant, options: newOptions };
      })
    );
  };

  const handleRemoveVariant = (id: number) => {
    setVariants((prev) => prev.filter((v) => v.id !== id));
  };

  const handleIndividualPriceChange = (key: string, price: string) => {
    setIndividualPrices((prev) => ({ ...prev, [key]: price }));
  };

  const getValidVariants = useMemo(
    () => () =>
      variants.filter((v) => v.options.some((opt) => (opt.id || opt.en).trim() !== "")),
    [variants]
  );
  const validVariantCount = getValidVariants().length;

  // Reset group prices saat dimensi ≠ 1
  useEffect(() => {
    if (validVariantCount !== 1 && Object.keys(groupPrices).length > 0) {
      setGroupPrices({});
    }
  }, [validVariantCount]); // eslint-disable-line react-hooks/exhaustive-deps

  // Kombinasi varian (string)
  const generateVariantCombinations = () => {
    const valid = getValidVariants();
    if (valid.length === 0) return [];
    let combos: string[][] = [[]];
    valid.forEach((variant) => {
      const opts = variant.options
        .filter((o) => (o.id || o.en).trim() !== "")
        .map((o) => (language === "id" ? o.id || o.en : o.en || o.id));
      const next: string[][] = [];
      combos.forEach((c) => opts.forEach((o) => next.push([...c, o])));
      combos = next;
    });
    return combos;
  };

  // Kelompokkan berdasarkan opsi pertama
  const groupedCombinations = () => {
    const grouped: { [key: string]: string[][] } = {};
    generateVariantCombinations().forEach((comb) => {
      const first = comb[0] || "Default";
      if (!grouped[first]) grouped[first] = [];
      grouped[first].push(comb);
    });
    return grouped;
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

        {/* Language selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="language" className="text-sm font-medium text-gray-700">
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
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Details</h2>

                {/* Name */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  {(["id", "en"] as const).map((langKey) => (
                    <div key={langKey} className={language !== langKey ? "hidden" : "block"}>
                      <input
                        type="text"
                        name={`name_${langKey}`}
                        value={(formData as any)[`name_${langKey}`] || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, [`name_${langKey}`]: e.target.value }))
                        }
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
                    type="text"
                    id="slug"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
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
                    <div key={langKey} className={language !== langKey ? "hidden" : "block"}>
                      <textarea
                        name={`description_${langKey}`}
                        value={(formData as any)[`description_${langKey}`] || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            [`description_${langKey}`]: e.target.value,
                          }))
                        }
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
                    cacheOptions
                    defaultOptions
                    isClearable
                    loadOptions={loadCategoryOptions}
                    placeholder="Search and select category..."
                    onChange={(selected: any) =>
                      setFormData((prev) => ({
                        ...prev,
                        category: selected?.label || "",
                        category_id: selected?.value ?? null,
                      }))
                    }
                    formatOptionLabel={(option: any) => (
                      <div className="flex items-center gap-2">
                        {option.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={option.image} alt={option.label} className="w-6 h-6 rounded object-cover" />
                        )}
                        <span>{option.label}</span>
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
                        ? { value: formData.category_id, label: formData.category }
                        : null
                    }
                  />
                </div>

                {/* Base Price */}
                <div className="mb-6">
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
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
                  <label htmlFor="heel_height_cm" className="block text-sm font-medium text-gray-700 mb-2">
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

              {/* Gallery */}
              <ProductGallery
                galleries={galleries}
                onAddGallery={handleAddGallery}
                onRemoveGallery={handleRemoveGallery}
                onGalleryChange={handleGalleryChange}
              />

              {/* Variants */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Variant</h2>
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
                  {variants.map((variant, variantIndex) => (
                    <div key={variant.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-700">
                            Variant {variantIndex + 1}
                          </span>
                          <input
                            type="text"
                            value={language === "id" ? variant.name.id || "" : variant.name.en || ""}
                            onChange={(e) => handleVariantNameChange(variant.id, e.target.value, language)}
                            className="px-3 py-1 border border-gray-300 rounded text-sm text-black bg-white"
                            placeholder={language === "id" ? "Nama varian (Indonesia)" : "Variant name (English)"}
                          />
                        </div>
                        {/* Hapus variant */}
                        <DeleteIcon
                          label=""
                          onClick={() => handleRemoveVariant(variant.id)}
                          className="text-gray-400 hover:text-red-600 text-lg"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Option</label>
                        <div className="flex flex-wrap gap-2">
                          {variant.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center gap-1">
                              <input
                                type="text"
                                value={language === "id" ? option.id || "" : option.en || ""}
                                onChange={(e) =>
                                  handleOptionChange(variant.id, optionIndex, e.target.value, language)
                                }
                                className="px-3 py-1 border border-gray-300 rounded text-sm text-black bg-white w-24"
                                placeholder={
                                  optionIndex === variant.options.length - 1
                                    ? language === "id"
                                      ? "Isi di sini"
                                      : "Input here"
                                    : "Option"
                                }
                              />
                              {variant.options.length > 1 &&
                                (option.id || option.en).trim() !== "" && (
                                  // ⛔️ Tidak ada wrapper <button> di sekitar DeleteIcon (hindari nested button)
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

                {/* Product Variant Pricing */}
                {variants.some((v) => v.options.some((o) => (o.id || o.en).trim() !== "")) && (
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Variant</h3>

                    {/* Set Pricing */}
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Set Pricing</h4>

                      <div className="space-y-3">
                        <label className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="pricingType"
                            value="single"
                            checked={pricingType === "single"}
                            onChange={(e) =>
                              setPricingType(e.target.value as "single" | "individual")
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
                            value="individual"
                            checked={pricingType === "individual"}
                            onChange={(e) =>
                              setPricingType(e.target.value as "single" | "individual")
                            }
                            className="text-blue-600"
                          />
                          <span className="text-sm text-gray-700">Set Individual Prices</span>
                        </label>
                      </div>
                    </div>

                    {/* Harga per KELOMPOK (1 dimensi) */}
                    {pricingType === "individual" && validVariantCount === 1 && (
                      <div className="space-y-4">
                        {Object.keys(groupedCombinations()).map((firstOption) => (
                          <div key={firstOption} className="border border-gray-200 rounded-lg">
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                              <h5 className="font-medium text-gray-900">{firstOption}</h5>
                              <button
                                type="button"
                                onClick={() => toggleGroup(firstOption)}
                                className="text-gray-400 hover:text-gray-600"
                                aria-label={`Toggle ${firstOption}`}
                              >
                                <svg
                                  className={`w-4 h-4 transition-transform ${
                                    isGroupOpen(firstOption) ? "" : "rotate-180"
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

                            {isGroupOpen(firstOption) && (
                              <div className="p-4">
                                <div className="flex items-center gap-3 text-sm">
                                  <span className="text-gray-600">Rp</span>
                                  <input
                                    type="number"
                                    value={groupPrices[firstOption] ?? ""}
                                    onChange={(e) =>
                                      setGroupPrices((prev) => ({
                                        ...prev,
                                        [firstOption]: e.target.value,
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

                    {/* Harga per KOMBINASI (≥2 dimensi) */}
                    {pricingType === "individual" && validVariantCount >= 2 && (
                      <div className="space-y-4">
                        {Object.entries(groupedCombinations()).map(
                          ([firstOption, combinations]) => (
                            <div key={firstOption} className="border border-gray-200 rounded-lg">
                              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                                <h5 className="font-medium text-gray-900">{firstOption}</h5>
                                <button
                                  type="button"
                                  onClick={() => toggleGroup(firstOption)}
                                  className="text-gray-400 hover:text-gray-600"
                                  aria-label={`Toggle ${firstOption}`}
                                >
                                  <svg
                                    className={`w-4 h-4 transition-transform ${
                                      isGroupOpen(firstOption) ? "" : "rotate-180"
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

                              {isGroupOpen(firstOption) && (
                                <div className="p-4">
                                  {Array.from(new Set(combinations.map((c) => c[1])))
                                    .filter(Boolean)
                                    .map((secondOption) => (
                                      <div key={String(secondOption)} className="mb-4">
                                        <div className="bg-gray-100 px-3 py-2 border border-gray-200 rounded flex items-center justify-between">
                                          <h6 className="font-medium text-gray-800">
                                            {String(secondOption)}
                                          </h6>
                                          <button
                                            type="button"
                                            onClick={() => toggleSub(firstOption, String(secondOption))}
                                            className="text-gray-400 hover:text-gray-600"
                                            aria-label={`Toggle ${firstOption} - ${String(secondOption)}`}
                                          >
                                            <svg
                                              className={`w-4 h-4 transition-transform ${
                                                isSubOpen(firstOption, String(secondOption))
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

                                        {isSubOpen(firstOption, String(secondOption)) && (
                                          <div className="mt-2 space-y-2">
                                            {combinations
                                              .filter((c) => c[1] === secondOption)
                                              .map((combination, idx) => {
                                                const valid = getValidVariants();
                                                const enParts = combination.map((val, pos) => {
                                                  const v = valid[pos];
                                                  const found = v?.options.find(
                                                    (o) =>
                                                      (o.en || o.id) === val ||
                                                      (o.id || o.en) === val
                                                  );
                                                  return found ? found.en || found.id : String(val);
                                                });
                                                const key = enParts.join("-");
                                                const thirdOption = combination[2];
                                                return (
                                                  <div
                                                    key={`${key}-${idx}`}
                                                    className="flex items-center gap-3 text-sm"
                                                  >
                                                    <span className="w-24 text-gray-600">
                                                      {thirdOption || "Price"}
                                                    </span>
                                                    <span className="text-gray-500">Rp</span>
                                                    <input
                                                      type="number"
                                                      value={individualPrices[key] || ""}
                                                      onChange={(e) =>
                                                        handleIndividualPriceChange(
                                                          key,
                                                          e.target.value
                                                        )
                                                      }
                                                      className="px-2 py-1 border border-gray-300 rounded text-sm text-black w-32"
                                                      placeholder="0"
                                                      min={0}
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
                          )
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right - SEO + Promotion Product */}
            <div className="space-y-6">
              {/* SEO Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">SEO</h3>

                <div className="mb-6">
                  <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
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
                    <div key={langKey} className={language !== langKey ? "hidden" : "block"}>
                      <input
                        type="text"
                        name={`keyword_${langKey}`}
                        value={(formData as any)[`keyword_${langKey}`] || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            [`keyword_${langKey}`]: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                        placeholder={
                          langKey === "id" ? "Kata kunci SEO (Indonesia)" : "SEO keywords (English)"
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
                    <div key={langKey} className={language !== langKey ? "hidden" : "block"}>
                      <textarea
                        name={`seoDescription_${langKey}`}
                        value={(formData as any)[`seoDescription_${langKey}`] || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            [`seoDescription_${langKey}`]: e.target.value,
                          }))
                        }
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black resize-none"
                        placeholder={
                          langKey === "id" ? "Deskripsi SEO (Indonesia)" : "SEO description (English)"
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Promotion Product Card (opsional, tidak mempengaruhi submit saat ini) */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Promotion Product</h3>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Promotion Product
                </label>
                <AsyncSelect
                  cacheOptions
                  defaultOptions
                  isClearable
                  loadOptions={loadPromotionOptions}
                  placeholder="Select Promotion Product"
                  onChange={(selected: any) => {
                    // kalau nanti backend butuh, tambahkan saat submit (tidak mengubah layout)
                    // contoh: if (selected?.value) fd.append('promotion_product_id', selected.value)
                  }}
                  formatOptionLabel={(option: any) => (
                    <div className="flex items-center gap-2">
                      {option.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={option.image} alt={option.label} className="w-6 h-6 rounded object-cover" />
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
                    valueContainer: (base: any) => ({ ...base, padding: "0 10px" }),
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