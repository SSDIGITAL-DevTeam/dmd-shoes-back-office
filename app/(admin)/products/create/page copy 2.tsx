"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/fetching";
import { CreateButton, CancelButton } from "@/components/ui/ActionButton";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { DeleteButton as DeleteIcon } from "@/components/ui/DeleteIcon";

interface Gallery {
    id: number;
    image: string;
    title: string;
    alt: string;
    fileName: string;
}

interface Variant {
    id: number;
    name: string;
    options: string[];
}

export default function CreateProductPage() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        description: "",
        category: "",
        price: "",
        tags: "",
        keyword: "",
        seoDescription: "",
        featured: false,
    });

    const [categories] = useState([
        { id: 6, name: "test" },
        { id: 2, name: "Sandal" },
        { id: 3, name: "Boots" },
    ]);

    const [galleries, setGalleries] = useState<Gallery[]>([]);
    const [variants, setVariants] = useState<Variant[]>([]);

    const [pricingType, setPricingType] = useState<"single" | "individual">("individual");
    const [singlePrice, setSinglePrice] = useState("");

    // ── NEW: harga per kelompok (satu dimensi varian saja)
    const [groupPrices, setGroupPrices] = useState<{ [group: string]: string }>({});

    // Harga per kombinasi (≥2 dimensi varian)
    const [individualPrices, setIndividualPrices] = useState<{ [key: string]: string }>({});

    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
    const [openSubGroups, setOpenSubGroups] = useState<Record<string, Record<string, boolean>>>({});

    const isGroupOpen = (first: string) => openGroups[first] !== false; // undefined => open
    const toggleGroup = (first: string) =>
        setOpenGroups((prev) => ({ ...prev, [first]: !isGroupOpen(first) }));

    const isSubOpen = (first: string, second: string) =>
        (openSubGroups[first]?.[second] ?? true);

    const toggleSub = (first: string, second: string) =>
        setOpenSubGroups((prev) => ({
            ...prev,
            [first]: { ...(prev[first] || {}), [second]: !isSubOpen(first, second) },
        }));

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleToggleFeatured = () => {
        setFormData((prev) => ({
            ...prev,
            featured: !prev.featured,
        }));
    };

    const parseNumber = (value: string | number | null | undefined) => {
        if (value === null || value === undefined || value === "") return null;
        const numeric = typeof value === "number" ? value : Number(value);
        return Number.isFinite(numeric) ? numeric : null;
    };

    const isRealGalleryImage = (src: string) => Boolean(src && !src.startsWith("/api/placeholder"));


    const handleCreate = async () => {
        if (submitting) return;

        setErrorMessage(null);
        setSuccessMessage(null);

        const name = formData.name.trim();
        const slug = formData.slug.trim();
        const description = formData.description.trim();
        const categoryEntry = categories.find((c) => c.name === formData.category);

        const errors: string[] = [];
        if (!name) errors.push("Nama produk wajib diisi.");
        if (!slug) errors.push("Slug wajib diisi.");
        if (!description) errors.push("Deskripsi wajib diisi.");
        if (!categoryEntry) errors.push("Kategori wajib dipilih.");

        const pricingMode = pricingType === "single" ? "single" : "per_variant";
        const rootPriceValue =
            pricingMode === "single"
                ? parseNumber(singlePrice || formData.price)
                : parseNumber(formData.price);

        if (pricingMode === "single" && rootPriceValue == null) {
            errors.push("Harga produk wajib diisi.");
        }

        const validVariants = getValidVariants();
        const variantCombinations = generateVariantCombinations();

        if (pricingMode === "per_variant" && validVariants.length === 0) {
            errors.push("Tambahkan minimal satu varian untuk menggunakan harga individual.");
        }

        if (
            pricingMode === "per_variant" &&
            validVariants.length > 0 &&
            variantCombinations.length === 0
        ) {
            errors.push("Lengkapi opsi varian sebelum menyimpan.");
        }

        if (errors.length > 0) {
            setErrorMessage(errors[0]);
            return;
        }

        setSubmitting(true);

        try {
            const attributes = validVariants
                .map((variant, index) => {
                    const options = variant.options.map((option) => option.trim()).filter(Boolean);
                    if (options.length === 0) {
                        return null;
                    }
                    const variantName = variant.name.trim() || `Variant ${index + 1}`;
                    return { name: variantName, options };
                })
                .filter(Boolean) as { name: string; options: string[] }[];
                const seoTags = formData.tags
                .split(/[,\n]/)
                .map((tag) => tag.trim())
                .filter(Boolean);

            const galleryPayload = galleries
                .map((gallery, index) => ({
                    image: gallery.image,
                    title: gallery.title || undefined,
                    alt: gallery.alt || undefined,
                    sort: index,
                }))
                .filter((item) => isRealGalleryImage(item.image));

            const variantPricesPayload: {
                labels: string[];
                price: number;
                stock: number;
                active: boolean;
            }[] = [];

            if (pricingMode === "per_variant" && variantCombinations.length > 0) {
                const missingPrices: string[] = [];

                if (validVariants.length === 1) {
                    variantCombinations.forEach((combination) => {
                        const label = combination[0];
                        const priceValue = parseNumber(groupPrices[label]);
                        if (priceValue == null) {
                            missingPrices.push(label);
                        } else {
                            variantPricesPayload.push({
                                labels: combination,
                                price: priceValue,
                                stock: 0,
                                active: true,
                            });
                        }
                    });
                } else {
                    variantCombinations.forEach((combination) => {
                        const key = combination.join("-");
                        const priceValue = parseNumber(individualPrices[key]);
                        if (priceValue == null) {
                            missingPrices.push(combination.join(" | "));
                        } else {
                            variantPricesPayload.push({
                                labels: combination,
                                price: priceValue,
                                stock: 0,
                                active: true,
                            });
                        }
                    });
                }

                if (missingPrices.length > 0) {
                    setErrorMessage(
                        `Lengkapi harga untuk kombinasi varian: ${missingPrices.join(", ")}`
                    );
                    return;
                }
            }

            const payload: Record<string, any> = {
                status: formData.featured,
                category_id: categoryEntry?.id,
                pricing_mode: pricingMode,
                name: {
                    id: name,
                    en: name,
                },
                description: {
                    id: description,
                    en: description,
                },
                slug,
                seo_tags: seoTags,
                seo_keyword: formData.keyword.trim() || undefined,
                seo_description: formData.seoDescription.trim() || undefined,
                stock: 0,
            };

            if (rootPriceValue != null) {
                payload.price = rootPriceValue;
            }

            if (attributes.length > 0) {
                payload.attributes = attributes;
            }

            if (galleryPayload.length > 0) {
                payload.gallery = galleryPayload;
            }

            if (pricingMode === "per_variant" && variantPricesPayload.length > 0) {
                payload.variant_prices = variantPricesPayload;
            }

            const response = await api.post("/products", payload);
            const message =
                (response.data as any)?.message || "Produk berhasil dibuat.";
            setSuccessMessage(message);
            setTimeout(() => {
                router.push("/products");
            }, 800);
        } catch (error: any) {
            const response = error?.response?.data;
            if (response?.errors) {
                const messages = Object.values(response.errors)
                    .flat()
                    .map((msg: unknown) => String(msg));
                setErrorMessage(
                    messages.length ? messages.join(", ") : response.message || "Gagal membuat produk."
                );
            } else {
                setErrorMessage(response?.message || error?.message || "Gagal membuat produk.");
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        router.push("/products");
    };

    const handleGalleryChange = (id: number, field: string, value: string) => {
        setGalleries((prev) =>
            prev.map((g) => (g.id === id ? { ...g, [field]: value } : g))
        );
    };

    const handleRemoveGallery = (id: number) => {
        setGalleries((prev) => prev.filter((g) => g.id !== id));
    };

    const handleAddGallery = () => {
        const newGallery = {
            id: galleries.length + 1,
            image: "/api/placeholder/150/150",
            title: "",
            alt: "",
            fileName: "file_name.jpg",
        };
        setGalleries((prev) => [...prev, newGallery]);
    };

    const handleAddVariant = () => {
        if (variants.length >= 3) return;
        const newVariant: Variant = { id: variants.length + 1, name: "", options: [""] };
        setVariants((prev) => [...prev, newVariant]);
    };

    const handleVariantNameChange = (id: number, name: string) => {
        setVariants((prev) => prev.map((v) => (v.id === id ? { ...v, name } : v)));
    };

    const handleOptionChange = (variantId: number, optionIndex: number, value: string) => {
        setVariants((prev) =>
            prev.map((variant) => {
                if (variant.id !== variantId) return variant;
                const newOptions = [...variant.options];
                newOptions[optionIndex] = value;
                // sisakan 1 opsi kosong di akhir
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

    const handleRemoveVariant = (id: number) => {
        setVariants((prev) => prev.filter((v) => v.id !== id));
    };

    const handleIndividualPriceChange = (key: string, price: string) => {
        setIndividualPrices((prev) => ({ ...prev, [key]: price }));
    };

    // ── Helpers untuk varian valid
    const getValidVariants = useMemo(
        () => () => variants.filter((v) => v.options.some((opt) => opt.trim() !== "")),
        [variants]
    );

    const validVariantCount = getValidVariants().length;

    // ── Bersihkan harga per-kelompok ketika jumlah dimensi varian ≠ 1
    useEffect(() => {
        if (validVariantCount !== 1 && Object.keys(groupPrices).length > 0) {
            setGroupPrices({});
        }
    }, [validVariantCount]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Kombinasi varian
    const generateVariantCombinations = () => {
        const validVariants = getValidVariants();
        if (validVariants.length === 0) return [];

        const combinations: string[][] = [[]];
        validVariants.forEach((variant) => {
            const opts = variant.options.filter((o) => o.trim() !== "");
            const next: string[][] = [];
            combinations.forEach((c) => opts.forEach((o) => next.push([...c, o])));
            combinations.length = 0;
            combinations.push(...next);
        });
        return combinations;
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

    const formatDescription = (fmt: string) => console.log("Formatting:", fmt);

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
            <div className="bg-white border-b border-gray-200 px-6 py-6">
                <h1 className="text-2xl font-semibold text-gray-900">New Product</h1>
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
                                        placeholder=""
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
                                    <div className="border border-gray-300 rounded-t-lg bg-gray-50 px-3 py-2 flex items-center gap-2">
                                        <button type="button" onClick={() => formatDescription("bold")} className="p-1.5 hover:bg-gray-200 rounded font-bold text-sm">
                                            B
                                        </button>
                                        <button type="button" onClick={() => formatDescription("italic")} className="p-1.5 hover:bg-gray-200 rounded italic text-sm">
                                            I
                                        </button>
                                        <button type="button" onClick={() => formatDescription("underline")} className="p-1.5 hover:bg-gray-200 rounded underline text-sm">
                                            U
                                        </button>
                                    </div>
                                    <textarea
                                        id="description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        rows={8}
                                        className="w-full px-3 py-2 border border-gray-300 border-t-0 rounded-b-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black resize-none"
                                        placeholder="Product description"
                                    />
                                </div>

                                {/* Category */}
                                <div className="mb-6">
                                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                                        Category <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="category"
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white text-black"
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map((c) => (
                                            <option key={c.id} value={c.name}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Base Price (opsional / tidak dipakai untuk varian) */}
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
                            </div>

                            {/* Galleries */}
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
                                                <div className="aspect-square border-2 border-gray-800 rounded-lg overflow-hidden bg-gray-100 p-2">
                                                    <img
                                                        src={gallery.image}
                                                        alt={gallery.alt}
                                                        className="w-full h-full object-cover rounded"
                                                        onError={(e) => {
                                                            e.currentTarget.src =
                                                                "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiNGM0Y0RjYiLz48cGF0aCBkPSJNMjAgMzBDMjYuNjI3NCAzMCAzMCAyNi42Mjc0IDMwIDIwQzMwIDEzLjM3MjYgMjYuNjI3NCAxMCAyMCAxMEMxMy4zNzI2IDEwIDEwIDEzLjM3MjYgMTAgMjBDMTAgMjYuNjI3NiAxMy4zNzI2IDMwIDIwIDMwWiIgc3Ryb2tlPSIjOUNBM0FGIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNMjAgMjRDMjIuMjA5MSAyNCAyNCAyMi4yMDkxIDI0IDIwQzI0IDE3Ljc5MDkgMjIuMjA5MSAxNiAyMCAxNkMxNy43OTA5IDE2IDE2IDE3Ljc5MDkgMTYgMjBDMTYgMjIuMjA5MSAxNy43OTA5IDI0IDIwIDI0WiIgc3Ryb2tlPSIjOUNBM0FGIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=";
                                                        }}
                                                    />
                                                </div>
                                                <div className="absolute top-1 left-1 right-1 flex items-center justify-between bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                                                    <div>
                                                        <div className="flex items-center gap-1">
                                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                <path
                                                                    fillRule="evenodd"
                                                                    d="M3 4a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm5 3a2 2 0 11-4 0 2 2 0 014 0zm7.5 7.5l-3-3-1.5 1.5-3-3L3 13.5V16h14v-1.5z"
                                                                    clipRule="evenodd"
                                                                />
                                                            </svg>
                                                            <span>{gallery.fileName}</span>
                                                        </div>
                                                        <div className="text-gray-300 text-xs">316 KB</div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveGallery(gallery.id)}
                                                        className="text-white hover:text-red-300 ml-2"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
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

                            {/* Variants */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-semibold text-gray-900">Variant</h2>
                                    <button
                                        type="button"
                                        onClick={handleAddVariant}
                                        disabled={variants.length >= 3}
                                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${variants.length >= 3
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
                                                    <span className="text-sm font-medium text-gray-700">Variant {variantIndex + 1}</span>
                                                    <input
                                                        type="text"
                                                        value={variant.name}
                                                        onChange={(e) => handleVariantNameChange(variant.id, e.target.value)}
                                                        className="px-3 py-1 border border-gray-300 rounded text-sm text-black bg-white"
                                                        placeholder="Variant name (e.g., Bahan, Warna)"
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
                                                                value={option}
                                                                onChange={(e) => handleOptionChange(variant.id, optionIndex, e.target.value)}
                                                                className="px-3 py-1 border border-gray-300 rounded text-sm text-black bg-white w-24"
                                                                placeholder={optionIndex === variant.options.length - 1 ? "Input here" : "Option"}
                                                            />
                                                            {variant.options.length > 1 && option.trim() !== "" && (
                                                                <button type="button"
                                                                    onClick={() => handleRemoveOption(variant.id, optionIndex)}
                                                                    className="text-red-500 hover:text-red-700 text-sm w-4 h-4 flex items-center justify-center">
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

                                {/* Product Variant Pricing */}
                                {variants.some((v) => v.options.some((o) => o.trim() !== "")) && (
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
                                                                <svg
                                                                    className={`w-4 h-4 transition-transform ${isGroupOpen(firstOption) ? "" : "rotate-180"}`}
                                                                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                                                >
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
                                                                        onChange={(e) =>
                                                                            setGroupPrices((prev) => ({ ...prev, [firstOption]: e.target.value }))
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

                                        {/* Harga per KOMBINASI (muncul saat ≥2 dimensi varian) */}
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
                                                                <svg
                                                                    className={`w-4 h-4 transition-transform ${isGroupOpen(firstOption) ? "" : "rotate-180"}`}
                                                                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                                                >
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                </svg>
                                                            </button>
                                                        </div>

                                                        {/* Body level-1 */}
                                                        {isGroupOpen(firstOption) && (
                                                            <div className="p-4">
                                                                {Array.from(new Set(combinations.map((c) => c[1])))
                                                                    .filter(Boolean)
                                                                    .map((secondOption) => (
                                                                        <div key={secondOption} className="mb-4">
                                                                            {/* Sub-header level-2 */}
                                                                            <div className="bg-gray-100 px-3 py-2 border border-gray-200 rounded flex items-center justify-between">
                                                                                <h6 className="font-medium text-gray-800">{secondOption}</h6>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => toggleSub(firstOption, String(secondOption))}
                                                                                    className="text-gray-400 hover:text-gray-600"
                                                                                    aria-label={`Toggle ${firstOption} - ${secondOption}`}
                                                                                >
                                                                                    <svg
                                                                                        className={`w-4 h-4 transition-transform ${isSubOpen(firstOption, String(secondOption)) ? "" : "rotate-180"}`}
                                                                                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                                                                    >
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                                    </svg>
                                                                                </button>
                                                                            </div>

                                                                            {/* Body level-2 */}
                                                                            {isSubOpen(firstOption, String(secondOption)) && (
                                                                                <div className="mt-2 space-y-2">
                                                                                    {combinations
                                                                                        .filter((c) => c[1] === secondOption)
                                                                                        .map((combination, idx) => {
                                                                                            const key = combination.join("-");
                                                                                            const thirdOption = combination[2];
                                                                                            return (
                                                                                                <div key={`${key}-${idx}`} className="flex items-center gap-3 text-sm">
                                                                                                    <span className="w-24 text-gray-600">{thirdOption || "Price"}</span>
                                                                                                    <span className="text-gray-500">Rp</span>
                                                                                                    <input
                                                                                                        type="number"
                                                                                                        value={individualPrices[key] || ""}
                                                                                                        onChange={(e) => handleIndividualPriceChange(key, e.target.value)}
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

                        {/* Right - SEO */}
                        <div className="space-y-6">
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
                                    <label htmlFor="keyword" className="block text-sm font-medium text-gray-700 mb-2">
                                        Keyword
                                    </label>
                                    <input
                                        type="text"
                                        id="keyword"
                                        name="keyword"
                                        value={formData.keyword}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                                        placeholder="SEO keywords"
                                    />
                                </div>

                                <div className="mb-6">
                                    <label htmlFor="seoDescription" className="block text-sm font-medium text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        id="seoDescription"
                                        name="seoDescription"
                                        value={formData.seoDescription}
                                        onChange={handleInputChange}
                                        rows={6}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black resize-none"
                                        placeholder="SEO description"
                                    />
                                </div>
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