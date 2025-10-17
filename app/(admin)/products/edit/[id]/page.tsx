"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/lib/fetching";
import { CreateButton as UpdateButton, CancelButton } from "@/components/ui/ActionButton";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { DeleteButton as DeleteIcon } from "@/components/ui/DeleteIcon";
import AsyncSelect from "react-select/async";
import ProductGallery from "@/app/(admin)/products/create/_components/ProductGallery"; // lokasi komponen sama dgn create

interface Gallery {
  id: number;
  image: string;      // preview url
  fileName: string;
  title: string;
  alt: string;
  file?: File | null; // file baru untuk upload
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

type ProductDetail = any; // sesuaikan kalau kamu punya type detail

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const productId = params?.id;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [language, setLanguage] = useState<"id" | "en">("en");

  // form state — sama seperti create
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
  });

  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [pricingType, setPricingType] = useState<"single" | "individual">("single");
  const [groupPrices, setGroupPrices] = useState<{ [group: string]: string }>({});
  const [individualPrices, setIndividualPrices] = useState<{ [key: string]: string }>({});
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [openSubGroups, setOpenSubGroups] = useState<Record<string, Record<string, boolean>>>({});
  const [promotionProduct, setPromotionProduct] = useState<{ value: number; label: string } | null>(null);

  const isGroupOpen = (first: string) => openGroups[first] !== false;
  const toggleGroup = (first: string) => setOpenGroups((prev) => ({ ...prev, [first]: !isGroupOpen(first) }));
  const isSubOpen = (first: string, second: string) => openSubGroups[first]?.[second] ?? true;
  const toggleSub = (first: string, second: string) =>
    setOpenSubGroups((prev) => ({ ...prev, [first]: { ...(prev[first] || {}), [second]: !isSubOpen(first, second) } }));

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleToggleFeatured = () => setFormData((p) => ({ ...p, featured: !p.featured }));
  const handleToggleStatus = () => setFormData((p) => ({ ...p, status: !p.status }));

  const parseNumber = (v: any) => {
    if (v === null || v === undefined || v === "") return null;
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : null;
  };

  // ======= LOAD DETAIL =======
  useEffect(() => {
    if (!productId) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setErrorMessage(null);
        // prefetch csrf supaya PUT aman
        fetch("/api/sanctum/csrf-cookie", { credentials: "include" }).catch(() => {});
        const res = await api.get<ProductDetail>(`/products/${productId}`);
        if (!mounted) return;

        // Map field dari response ke form
        const d: any = (res as any)?.data || res;

        // bilingual
        const name_id = d?.name?.id ?? "";
        const name_en = d?.name?.en ?? d?.title?.en ?? "";
        const desc_id = d?.description?.id ?? "";
        const desc_en = d?.description?.en ?? "";

        // status → boolean toggle
        const statusStr = String(d?.status ?? "").toLowerCase();
        const isActive = statusStr === "active" || statusStr === "publish" || d?.published === true;

        setFormData({
          name: "", // tidak dipakai (kita simpan per bahasa)
          slug: d?.slug ?? "",
          description: "",
          category: d?.category?.name?.id || d?.category?.name?.en || d?.category?.slug || "",
          category_id: d?.category_id ?? d?.category?.id ?? null,
          price: d?.price != null ? String(d.price) : "",
          tags: Array.isArray(d?.seo_tags) ? d.seo_tags.join(", ") : "",
          keyword: "",
          seoDescription: "",
          featured: !!d?.featured,
          status: isActive,
          heel_height_cm: d?.heel_height_cm != null ? String(d.heel_height_cm) : "",
        });

        // simpan bilingual UI fields (mengikuti layout create)
        setTimeout(() => {
          (setFormData as any)((prev: any) => ({
            ...prev,
            name_id,
            name_en,
            description_id: desc_id,
            description_en: desc_en,
            keyword_id: d?.seo_keyword?.id ?? "",
            keyword_en: d?.seo_keyword?.en ?? "",
            seoDescription_id: d?.seo_description?.id ?? "",
            seoDescription_en: d?.seo_description?.en ?? "",
          }));
        });

        // variants (attributes)
        const attrs: Variant[] = Array.isArray(d?.attributes)
          ? d.attributes.map((a: any, idx: number) => ({
              id: idx + 1,
              name: { id: a?.name?.id ?? "", en: a?.name?.en ?? "" },
              options: Array.isArray(a?.options)
                ? a.options.map((o: any) => ({ id: o?.id ?? "", en: o?.en ?? "" }))
                : [{ id: "", en: "" }],
            }))
          : [];
        setVariants(attrs);

        // pricing
        if (Array.isArray(d?.variant_prices) && d.variant_prices.length > 0) {
          setPricingType("individual");
          const valid = attrs.filter((v) => v.options.some((o) => (o.id || o.en).trim() !== ""));
          if (valid.length === 1) {
            const gp: Record<string, string> = {};
            d.variant_prices.forEach((vp: any) => {
              const label = vp?.labels?.[0];
              const optText = (label?.en || label?.id || "").split(": ").pop() || "";
              if (optText) gp[optText] = String(vp?.price ?? "");
            });
            setGroupPrices(gp);
          } else {
            const ip: Record<string, string> = {};
            d.variant_prices.forEach((vp: any) => {
              // key gabungan pakai en order
              const key = (vp?.labels || [])
                .map((lb: any) => (lb?.en || lb?.id || "").split(": ").pop() || "")
                .join("-");
              if (key) ip[key] = String(vp?.price ?? "");
            });
            setIndividualPrices(ip);
          }
        } else {
          setPricingType("single");
        }

        // galleries
        const gal: Gallery[] = Array.isArray(d?.gallery)
          ? d.gallery.map((g: any, idx: number) => ({
              id: idx + 1,
              image: g?.image_url || g?.url || g?.image || "",
              title: g?.title || "",
              alt: g?.alt || "",
              fileName: g?.file_name || `image-${idx + 1}.jpg`,
            }))
          : [];
        setGalleries(gal);
      } catch (err: any) {
        setErrorMessage(err?.response?.data?.message || err?.message || "Gagal memuat detail produk.");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [productId]);

  // ======= LOADERS (kategori & promo) — sama dgn create =======
  const loadCategoryOptions = useCallback(async (inputValue: string) => {
    try {
      const res = await api.get<{ status: string; data: any[] }>(`/category`, {
        params: { status: "active", perPage: 100, search: inputValue },
      } as any);
      const list = (res as any)?.data?.data || (res as any)?.data || [];
      return list.map((cat: any) => ({
        value: cat.id,
        label: (cat.name && (cat.name.id || cat.name.en)) || cat.slug || `Category ${cat.id}`,
        image: cat.cover_url || cat.cover || null,
      }));
    } catch {
      return [];
    }
  }, []);

  const loadPromotionOptions = useCallback(async (inputValue: string) => {
    try {
      const res = await api.get<{ status: string; data: any[] }>(`/products`, {
        params: { status: "publish", perPage: 100, search: inputValue },
      } as any);
      const list = (res as any)?.data?.data || (res as any)?.data || [];
      return list.map((p: any) => ({
        value: p.id,
        label: (p.name && (p.name.id || p.name.en)) || p.slug || `Product ${p.id}`,
        image: p.cover_url || p.cover || null,
      }));
    } catch {
      return [];
    }
  }, []);

  // ======= VARIANT HELPERS — sama dgn create =======
  const handleAddVariant = () => {
    if (variants.length >= 3) return;
    const v: Variant = { id: variants.length + 1, name: { id: "", en: "" }, options: [{ id: "", en: "" }] };
    setVariants((prev) => [...prev, v]);
  };
  const handleVariantNameChange = (id: number, value: string, lang: "id" | "en") => {
    setVariants((prev) => prev.map((v) => (v.id === id ? { ...v, name: { ...v.name, [lang]: value } } : v)));
  };
  const handleOptionChange = (variantId: number, optionIndex: number, value: string, lang: "id" | "en") => {
    setVariants((prev) =>
      prev.map((variant) => {
        if (variant.id !== variantId) return variant;
        const newOptions = variant.options.map((o, i) => (i === optionIndex ? { ...o, [lang]: value } : o));
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
        if (!newOptions.some((opt) => (opt.id || opt.en).trim() === "")) newOptions.push({ id: "", en: "" });
        return { ...variant, options: newOptions };
      })
    );
  };
  const handleRemoveVariant = (id: number) => setVariants((prev) => prev.filter((v) => v.id !== id));

  const getValidVariants = useMemo(
    () => () => variants.filter((v) => v.options.some((o) => (o.id || o.en).trim() !== "")),
    [variants]
  );
  const validVariantCount = getValidVariants().length;

  useEffect(() => {
    if (validVariantCount !== 1 && Object.keys(groupPrices).length > 0) {
      setGroupPrices({});
    }
  }, [validVariantCount]); // eslint-disable-line

  const generateVariantCombinations = () => {
    const valid = getValidVariants();
    if (valid.length === 0) return [];
    const combinations: string[][] = [[]];
    valid.forEach((variant) => {
      const opts = variant.options
        .filter((o) => (o.id || o.en).trim() !== "")
        .map((o) => (language === "id" ? o.id || o.en : o.en || o.id));
      const next: string[][] = [];
      combinations.forEach((c) => opts.forEach((o) => next.push([...c, o])));
      combinations.length = 0;
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

  const handleGalleryChange = (id: number, field: string, value: string) => {
    setGalleries((prev) => prev.map((g) => (g.id === id ? { ...g, [field]: value } : g)));
  };
  const handleRemoveGallery = (id: number) => setGalleries((prev) => prev.filter((g) => g.id !== id));
  const handleAddGallery = () => {
    const newGallery: Gallery = { id: galleries.length + 1, image: "", title: "", alt: "", fileName: "file_name.jpg" };
    setGalleries((prev) => [...prev, newGallery]);
  };

  // ======= SUBMIT (PUT /products/:id) — sama builder dgn create =======
  const handleUpdate = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const slug = formData.slug.trim();
    const categoryId = formData.category_id;
    const name_id = (formData as any).name_id?.trim() || "";
    const name_en = (formData as any).name_en?.trim() || "";
    const description_id = (formData as any).description_id?.trim() || "";
    const description_en = (formData as any).description_en?.trim() || "";
    const pricingMode = pricingType === "single" ? "single" : "per_variant";
    const rootPriceValue = parseNumber(formData.price);

    const errors: string[] = [];
    if (!name_en) errors.push("Nama produk (EN) wajib diisi.");
    if (!slug) errors.push("Slug wajib diisi.");
    if (!description_en) errors.push("Deskripsi (EN) wajib diisi.");
    if (!categoryId) errors.push("Kategori wajib dipilih.");
    if (pricingMode === "single" && rootPriceValue == null) errors.push("Harga produk wajib diisi.");
    const validVariants = getValidVariants();
    const variantCombinations = generateVariantCombinations();
    if (pricingMode === "per_variant" && validVariants.length > 0 && variantCombinations.length === 0) {
      errors.push("Lengkapi opsi varian sebelum menyimpan.");
    }
    if (errors.length > 0) { setErrorMessage(errors[0]); return; }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("status", formData.status ? "publish" : "draft");
      fd.append("featured", formData.featured ? "1" : "0");
      fd.append("category_id", String(categoryId));
      fd.append("pricing_mode", pricingMode);
      fd.append("name[id]", name_id);
      fd.append("name[en]", name_en);
      fd.append("description[id]", description_id);
      fd.append("description[en]", description_en);
      fd.append("slug", slug);
      fd.append("heel_height_cm", formData.heel_height_cm || "0");

      // SEO
      const seoTags = formData.tags.split(/[,\n]/).map((t) => t.trim()).filter(Boolean);
      seoTags.forEach((tag, i) => fd.append(`seo_tags[${i}]`, tag));
      const keyword_id = (formData as any).keyword_id?.trim() || "";
      const keyword_en = (formData as any).keyword_en?.trim() || "";
      const seoDesc_id = (formData as any).seoDescription_id?.trim() || "";
      const seoDesc_en = (formData as any).seoDescription_en?.trim() || "";
      if (keyword_id) fd.append("seo_keyword[id]", keyword_id);
      if (keyword_en) fd.append("seo_keyword[en]", keyword_en);
      if (seoDesc_id) fd.append("seo_description[id]", seoDesc_id);
      if (seoDesc_en) fd.append("seo_description[en]", seoDesc_en);

      // Attributes
      const attributes = getValidVariants().map((variant, index) => ({
        name: {
          id: variant.name.id || variant.name.en || `Variant ${index + 1}`,
          en: variant.name.en || variant.name.id || `Variant ${index + 1}`,
        },
        options: variant.options
          .filter((o) => (o.id || o.en).trim() !== "")
          .map((o) => ({ id: o.id || o.en, en: o.en || o.id })),
      }));
      attributes.forEach((attr, i) => {
        fd.append(`attributes[${i}][name][id]`, attr.name.id);
        fd.append(`attributes[${i}][name][en]`, attr.name.en);
        attr.options.forEach((opt, j) => {
          fd.append(`attributes[${i}][options][${j}][id]`, opt.id);
          fd.append(`attributes[${i}][options][${j}][en]`, opt.en);
        });
      });

      // Variant prices
      if (pricingMode === "per_variant" && variantCombinations.length > 0) {
        type VPrice = {
          labels: { id: string; en: string }[];
          price: number;
          stock: number;
          active: boolean;
          size_eu?: number;
        };
        const valid = getValidVariants();
        const optionCombos: LangText[][] = (() => {
          if (valid.length === 0) return [];
          let combos: LangText[][] = [[]];
          valid.forEach((v) => {
            const opts = v.options.filter((o) => (o.id || o.en).trim() !== "");
            const next: LangText[][] = [];
            combos.forEach((c) => opts.forEach((o) => next.push([...c, o])));
            combos = next;
          });
          return combos;
        })();

        const variantPricesPayload: VPrice[] = [];
        if (valid.length === 1) {
          optionCombos.forEach((combination) => {
            const opt = combination[0];
            const displayFirst = opt.en || opt.id;
            const priceValue = parseNumber(groupPrices[displayFirst]);
            if (priceValue != null) {
              const v0 = valid[0];
              const label = {
                id: `${v0.name.id || v0.name.en}: ${opt.id || opt.en}`,
                en: `${v0.name.en || v0.name.id}: ${opt.en || opt.id}`,
              };
              const payload: VPrice = { labels: [label], price: priceValue, stock: 0, active: true };
              const numericSize = Number(opt.en || opt.id);
              if (!Number.isNaN(numericSize)) payload.size_eu = numericSize;
              variantPricesPayload.push(payload);
            }
          });
        } else {
          optionCombos.forEach((combination) => {
            const enKey = combination.map((o) => o.en || o.id).join("-");
            const priceValue = parseNumber(individualPrices[enKey]);
            if (priceValue != null) {
              const labels = combination.map((opt, idx) => {
                const v = valid[idx];
                return {
                  id: `${v.name.id || v.name.en}: ${opt.id || opt.en}`,
                  en: `${v.name.en || v.name.id}: ${opt.en || opt.id}`,
                };
              });
              variantPricesPayload.push({ labels, price: priceValue, stock: 0, active: true });
            }
          });
        }
        variantPricesPayload.forEach((vp, i) => {
          vp.labels.forEach((label, j) => {
            fd.append(`variant_prices[${i}][labels][${j}][id]`, label.id);
            fd.append(`variant_prices[${i}][labels][${j}][en]`, label.en);
          });
          fd.append(`variant_prices[${i}][price]`, String(vp.price));
          fd.append(`variant_prices[${i}][stock]`, String(vp.stock));
          fd.append(`variant_prices[${i}][active]`, vp.active ? "1" : "0");
          if (vp.size_eu != null) fd.append(`variant_prices[${i}][size_eu]`, String(vp.size_eu));
        });
      } else if (pricingMode === "single" && rootPriceValue != null) {
        fd.append("price", String(rootPriceValue));
      }

      // Gallery (tambahkan file baru saja; gambar lama dibiarkan)
      galleries.forEach((g, i) => {
        if (g.file) {
          fd.append(`gallery[${i}][image]`, g.file);
          if (g.title) fd.append(`gallery[${i}][title]`, g.title);
          if (g.alt) fd.append(`gallery[${i}][alt]`, g.alt);
          fd.append(`gallery[${i}][sort]`, String(i));
        }
      });

      // (opsional) promotion_product_id bila diperlukan
      if (promotionProduct?.value) {
        fd.append("promotion_product_id", String(promotionProduct.value));
      }

      await api.patch(`/products/${productId}`, fd as any);
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

  // ======= RENDER — layout sama seperti create, hanya title & tombol =======
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

        {/* Language selector */}
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
          {loading && (
            <div className="mb-6 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
              Memuat detail produk...
            </div>
          )}
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
            {/* Left: Details (markup sama seperti create) */}
            {/* >>>> SALIN persis blok “Details”, “ProductGallery”, “Variant”, dan “Product Variant” dari create page <<<< */}
            {/* ------- START COPY FROM CREATE (dengan handler yg sama) ------- */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Details</h2>

                {/* Name */}
                <div className="mb-6">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
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
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
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
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
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

              <ProductGallery
                galleries={galleries}
                onAddGallery={handleAddGallery}
                onRemoveGallery={handleRemoveGallery}
                onGalleryChange={handleGalleryChange}
              />

              {/* Variants builder + pricing — sama dengan create */}
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
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(variant.id)}
                          className="text-gray-400 hover:text-red-600 text-lg"
                        >
                          ×
                        </button>
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
                                placeholder={
                                  optionIndex === variant.options.length - 1
                                    ? language === "id" ? "Isi di sini" : "Input here"
                                    : "Option"
                                }
                              />
                              {variant.options.length > 1 && (option.id || option.en).trim() !== "" && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveOption(variant.id, optionIndex)}
                                  className="text-red-500 hover:text-red-700 text-sm w-4 h-4 flex items-center justify-center"
                                >
                                  <DeleteIcon label="" onClick={() => handleRemoveOption(variant.id, optionIndex)} className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pricing section */}
                {variants.some((v) => v.options.some((o) => (o.id || o.en).trim() !== "")) && (
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Variant</h3>

                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Set Pricing</h4>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="pricingType"
                            value="single"
                            checked={pricingType === "single"}
                            onChange={(e) => setPricingType(e.target.value as "single" | "individual")}
                            className="text-blue-600"
                          />
                          <span className="text-sm text-gray-700">Single Price for All Variant</span>
                        </label>
                        <label className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="pricingType"
                            value="individual"
                            checked={pricingType === "individual"}
                            onChange={(e) => setPricingType(e.target.value as "single" | "individual")}
                            className="text-blue-600"
                          />
                          <span className="text-sm text-gray-700">Set Individual Prices</span>
                        </label>
                      </div>
                    </div>

                    {/* 1 dimensi */}
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
                                    type="number"
                                    value={groupPrices[firstOption] ?? ""}
                                    onChange={(e) => setGroupPrices((prev) => ({ ...prev, [firstOption]: e.target.value }))}
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

                    {/* >=2 dimensi */}
                    {pricingType === "individual" && validVariantCount >= 2 && (
                      <div className="space-y-4">
                        {Object.entries(groupedCombinations()).map(([firstOption, combinations]) => (
                          <div key={firstOption} className="border border-gray-200 rounded-lg">
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                              <h5 className="font-medium text-gray-900">{firstOption}</h5>
                              <button
                                type="button"
                                onClick={() => toggleGroup(firstOption)}
                                className="text-gray-400 hover:text-gray-600"
                                aria-label={`Toggle ${firstOption}`}
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
                                          type="button"
                                          onClick={() => toggleSub(firstOption, String(secondOption))}
                                          className="text-gray-400 hover:text-gray-600"
                                          aria-label={`Toggle ${firstOption} - ${String(secondOption)}`}
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
                                              const valid = getValidVariants();
                                              const enParts = combination.map((val, pos) => {
                                                const v = valid[pos];
                                                const found = v?.options.find(
                                                  (o) => (o.en || o.id) === val || (o.id || o.en) === val
                                                );
                                                return found ? found.en || found.id : String(val);
                                              });
                                              const key = enParts.join("-");
                                              const thirdOption = combination[2];
                                              return (
                                                <div key={`${key}-${idx}`} className="flex items-center gap-3 text-sm">
                                                  <span className="w-24 text-gray-600">{thirdOption || "Price"}</span>
                                                  <span className="text-gray-500">Rp</span>
                                                  <input
                                                    type="number"
                                                    value={individualPrices[key] || ""}
                                                    onChange={(e) => setIndividualPrices((p) => ({ ...p, [key]: e.target.value }))}
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
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right - SEO + Promotion Product (markup sama) */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">SEO</h3>
                <div className="mb-6">
                  <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
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
                  <label htmlFor="keyword" className="block text-sm font-medium text-gray-700 mb-2">Keyword</label>
                  {(["id", "en"] as const).map((langKey) => (
                    <div key={langKey} className={`${language !== langKey ? "hidden" : "block"}`}>
                      <input
                        type="text"
                        name={`keyword_${langKey}`}
                        value={(formData as any)[`keyword_${langKey}`] || ""}
                        onChange={(e) => setFormData((prev) => ({ ...prev, [`keyword_${langKey}`]: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                        placeholder={langKey === "id" ? "Kata kunci SEO (Indonesia)" : "SEO keywords (English)"}
                      />
                    </div>
                  ))}
                </div>
                <div className="mb-6">
                  <label htmlFor="seoDescription" className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  {(["id", "en"] as const).map((langKey) => (
                    <div key={langKey} className={`${language !== langKey ? "hidden" : "block"}`}>
                      <textarea
                        name={`seoDescription_${langKey}`}
                        value={(formData as any)[`seoDescription_${langKey}`] || ""}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Promotion Product</label>
                <AsyncSelect
                  cacheOptions
                  defaultOptions
                  isClearable
                  loadOptions={loadPromotionOptions}
                  placeholder="Select Promotion Product"
                  onChange={(selected: any) => setPromotionProduct(selected)}
                  value={promotionProduct}
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