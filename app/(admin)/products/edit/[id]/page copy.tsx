"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/fetching";
import { CreateButton, CancelButton } from "@/components/ui/ActionButton";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import AsyncSelect from "react-select/async";
import ProductGalleryUpdate from "./_components/ProductGalleryUpdate";
interface Gallery {
  id: number;
  image: string;
  title: string;
  alt: string;
  fileName: string;
  file: File | null;
}

interface Variant {
  id: number;
  name: string;
  options: string[];
}

export default function EditProductPage() {
  const [activeLang, setActiveLang] = useState<"id" | "en">("id");
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
  });

  const [variants, setVariants] = useState<Variant[]>([]);
  const [galleries, setGalleries] = useState<Gallery[]>([]);

  const [pricingType, setPricingType] = useState<"single" | "individual">("single");
  const [singlePrice, setSinglePrice] = useState("");
  const [individualPrices, setIndividualPrices] = useState<{ [key: string]: string }>({});
  const [groupPrices, setGroupPrices] = useState<{ [group: string]: string }>({});
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [openSubGroups, setOpenSubGroups] = useState<Record<string, Record<string, boolean>>>({});

  const isGroupOpen = (first: string) => openGroups[first] !== false;
  const toggleGroup = (first: string) => setOpenGroups((prev) => ({ ...prev, [first]: !isGroupOpen(first) }));
  const isSubOpen = (first: string, second: string) => openSubGroups[first]?.[second] ?? true;
  const toggleSub = (first: string, second: string) =>
    setOpenSubGroups((prev) => ({ ...prev, [first]: { ...(prev[first] || {}), [second]: !isSubOpen(first, second) } }));

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleFeatured = () => {
    setFormData((prev) => ({ ...prev, featured: !prev.featured }));
  };

  const loadCategoryOptions = useCallback(async (inputValue: string) => {
    try {
      const res = await api.get<{ status: string; data: any[] }>(`/categories`, {
        params: { status: "active", per_page: 100, search: inputValue },
      });
      const list = (res as any)?.data?.data || [];
      return list.map((cat: any) => ({
        value: cat.id,
        label: (cat.name && (cat.name.id || cat.name.en)) || cat.slug || `Category ${cat.id}`,
        image: cat.cover_url,
      }));
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/products/${id}`);
        const data = (res as any).data?.data || {};

        setFormData({
          name: data.name?.id || "",
          slug: data.slug || "",
          description: data.description?.id || "",
          category: data.category_name || "",
          category_id: data.category_id ?? null,
          price: data.price ? String(data.price) : "",
          tags: Array.isArray(data.seo_tags) ? data.seo_tags.join(", ") : "",
          keyword: data.seo_keyword || "",
          seoDescription: data.seo_description || "",
          featured: !!data.status,
        });

        setPricingType(data.pricing_mode || "single");
        if (data.pricing_mode === "single" && data.price) {
          setSinglePrice(String(data.price));
        }

        setGalleries(
          (data.gallery || []).map((g: any) => ({
            id: Number(g.id) || Date.now(),
            image: `${process.env.NEXT_PUBLIC_STORAGE_URL || ""}${g.url || ""}`,
            title: g.title || "",
            alt: g.alt || "",
            fileName: (typeof g.url === "string" && g.url.split("/").pop()) || "image.jpg",
            file: null,
          }))
        );

        setVariants(
          (data.attributes_data || []).map((v: any, index: number) => ({
            id: Number(v.id) || index + 1,
            name: v.name || "",
            options: Array.isArray(v.options) ? v.options.map((o: any) => o.value) : [],
          }))
        );

        if (Array.isArray(data.variants_data) && data.variants_data.length > 0) {
          const prices: Record<string, string> = {};
          const oneDimPrices: Record<string, string> = {};
          data.variants_data.forEach((variant: any) => {
            const label = String(variant.label || "");
            const parts = label.split(" | ");
            if (parts.length === 1) {
              oneDimPrices[parts[0]] = String(variant.price ?? "");
            } else {
              const key = parts.join("-");
              prices[key] = String(variant.price ?? "");
            }
          });
          if (Object.keys(oneDimPrices).length) setGroupPrices(oneDimPrices);
          if (Object.keys(prices).length) setIndividualPrices(prices);
        }
      } catch {
        setErrorMessage("Gagal memuat data produk");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddGallery = () => {
    const newGallery: Gallery = {
      id: Date.now(),
      image: "",
      title: "",
      alt: "",
      fileName: "",
      file: null,
    };
    setGalleries((prev) => [...prev, newGallery]);
  };

  const handleSelectGalleryImage = (
    e: React.ChangeEvent<HTMLInputElement>,
    gid: number
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setGalleries((prev) =>
      prev.map((g) => (g.id === gid ? { ...g, image: previewUrl, fileName: file.name, file } : g))
    );
  };

  const handleGalleryChange = (gid: number, field: string, value: string) => {
    setGalleries((prev) => prev.map((g) => (g.id === gid ? { ...g, [field]: value } : g)));
  };

  const handleRemoveGallery = (gid: number) => {
    setGalleries((prev) => prev.filter((g) => g.id !== gid));
  };

  const handleAddVariant = () => {
    if (variants.length >= 3) return;
    const newVariant: Variant = { id: variants.length + 1, name: "", options: [""] };
    setVariants((prev) => [...prev, newVariant]);
  };

  const handleVariantNameChange = (vid: number, name: string) => {
    setVariants((prev) => prev.map((v) => (v.id === vid ? { ...v, name } : v)));
  };

  const handleOptionChange = (variantId: number, optionIndex: number, value: string) => {
    setVariants((prev) =>
      prev.map((variant) => {
        if (variant.id !== variantId) return variant;
        const newOptions = [...variant.options];
        newOptions[optionIndex] = value;
        if (!newOptions.some((opt) => opt.trim() === "")) newOptions.push("");
        return { ...variant, options: newOptions };
      })
    );
  };

  const handleRemoveOption = (variantId: number, optionIndex: number) => {
    setVariants((prev) =>
      prev.map((variant) => {
        if (variant.id !== variantId) return variant;
        const newOptions = variant.options.filter((_, i) => i !== optionIndex);
        if (!newOptions.some((opt) => opt.trim() === "")) newOptions.push("");
        return { ...variant, options: newOptions };
      })
    );
  };

  const handleRemoveVariant = (vid: number) => {
    setVariants((prev) => prev.filter((v) => v.id !== vid));
  };

  const getValidVariants = useMemo(
    () => () => variants.filter((v) => v.options.some((opt) => opt.trim() !== "")),
    [variants]
  );

  const generateVariantCombinations = () => {
    const valids = getValidVariants();
    if (valids.length === 0) return [] as string[][];
    const combos: string[][] = [[]];
    valids.forEach((variant) => {
      const opts = variant.options.filter((o) => o.trim() !== "");
      const next: string[][] = [];
      combos.forEach((c) => opts.forEach((o) => next.push([...c, o])));
      combos.length = 0;
      combos.push(...next);
    });
    return combos;
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

  const handleUpdate = async () => {
    if (submitting) return;
    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const payload = new FormData();

      payload.append("pricing_mode", pricingType);
      payload.append("name[id]", formData.name.trim());
      payload.append("name[en]", formData.name.trim());
      payload.append("description[id]", formData.description.trim());
      payload.append("description[en]", formData.description.trim());
      payload.append("slug", formData.slug.trim());
      if (formData.category_id) payload.append("category_id", String(formData.category_id));
      if (pricingType === "single") {
        const price = singlePrice || formData.price;
        if (price) payload.append("price", String(price));
      }
      payload.append(
        "seo_tags",
        JSON.stringify(
          formData.tags
            .split(/[,\n]/)
            .map((t) => t.trim())
            .filter(Boolean)
        )
      );
      payload.append("seo_keyword", formData.keyword.trim());
      payload.append("seo_description", formData.seoDescription.trim());
      payload.append("status", String(formData.featured));

      galleries.forEach((g, index) => {
        if (g.file instanceof File) payload.append(`gallery[${index}][image]`, g.file);
        payload.append(`gallery[${index}][sort]`, String(index));
        if (g.title) payload.append(`gallery[${index}][title]`, g.title);
        if (g.alt) payload.append(`gallery[${index}][alt]`, g.alt);
      });

      let variantPayload: Array<{ labels: string[]; price: number; stock: number; active: boolean }> = [];
      if (pricingType === "individual") {
        const valids = getValidVariants();
        const combos = generateVariantCombinations();
        if (valids.length === 1) {
          // one-dimension: use groupPrices keyed by first option
          const missing: string[] = [];
          combos.forEach((comb) => {
            const label = comb[0];
            const priceValue = groupPrices[label];
            if (priceValue === undefined || priceValue === "") missing.push(label);
            else
              variantPayload.push({ labels: comb, price: Number(priceValue), stock: 0, active: true });
          });
        } else if (valids.length >= 2) {
          Object.entries(individualPrices).forEach(([key, price]) => {
            if (price !== undefined && price !== "")
              variantPayload.push({ labels: key.split("-"), price: Number(price), stock: 0, active: true });
          });
        }
      }
      if (variantPayload.length > 0) payload.append("variant_prices", JSON.stringify(variantPayload));

      await api.patch(`/products/${id}`, payload);
      setSuccessMessage("Produk berhasil diperbarui!");
      setTimeout(() => router.push("/products"), 800);
    } catch {
      setErrorMessage("Gagal memperbarui produk");
    } finally {
      setSubmitting(false);
    }
  };

  const validVariantCount = getValidVariants().length;
  const variantCombinations = generateVariantCombinations();

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Edit Product</h1>
        <div className="flex gap-3">
          <CancelButton onClick={() => router.push("/products")} />
          <CreateButton onClick={handleUpdate} disabled={submitting}>
            {submitting ? "Saving..." : "Save Changes"}
          </CreateButton>
        </div>
      </div>
      <div className="flex gap-2 mb-4">
  <button
    type="button"
    onClick={() => setActiveLang("id")}
    className={`px-3 py-1 rounded ${activeLang === "id" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"}`}
  >
    🇮🇩 Indonesia
  </button>
  <button
    type="button"
    onClick={() => setActiveLang("en")}
    className={`px-3 py-1 rounded ${activeLang === "en" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"}`}
  >
    🇬🇧 English
  </button>
</div>
      {errorMessage && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm">{errorMessage}</div>
      )}
      {successMessage && (
        <div className="bg-green-50 text-green-700 border border-green-200 rounded-lg p-3 text-sm">{successMessage}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Details</h2>

            {/* Name */}
            <div className="mb-6">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
              />
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

            {/* Description */}
            <div className="mb-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black resize-none"
                placeholder="Product description"
              />
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
                value={
                  formData.category_id
                    ? { value: formData.category_id, label: formData.category }
                    : null
                }
                formatOptionLabel={(option: any) => (
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {option.image && <img src={option.image} alt={option.label} className="w-6 h-6 rounded object-cover" />}
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
              />
            </div>

            {/* Base Price */}
            <div className="mb-6">
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                Price (Rp)
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
          </div>

          {/* Galleries */}
          <ProductGalleryUpdate
            galleries={galleries}
            onAddGallery={handleAddGallery}
            onRemoveGallery={handleRemoveGallery}
            onGalleryChange={handleGalleryChange}
          />
          {/*
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Galleries</h2>
              <button
                type="button"
                onClick={handleAddGallery}
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Add Gallery
              </button>
            </div>

            <div className="grid grid-cols-3 gap-6">
              {galleries.map((gallery) => (
                <div key={gallery.id} className="space-y-3">
                  <div className="relative group">
                    <div className="aspect-square border-2 border-gray-200 rounded-lg overflow-hidden flex items-center justify-center bg-gray-50">
                      {gallery.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={gallery.image} alt={gallery.alt} className="object-cover w-full h-full" />
                      ) : (
                        <label className="cursor-pointer text-sm text-gray-500">
                          <input
                            type="file"
                            accept="image/png, image/jpeg, image/webp"
                            className="hidden"
                            onChange={(e) => handleSelectGalleryImage(e, gallery.id)}
                          />
                          Upload Image
                        </label>
                      )}
                    </div>
                    <button
                      type="button"
                      aria-label="Remove image"
                      onClick={() => handleRemoveGallery(gallery.id)}
                      className="absolute top-2 right-2 bg-black bg-opacity-60 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-opacity-80 transition"
                    >
                      ×
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={gallery.title}
                      onChange={(e) => handleGalleryChange(gallery.id, "title", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                      placeholder="Sneakers"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alt Text</label>
                    <input
                      type="text"
                      value={gallery.alt}
                      onChange={(e) => handleGalleryChange(gallery.id, "alt", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                      placeholder="Slick formal sneaker shoes"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          */}
          {/* Pricing / Variants */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Pricing & Variants</h2>

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

                {pricingType === "single" && (
                  <div className="ml-6">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Price (Rp)</span>
                      <input
                        type="number"
                        value={singlePrice}
                        onChange={(e) => setSinglePrice(e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded text-sm text-black w-32"
                        min={0}
                      />
                    </div>
                  </div>
                )}

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

            {/* Variants editing */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700">Variant</h3>
                <button
                  type="button"
                  onClick={handleAddVariant}
                  disabled={variants.length >= 3}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    variants.length >= 3
                      ? "text-gray-400 bg-gray-100 border border-gray-200 cursor-not-allowed"
                      : "text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100"
                  }`}
                >
                  Add Variant {variants.length >= 3 ? "(Max 3)" : ""}
                </button>
              </div>

              <div className="space-y-4">
                {variants.map((variant) => (
                  <div key={variant.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <input
                        type="text"
                        value={variant.name}
                        onChange={(e) => handleVariantNameChange(variant.id, e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black flex-1"
                        placeholder={`Variant ${variant.id}`}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(variant.id)}
                        className="text-red-600 text-sm"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="space-y-2">
                      {variant.options.map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleOptionChange(variant.id, idx, e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black flex-1"
                            placeholder="Option"
                          />
                          {variant.options.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveOption(variant.id, idx)}
                              className="text-gray-500 hover:text-red-600 text-xs"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Harga per KELOMPOK (muncul hanya saat 1 dimensi varian) */}
            {pricingType === "individual" && validVariantCount === 1 && (
              <div className="space-y-4">
                {Object.keys(groupedCombinations()).map((firstOption) => (
                  <div key={firstOption} className="border border-gray-200 rounded-lg">
                    {/* Header level-1 */}
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
                    {/* Body level-1 */}
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

            {/* Harga per KOMBINASI (muncul saat >= 2 dimensi varian) */}
            {pricingType === "individual" && validVariantCount >= 2 && (
              <div className="space-y-4">
                {Object.entries(groupedCombinations()).map(([firstOption, combinations]) => (
                  <div key={firstOption} className="border border-gray-200 rounded-lg">
                    {/* Header level-1 */}
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
                    {/* Body level-1 */}
                    {isGroupOpen(firstOption) && (
                      <div className="p-4">
                        {Array.from(new Set((combinations as string[][]).map((c) => c[1])))
                          .filter(Boolean)
                          .map((secondOption) => (
                            <div key={String(secondOption)} className="mb-4">
                              {/* Sub-header level-2 */}
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
                              {/* Inputs level-2 */}
                              {isSubOpen(firstOption, String(secondOption)) && (
                                <div className="mt-3 space-y-2">
                                  {(combinations as string[][])
                                    .filter((c) => c[1] === secondOption)
                                    .map((comb, idx) => {
                                      const key = comb.join("-");
                                      return (
                                        <div key={idx} className="flex items-center gap-3 text-sm">
                                          <div className="text-gray-700 min-w-[10rem]">
                                            {comb.map((label, i) => (
                                              <span key={i}>
                                                {label}
                                                {i < comb.length - 1 ? " | " : ""}
                                              </span>
                                            ))}
                                          </div>
                                          <span className="text-gray-600">Rp</span>
                                          <input
                                            type="number"
                                            value={individualPrices[key] || ""}
                                            onChange={(e) => setIndividualPrices((prev) => ({ ...prev, [key]: e.target.value }))}
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
        </div>

        {/* Right */}
        <div className="space-y-6">
          {/* SEO */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">SEO</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <textarea
                rows={2}
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                placeholder="summer, men, sport"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">SEO Keyword</label>
              <input
                type="text"
                name="keyword"
                value={formData.keyword}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">SEO Description</label>
              <textarea
                rows={3}
                name="seoDescription"
                value={formData.seoDescription}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
              />
            </div>
          </div>

          
        </div>
      </div>
    </div>
  );
}
