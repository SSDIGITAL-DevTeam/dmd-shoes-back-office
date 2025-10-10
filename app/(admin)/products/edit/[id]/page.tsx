"use client";
import { v7 as uuidv7 } from 'uuid';
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/fetching";
import { CreateButton, CancelButton } from "@/components/ui/ActionButton";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import AsyncSelect from "react-select/async";
import ProductGalleryUpdate from "./_components/ProductGalleryUpdate";
import VariantCard from "./_components/VariantCardUpdate";
interface Gallery {
  id: number;
  image: string;
  title_id?: string;
  title_en?: string;
  alt_id?: string;
  alt_en?: string;
  fileName: string;
  file: File | null;
}

interface LangText { id: string; en: string }
interface Variant {
  id: number;
  name: LangText;
  options: LangText[];
}

export default function EditProductPage() {
  const [activeLang, setActiveLang] = useState<"id" | "en">("en");
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name_id: "",
    name_en: "",
    slug: "",
    description_id: "",
    description_en: "",
    category: "",
    category_id: null as number | null,
    price: "",
    stock: "",
    heel_height_cm: "",
    tags: "",
    keyword_id: "",
    keyword_en: "",
    seoDescription_id: "",
    seoDescription_en: "",
    featured: false,
  });
// Safely coerce any value to trimmed string
const text = (v: any) => (v === null || v === undefined ? "" : String(v)).trim();

