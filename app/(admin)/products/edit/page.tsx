"use client";

import React, { useEffect, useMemo, useState } from "react";
import { DraftButton, CancelButton, DeleteButton } from "@/components/ui/ActionButton";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { DeleteButton as DeleteIcon } from "@/components/ui/DeleteIcon";

type Status = "active" | "inactive";

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

export default function EditProductPage() {
    // Prefilled product data (simulasi)
    const [formData, setFormData] = useState({
        name: "Slick formal sneaker shoes",
        slug: "slick-formal-sneaker-shoes",
        description:
            "Step into style and comfort with the Air Force 1 Sneakers - classic state-heavy design meets everyday streetwear vibes sneaker shoes Lorem ipsum dolor sit amet consectetur. Mauris justo nunc amet vulputate id venenatis. Lorem ullamcorper pretium nisi lacinia vulputate sodales amet fermentum vel Lorem ipsum dolor sit amet consectetur.",
        category: "Sepatu",
        price: "399000",
        tags: "Slick formal sneaker shoes",
        keyword: "Slick formal sneaker shoes",
        seoDescription:
            "Step into style and comfort with the Air Force 1 Sneakers - classic state-heavy design meets everyday streetwear vibes sneaker shoes Lorem ipsum dolor sit amet consectetur. Mauris justo nunc amet vulputate id venenatis. Lorem ullamcorper pretium nisi lacinia vulputate sodales amet fermentum vel Lorem ipsum dolor sit amet consectetur. Lorem ipsum dolor sit amet consectetur. Mauris justo nunc amet vulputate id venenatis.",
        status: "active" as Status,
        featured: false,
    });

    const [categories] = useState([
        { id: 1, name: "Sepatu" },
        { id: 2, name: "Sandal" },
        { id: 3, name: "Boots" },
    ]);

    const [galleries, setGalleries] = useState<Gallery[]>([
        { id: 1, image: "/api/placeholder/150/150", title: "Sneakers", alt: "Slick formal sneaker shoes", fileName: "file_name.jpg" },
        { id: 2, image: "/api/placeholder/150/150", title: "Sneakers", alt: "Slick formal sneaker shoes", fileName: "file_name.jpg" },
        { id: 3, image: "/api/placeholder/150/150", title: "Sneakers", alt: "Slick formal sneaker shoes", fileName: "file_name.jpg" },
    ]);

    const [variants, setVariants] = useState<Variant[]>([
        { id: 1, name: "Bahan", options: ["Grade A", "Grade B", ""] },
        { id: 2, name: "Warna", options: ["Merah", "Hitam", ""] },
        { id: 3, name: "Ukuran", options: ["38", "39", "40", ""] },
    ]);

    const [pricingType, setPricingType] = useState<"single" | "individual">("individual");
    const [singlePrice, setSinglePrice] = useState("0");

    // Harga per KELOMPOK (muncul saat hanya 1 dimensi varian aktif)
    const [groupPrices, setGroupPrices] = useState<{ [group: string]: string }>({});

    // Harga per KOMBINASI (muncul saat ≥2 dimensi varian aktif)
    const [individualPrices, setIndividualPrices] = useState<{ [key: string]: string }>({
        "Grade A-Merah-38": "0",
        "Grade A-Merah-39": "0",
        "Grade A-Merah-40": "0",
        "Grade A-Hitam-38": "0",
        "Grade A-Hitam-39": "0",
        "Grade A-Hitam-40": "0",
        "Grade B-Merah-38": "0",
        "Grade B-Merah-39": "0",
        "Grade B-Merah-40": "0",
        "Grade B-Hitam-38": "0",
        "Grade B-Hitam-39": "0",
        "Grade B-Hitam-40": "0",
    });

    // ───── Handlers umum

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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleToggleFeatured = () => setFormData((prev) => ({ ...prev, featured: !prev.featured }));

    const handleSaveChanges = () => {
        // Di sini kamu bisa memutuskan data mana yang dipakai:
        // - 0 varian → pakai formData.price / singlePrice
        // - 1 varian → pakai groupPrices
        // - ≥2 varian → pakai individualPrices
        console.log("Saving product changes:", {
            formData,
            pricingType,
            singlePrice,
            groupPrices,
            individualPrices,
            variants,
            galleries,
        });
    };

    const handleCancel = () => {
        window.location.href = "/products";
    };

    const handleDelete = () => {
        if (confirm("Are you sure you want to delete this product?")) {
            console.log("Deleting product...");
        }
    };

    // ───── Galleries
    const handleGalleryChange = (id: number, field: keyof Gallery, value: string) => {
        setGalleries((prev) => prev.map((g) => (g.id === id ? { ...g, [field]: value } : g)));
    };
    const handleRemoveGallery = (id: number) => setGalleries((prev) => prev.filter((g) => g.id !== id));
    const handleAddGallery = () => {
        const newGallery: Gallery = {
            id: galleries.length + 1,
            image: "/api/placeholder/150/150",
            title: "",
            alt: "",
            fileName: "file_name.jpg",
        };
        setGalleries((prev) => [...prev, newGallery]);
    };

    // ───── Variants builder
    const handleAddVariant = () => {
        if (variants.length >= 3) return;
        setVariants((prev) => [...prev, { id: prev.length + 1, name: "", options: [""] }]);
    };
    const handleVariantNameChange = (id: number, name: string) =>
        setVariants((prev) => prev.map((v) => (v.id === id ? { ...v, name } : v)));
    const handleOptionChange = (variantId: number, optionIndex: number, value: string) => {
        setVariants((prev) =>
            prev.map((variant) => {
                if (variant.id !== variantId) return variant;
                const newOptions = [...variant.options];
                newOptions[optionIndex] = value;
                // jaga selalu ada satu input kosong di akhir
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
    const handleRemoveVariant = (id: number) => setVariants((prev) => prev.filter((v) => v.id !== id));

    // ───── Helpers varian valid
    const getValidVariants = useMemo(
        () => () => variants.filter((v) => v.options.some((opt) => opt.trim() !== "")),
        [variants]
    );
    const validVariantCount = getValidVariants().length;

    // Reset groupPrices jika jumlah dimensi varian ≠ 1
    useEffect(() => {
        if (validVariantCount !== 1 && Object.keys(groupPrices).length > 0) {
            setGroupPrices({});
        }
    }, [validVariantCount]); // eslint-disable-line react-hooks/exhaustive-deps

    // ───── Kombinasi dan pengelompokan
    const generateVariantCombinations = () => {
        const valids = getValidVariants();
        if (valids.length === 0) return [];
        const combinations: string[][] = [[]];
        valids.forEach((variant) => {
            const opts = variant.options.filter((o) => o.trim() !== "");
            const next: string[][] = [];
            combinations.forEach((c) => opts.forEach((o) => next.push([...c, o])));
            combinations.length = 0;
            combinations.push(...next);
        });
        return combinations;
    };

    const groupedCombinations = () => {
        const grouped: { [key: string]: string[][] } = {};
        generateVariantCombinations().forEach((combination) => {
            const first = combination[0] || "Default";
            if (!grouped[first]) grouped[first] = [];
            grouped[first].push(combination);
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
                    <span className="text-gray-600">Edit</span>
                </nav>
            </div>

            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold text-gray-900">Edit Product</h1>
                    <DeleteButton onClick={handleDelete} />
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-gray-50 min-h-screen">
                <div className="px-6 py-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column */}
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
                                        placeholder="Product name"
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

                                    {/* Toolbar mini */}
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

                                {/* Base Price (opsional) */}
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
                                                    <button type="button" onClick={() => handleRemoveGallery(gallery.id)} className="text-white hover:text-red-300 ml-2">
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

                                {/* Variant builder */}
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
                                                <button type="button" onClick={() => handleRemoveVariant(variant.id)} className="text-gray-400 hover:text-red-600 text-lg">
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
                                                        {/* Header level-1 (toggle) */}
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
                                                        {/* Header level-1 (toggle) */}
                                                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                                                            <h5 className="font-medium text-gray-900">{firstOption}</h5>
                                                            <button
                                                                className="text-gray-400 hover:text-gray-600"
                                                                type="button"
                                                                onClick={() => toggleGroup(firstOption)}
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
                                                                            {/* Sub-header level-2 (toggle) */}
                                                                            <div className="bg-gray-100 px-3 py-2 border border-gray-200 rounded flex items-center justify-between">
                                                                                <h6 className="font-medium text-gray-800">{secondOption}</h6>
                                                                                <button
                                                                                    className="text-gray-400 hover:text-gray-600"
                                                                                    type="button"
                                                                                    onClick={() => toggleSub(firstOption, String(secondOption))}
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
                                                                                        .map((combination, index) => {
                                                                                            const key = combination.join("-");
                                                                                            const thirdOption = combination[2];
                                                                                            return (
                                                                                                <div key={index} className="flex items-center gap-3 text-sm">
                                                                                                    <span className="w-40 text-gray-600">{thirdOption || "Price"}</span>
                                                                                                    <span className="text-gray-500">Rp</span>
                                                                                                    <input
                                                                                                        type="number"
                                                                                                        value={individualPrices[key] || "0"}
                                                                                                        onChange={(e) =>
                                                                                                            setIndividualPrices((prev) => ({ ...prev, [key]: e.target.value }))
                                                                                                        }
                                                                                                        className="px-2 py-1 border border-gray-300 rounded text-sm text-black w-28"
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

                        {/* Right Column - SEO */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-6">SEO</h3>

                                {/* Tags */}
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

                                {/* Keyword */}
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

                                {/* SEO Description */}
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
                        <DraftButton onClick={handleSaveChanges}>Save Changes</DraftButton>
                        <CancelButton onClick={handleCancel} />
                    </div>
                </div>
            </div>
        </div>
    );
}