// Get label text that may be string or {id,en}
const labelText = (lbl: any) =>
  typeof lbl === "string" ? text(lbl) : text(lbl?.en || lbl?.id || "");

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
          name_id: data.name?.id || "",
          name_en: data.name?.en || "",
          slug: data.slug || "",
          description_id: data.description?.id || "",
          description_en: data.description?.en || "",
          category: data.category_name || "",
          category_id: data.category_id ?? null,
          price: data.price ? String(data.price) : "",
          stock: data.stock ? String(data.stock) : "",
          heel_height_cm: data.heel_height_cm ? String(data.heel_height_cm) : "",
          tags: Array.isArray(data.seo_tags) ? data.seo_tags.join(", ") : "",
          keyword_id: (typeof data.seo_keyword === 'object' ? data.seo_keyword?.id : data.seo_keyword) || "",
          keyword_en: (typeof data.seo_keyword === 'object' ? data.seo_keyword?.en : data.seo_keyword) || "",
          seoDescription_id: (typeof data.seo_description === 'object' ? data.seo_description?.id : data.seo_description) || "",
          seoDescription_en: (typeof data.seo_description === 'object' ? data.seo_description?.en : data.seo_description) || "",
          featured: !!data.featured,
        });

        setPricingType(data.pricing_mode || "single");
        if (data.pricing_mode === "single" && data.price) {
          setSinglePrice(String(data.price));
        }

        setGalleries(
          (data.gallery || []).map((g: any) => ({
            id: Number(g.id) || Date.now(),
            image: `${g.url || ""}`,
           // image: `${process.env.NEXT_PUBLIC_STORAGE_URL || ""}${g.url || ""}`,
            title_id: typeof g.title === 'object' ? (g.title?.id || "") : (g.title || ""),
            title_en: typeof g.title === 'object' ? (g.title?.en || "") : (g.title || ""),
            alt_id: typeof g.alt === 'object' ? (g.alt?.id || "") : (g.alt || ""),
            alt_en: typeof g.alt === 'object' ? (g.alt?.en || "") : (g.alt || ""),
            fileName: (typeof g.url === "string" && g.url.split("/").pop()) || "image.jpg",
            file: null,
          }))
        );
        console.log("data.attributes_data",data.attributes_data)
       // {JSON.stringify()}
       setVariants(
        (data.attributes_data || []).map((v: any, index: number) => ({
          id: Number(v.id) || index + 1,
          name: {
            id: text(v.name?.id || v.name),
            en: text(v.name?.en || v.name),
          },
          options: Array.isArray(v.options)
            ? v.options.map((o: any) => ({
                // 👉 ambil dari o.value.{id|en}, bukan o.id (angka)
                id:o.id,
                label:{
                  id: text(o.value?.id ?? o.value),
                  en: text(o.value?.en ?? o.value?.id ?? o.value),
                }
              
              }))
            : [],
        }))
      );

        // Cover preview (try cover_url then cover path)
        if (data.cover_url) {
          setCoverPreview(String(data.cover_url));
        } else if (data.cover) {
          setCoverPreview(`${process.env.NEXT_PUBLIC_STORAGE_URL || ""}${data.cover}`);
        }
       
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

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>("");

  const handleAddGallery = () => {
    const newGallery: Gallery = {
      id: Date.now(),
      image: "",
      title_id: "",
      title_en: "",
      alt_id: "",
      alt_en: "",
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
    const newVariant: Variant = { id: variants.length + 1, name: { id: "", en: "" }, options: [{id:uuidv7(),label:{ id: "", en: "" }}] };
    setVariants((prev) => [...prev, newVariant]);
  };

  const handleVariantNameChange = (vid: number, value: string, lang: "id" | "en") => {
    setVariants((prev) => prev.map((v) => (v.id === vid ? { ...v, name: { ...v.name, [lang]: value } } : v)));
  };

  // const handleOptionChange = (variantId: number, optionIndex: number, value: string, lang: "id" | "en") => {
  //   setVariants((prev) =>
  //     prev.map((variant) => {
  //       if (variant.id !== variantId) return variant;
  //       const newOptions = variant.options.map((o, i) => (i === optionIndex ? { ...o, [lang]: value } : o));
  //       // ensure 1 empty option at the end
  //       const hasEmpty = newOptions.some((opt) => (opt.id || opt.en).trim() === "");
  //       const finalOptions = hasEmpty ? newOptions : [...newOptions, { id: "", en: "" }];
  //       return { ...variant, options: finalOptions };
  //     })
  //   );
  // };

  const handleOptionChange = (
    variantId: number,
    optionIndex: number,
    value: string,
    lang: string
  ) => {
    setVariants((prev) =>
      prev.map((variant) => {
        if (variant.id !== variantId) return variant;
  
        // Update hanya teks label
        const updatedOptions = variant.options.map((option, i) =>
          i === optionIndex
            ? {
                ...option,
                label: {
                  ...option.label,
                  [lang]: value,
                },
              }
            : option
        );
  
        return { ...variant, options: updatedOptions };
      })
    );
  };
  const handleOptionAdd = (variantId: number) => {
    setVariants((prev) =>
      prev.map((variant) => {
        if (variant.id !== variantId) return variant;
  
        const newOption = {
          id:uuidv7(),
          label: { id: "", en: "" },
        };
  
        return {
          ...variant,
          options: [...variant.options, newOption],
        };
      })
    );
  };

  const handleRemoveOption = (variantId: number, optionIndex: number) => {
    setVariants((prev) =>
      prev.map((variant) => {
        if (variant.id !== variantId) return variant;
        const newOptions = variant.options.filter((_, i) => i !== optionIndex);
        if (!newOptions.some((opt) => (opt?.label?.id || opt?.label?.en)?.trim() === "")) newOptions.push({ id: "", en: "" });
        return { ...variant, options: newOptions };
      })
    );
  };

  const handleRemoveVariant = (vid: number) => {
    setVariants((prev) => prev.filter((v) => v.id !== vid));
  };

  const getValidVariants = useMemo(
    () => () =>
      variants.filter((v) =>
        v.options.some((opt) => {
          const idLabel = opt?.label?.id?.trim?.() || "";
          const enLabel = opt?.label?.en?.trim?.() || "";
          return idLabel !== "" || enLabel !== "";
        })
      ),
    [variants]
  );

  const generateVariantCombinations = () => {
    const valids = getValidVariants();
    if (!valids.length) return [] as string[][];
  
    let combos: string[][] = [[]];
  
    valids.forEach((variant) => {
      const opts = (variant.options || [])
        .map((o) => {
          const idLabel = o?.label?.id?.trim?.() || "";
          const enLabel = o?.label?.en?.trim?.() || "";
          return activeLang === "id" ? idLabel || enLabel : enLabel || idLabel;
        })
        .filter((label) => label !== ""); // pastikan tidak ada label kosong
  
      if (!opts.length) return; // skip jika varian tidak punya opsi valid
  
      const next: string[][] = [];
      combos.forEach((combo) => {
        opts.forEach((opt) => next.push([...combo, opt]));
      });
  
      combos = next;
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
  const handleIndividualPriceChange = (key: string, price: string) => {
    setIndividualPrices((prev) => ({ ...prev, [key]: price }));
  };
  const handleUpdate = async () => {
    if (submitting) return;
    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const payload = new FormData();

      payload.append("pricing_mode", pricingType);
      payload.append("name[id]", formData.name_id.trim());
      payload.append("name[en]", formData.name_en.trim());
      payload.append("description[id]", formData.description_id.trim());
      payload.append("description[en]", formData.description_en.trim());
      payload.append("slug", formData.slug.trim());
      if (formData.category_id) payload.append("category_id", String(formData.category_id));
      if (formData.stock) payload.append("stock", String(formData.stock));
      if (formData.heel_height_cm) payload.append("heel_height_cm", String(formData.heel_height_cm));
      if (pricingType === "single") {
        const price = singlePrice || formData.price;
        if (price) payload.append("price", String(price));
      }
      // attributes (variants definition)
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
        payload.append(`attributes[${i}][name][id]`, attr.name.id);
        payload.append(`attributes[${i}][name][en]`, attr.name.en);
        attr.options.forEach((opt, j) => {
          payload.append(`attributes[${i}][options][${j}][id]`, opt.id);
          payload.append(`attributes[${i}][options][${j}][en]`, opt.en);
        });
      });
      // seo_tags[]
      formData.tags
        .split(/[,\n]/)
        .map((t) => t.trim())
        .filter(Boolean)
        .forEach((tag, i) => payload.append(`seo_tags[${i}]`, tag));
      if (formData.keyword_id) payload.append("seo_keyword[id]", formData.keyword_id.trim());
      if (formData.keyword_en) payload.append("seo_keyword[en]", formData.keyword_en.trim());
      if (formData.seoDescription_id) payload.append("seo_description[id]", formData.seoDescription_id.trim());
      if (formData.seoDescription_en) payload.append("seo_description[en]", formData.seoDescription_en.trim());
      //payload.append("featured", formData.featured ? "1" : "0");
      payload.append("featured", formData.featured ? "1" : "0");
      if (coverFile instanceof File) {
        payload.append("cover", coverFile);
      }

      galleries.forEach((g, index) => {
        if (g.file instanceof File) payload.append(`gallery[${index}][image]`, g.file);
        payload.append(`gallery[${index}][sort]`, String(index));
        if (g.title_id) payload.append(`gallery[${index}][title][id]`, g.title_id);
        if (g.title_en) payload.append(`gallery[${index}][title][en]`, g.title_en);
        if (g.alt_id) payload.append(`gallery[${index}][alt][id]`, g.alt_id);
        if (g.alt_en) payload.append(`gallery[${index}][alt][en]`, g.alt_en);
      });

      type VPrice = { labels: { id: string; en: string }[]; price: number; stock: number; active: boolean; size_eu?: number };
      const variantPricesPayload: VPrice[] = [];
      if (pricingType === "individual") {
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

        if (valid.length === 1) {
          optionCombos.forEach((combination) => {
            const opt = combination[0];
            const display = opt.en || opt.id;
            const priceValue = Number(groupPrices[display]);
            if (!Number.isNaN(priceValue)) {
              const v0 = valid[0];
              const label = {
                id: `${v0.name.id || v0.name.en}: ${opt.id || opt.en}`,
                en: `${v0.name.en || v0.name.id}: ${opt.en || opt.id}`,
              };
              const payloadItem: VPrice = { labels: [label], price: priceValue, stock: 0, active: true };
              const numericSize = Number(opt.en || opt.id);
              if (!Number.isNaN(numericSize)) payloadItem.size_eu = numericSize;
              variantPricesPayload.push(payloadItem);
            }
          });
        } else if (valid.length >= 2) {
          Object.entries(individualPrices).forEach(([key, price]) => {
            if (price === undefined || price === "") return;
            const enParts = key.split("-");
            const labels = enParts.map((enLabel, idx) => {
              const v = valid[idx];
              const matched = v.options.find((o) => (o.en || o.id) === enLabel) || { id: enLabel, en: enLabel };
              return {
                id: `${v.name.id || v.name.en}: ${matched.id || matched.en}`,
                en: `${v.name.en || v.name.id}: ${matched.en || matched.id}`,
              };
            });
            variantPricesPayload.push({ labels, price: Number(price), stock: 0, active: true });
          });
        }
      }
      variantPricesPayload.forEach((vp, i) => {
        vp.labels.forEach((label, j) => {
          payload.append(`variant_prices[${i}][labels][${j}][id]`, label.id);
          payload.append(`variant_prices[${i}][labels][${j}][en]`, label.en);
        });
        payload.append(`variant_prices[${i}][price]`, String(vp.price));
        payload.append(`variant_prices[${i}][stock]`, String(vp.stock));
        payload.append(`variant_prices[${i}][active]`, vp.active ? "1" : "0");
        if (vp.size_eu != null) payload.append(`variant_prices[${i}][size_eu]`, String(vp.size_eu));
      });
     // alert(JSON.stringify(payload))
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

            {/* Name (multilingual) */}
            <div className="mb-6">
              <label htmlFor={activeLang === "id" ? "name_id" : "name_en"} className="block text-sm font-medium text-gray-700 mb-2">
                Name ({activeLang.toUpperCase()}) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id={activeLang === "id" ? "name_id" : "name_en"}
                name={activeLang === "id" ? "name_id" : "name_en"}
                value={activeLang === "id" ? formData.name_id : formData.name_en}
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

            {/* Description (multilingual) */}
            <div className="mb-6">
              <label htmlFor={activeLang === "id" ? "description_id" : "description_en"} className="block text-sm font-medium text-gray-700 mb-2">
                Description ({activeLang.toUpperCase()}) <span className="text-red-500">*</span>
              </label>
              <textarea
                id={activeLang === "id" ? "description_id" : "description_en"}
                name={activeLang === "id" ? "description_id" : "description_en"}
                value={activeLang === "id" ? formData.description_id : formData.description_en}
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

            {/* Stock */}
            <div className="mb-6 grid grid-cols-2 gap-4">
             
              <div>
                <label htmlFor="heel_height_cm" className="block text-sm font-medium text-gray-700 mb-2">
                  Heel Height (cm)
                </label>
                <input
                  type="number"
                  id="heel_height_cm"
                  name="heel_height_cm"
                  value={formData.heel_height_cm}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                  min={0}
                  step={0.1}
                />
              </div>
            </div>
          </div>

          {/* Cover */}
          <div className="hidden bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Cover</h2>
            <div className="flex items-center gap-4">
              {coverPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverPreview} alt="Cover" className="w-24 h-24 object-cover rounded border" />
              ) : (
                <div className="w-24 h-24 rounded border border-dashed border-gray-300 flex items-center justify-center text-gray-400">No cover</div>
              )}
              <label className="px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded cursor-pointer text-sm">
                Replace Cover
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setCoverFile(file);
                    setCoverPreview(URL.createObjectURL(file));
                  }}
                />
              </label>
            </div>
          </div>

          {/* Galleries */}
          <ProductGalleryUpdate
            galleries={galleries}
            onAddGallery={handleAddGallery}
            onRemoveGallery={handleRemoveGallery}
            onGalleryChange={handleGalleryChange}
            activeLang={activeLang}
          />

                         <VariantCard 
  language={activeLang}
  variants={variants}
  pricingType={pricingType}
  groupPrices={groupPrices}
  individualPrices={individualPrices}
  validVariantCount={validVariantCount}
  groupedCombinations={groupedCombinations}
  isGroupOpen={isGroupOpen}
  toggleGroup={toggleGroup}
  isSubOpen={isSubOpen}
  toggleSub={toggleSub}
  handleAddVariant={handleAddVariant}
  handleRemoveVariant={handleRemoveVariant}
  handleVariantNameChange={handleVariantNameChange}
  handleOptionChange={handleOptionChange}
  handleOptionAdd={handleOptionAdd}
  handleRemoveOption={handleRemoveOption}
  setPricingType={setPricingType}
  setGroupPrices={setGroupPrices}
  handleIndividualPriceChange={handleIndividualPriceChange}
/>
      
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
              <label className="block text-sm font-medium text-gray-700 mb-2">SEO Keyword ({activeLang.toUpperCase()})</label>
              <input
                type="text"
                name={activeLang === "id" ? "keyword_id" : "keyword_en"}
                value={activeLang === "id" ? formData.keyword_id : formData.keyword_en}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">SEO Description ({activeLang.toUpperCase()})</label>
              <textarea
                rows={3}
                name={activeLang === "id" ? "seoDescription_id" : "seoDescription_en"}
                value={activeLang === "id" ? formData.seoDescription_id : formData.seoDescription_en}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
              />
            </div>
          </div>

          
        </div>
      </div>
      {/* {JSON.stringify(variants)}
      <div>
        Individual Price
        {JSON.stringify(individualPrices)}
      </div> */}
   

    </div>
  );
}

