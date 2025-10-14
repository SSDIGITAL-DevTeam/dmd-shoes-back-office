"use client";

import type { ChangeEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AsyncSelect from "react-select/async";
import { v7 as uuidv7 } from "uuid";
import api from "@/lib/fetching";
import { CreateButton, CancelButton } from "@/components/ui/ActionButton";
import ToggleSwitch from "@/components/ui/ToggleSwitch";

type Language = "id" | "en";

interface BilingualText {
  id: string;
  en: string;
}

interface VariantOption {
  localId: string;
  backendId?: string | number | null;
  label: BilingualText;
}

interface VariantDefinition {
  localId: string;
  backendId?: string | number | null;
  name: BilingualText;
  options: VariantOption[];
}

interface GalleryItem {
  localId: string;
  backendId?: string | number | null;
  imageUrl: string;
  file: File | null;
  fileName: string;
  title: BilingualText;
  alt: BilingualText;
}

interface CombinationItem {
  variant: VariantDefinition;
  option: VariantOption;
}

interface CombinationEntry {
  key: string;
  items: CombinationItem[];
}

interface CategoryOption {
  value: number;
  label: string;
  image?: string | null;
}

interface ProductFormState {
  name: BilingualText;
  slug: string;
  description: BilingualText;
  categoryId: number | null;
  categoryLabel: string;
  stock: string;
  heelHeightCm: string;
  seoTagsInput: string;
  seoKeyword: BilingualText;
  seoDescription: BilingualText;
  featured: boolean;
  status: boolean;
}

const sanitizeText = (value: any): string => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const toBilingual = (value: any): BilingualText => {
  if (typeof value === "string") {
    const trimmed = sanitizeText(value);
    return { id: trimmed, en: trimmed };
  }
  if (typeof value === "object" && value !== null) {
    const idValue = sanitizeText(value.id ?? "");
    const enValue = sanitizeText(value.en ?? "");
    return {
      id: idValue || enValue,
      en: enValue || idValue,
    };
  }
  return { id: "", en: "" };
};

const coerceBoolean = (value: any): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    return ["1", "true", "active", "publish"].includes(normalized);
  }
  return false;
};

const getLocalizedText = (text: BilingualText, lang: Language): string => {
  if (lang === "id") {
    return sanitizeText(text.id) || sanitizeText(text.en);
  }
  return sanitizeText(text.en) || sanitizeText(text.id);
};

const normalizeForCompare = (value: string): string =>
  value.replace(/\s+/g, " ").trim().toLowerCase();

const buildOptionCandidates = (
  variant: VariantDefinition,
  option: VariantOption
): string[] => {
  const variantId = sanitizeText(variant.name.id);
  const variantEn = sanitizeText(variant.name.en);
  const optionId = sanitizeText(option.label.id);
  const optionEn = sanitizeText(option.label.en);
  const combos = [
    optionId,
    optionEn,
    `${variantId} ${optionId}`,
    `${variantEn} ${optionEn}`,
    `${variantId}: ${optionId}`,
    `${variantEn}: ${optionEn}`,
    `${variantEn} ${optionId}`,
    `${variantId} ${optionEn}`,
  ];
  return combos
    .map((item) => item.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .map((item) => item.toLowerCase());
};

const findOptionMatch = (
  part: string,
  variant: VariantDefinition
): VariantOption | undefined => {
  const normalizedPart = normalizeForCompare(part);
  const availableOptions = variant.options.filter((option) => {
    const idText = sanitizeText(option.label.id);
    const enText = sanitizeText(option.label.en);
    return Boolean(idText || enText);
  });
  for (const option of availableOptions) {
    const candidates = buildOptionCandidates(variant, option);
    if (candidates.includes(normalizedPart)) {
      return option;
    }
  }
  for (const option of availableOptions) {
    const optionId = normalizeForCompare(option.label.id);
    const optionEn = normalizeForCompare(option.label.en);
    if (optionId && normalizedPart.includes(optionId)) {
      return option;
    }
    if (optionEn && normalizedPart.includes(optionEn)) {
      return option;
    }
  }
  return undefined;
};

const createEmptyVariantOption = (): VariantOption => ({
  localId: uuidv7(),
  label: { id: "", en: "" },
});

export default function EditProductPage() {
  const storageUrl = process.env.NEXT_PUBLIC_STORAGE_URL || "";
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [activeLang, setActiveLang] = useState<Language>("en");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [form, setForm] = useState<ProductFormState>({
    name: { id: "", en: "" },
    slug: "",
    description: { id: "", en: "" },
    categoryId: null,
    categoryLabel: "",
    stock: "",
    heelHeightCm: "",
    seoTagsInput: "",
    seoKeyword: { id: "", en: "" },
    seoDescription: { id: "", en: "" },
    featured: false,
    status: true,
  });
  const [pricingType, setPricingType] = useState<"single" | "individual">(
    "single"
  );
  const [singlePrice, setSinglePrice] = useState("");
  const [groupPrices, setGroupPrices] = useState<Record<string, string>>({});
  const [individualPrices, setIndividualPrices] = useState<
    Record<string, string>
  >({});
  const [variants, setVariants] = useState<VariantDefinition[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>("");
  const [galleries, setGalleries] = useState<GalleryItem[]>([]);

  const resolveImageUrl = useCallback(
    (fullUrl?: string | null, path?: string | null) => {
      const direct = sanitizeText(fullUrl);
      if (direct) return direct;
      const fallback = sanitizeText(path);
      if (!fallback) return "";
      if (/^https?:\/\//i.test(fallback)) return fallback;
      if (!storageUrl) return fallback.replace(/^\//, "");
      return `${storageUrl.replace(/\/$/, "")}/${fallback.replace(/^\//, "")}`;
    },
    [storageUrl]
  );

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setErrorMessage(null);
      setNotFound(false);
      try {
        const response = await api.get(`/products/${id}`);
        const payload =
          (response as any)?.data?.data ??
          (response as any)?.data ??
          (response as any);
        if (!payload) {
          setErrorMessage("Product data is unavailable.");
          return;
        }

        setForm({
          name: {
            id: sanitizeText(payload.name?.id ?? payload.name ?? ""),
            en: sanitizeText(payload.name?.en ?? payload.name ?? ""),
          },
          slug: sanitizeText(payload.slug),
          description: {
            id: sanitizeText(
              payload.description?.id ?? payload.description ?? ""
            ),
            en: sanitizeText(
              payload.description?.en ?? payload.description ?? ""
            ),
          },
          categoryId: payload.category_id ?? null,
          categoryLabel: sanitizeText(payload.category_name),
          stock:
            payload.stock !== null && payload.stock !== undefined
              ? sanitizeText(payload.stock)
              : "",
          heelHeightCm:
            payload.heel_height_cm !== null &&
            payload.heel_height_cm !== undefined
              ? sanitizeText(payload.heel_height_cm)
              : "",
          seoTagsInput: Array.isArray(payload.seo_tags)
            ? payload.seo_tags.filter(Boolean).join(", ")
            : "",
          seoKeyword: toBilingual(payload.seo_keyword),
          seoDescription: toBilingual(payload.seo_description),
          featured: coerceBoolean(payload.featured),
          status: coerceBoolean(payload.status),
        });

        const mode =
          payload.pricing_mode === "individual" ? "individual" : "single";
        setPricingType(mode);
        setSinglePrice(
          payload.price !== null && payload.price !== undefined
            ? sanitizeText(payload.price)
            : ""
        );

        setCoverPreview(resolveImageUrl(payload.cover_url, payload.cover));

        const mappedGalleries: GalleryItem[] = Array.isArray(payload.gallery)
          ? payload.gallery.map((item: any) => ({
              localId: uuidv7(),
              backendId: item.id ?? null,
              imageUrl: resolveImageUrl(item.url, item.url ?? item.path),
              file: null,
              fileName: sanitizeText(
                ((item.url ?? "").split("/").pop() as string) ?? ""
              ),
              title: toBilingual(item.title),
              alt: toBilingual(item.alt),
            }))
          : [];
        setGalleries(mappedGalleries);

        const variantDefs: VariantDefinition[] = Array.isArray(
          payload.attributes_data
        )
          ? payload.attributes_data.map((attribute: any) => {
              const options: VariantOption[] =
                Array.isArray(attribute.options) && attribute.options.length > 0
                  ? attribute.options.map((option: any) => ({
                      localId: uuidv7(),
                      backendId: option.id ?? null,
                      label: toBilingual(option.value),
                    }))
                  : [createEmptyVariantOption()];
              return {
                localId: uuidv7(),
                backendId: attribute.id ?? null,
                name: toBilingual(attribute.name),
                options,
              };
            })
          : [];
        setVariants(variantDefs);

        const initialGroup: Record<string, string> = {};
        const initialIndividual: Record<string, string> = {};

        if (
          Array.isArray(payload.variants_data) &&
          payload.variants_data.length > 0 &&
          variantDefs.length > 0
        ) {
          payload.variants_data.forEach((variantPrice: any) => {
            const rawLabel = sanitizeText(variantPrice.label);
            const rawPrice =
              variantPrice.price !== null && variantPrice.price !== undefined
                ? sanitizeText(variantPrice.price)
                : "";
            if (!rawLabel || !rawPrice) return;

            const segments = rawLabel
              .split("|")
              .map((segment: string) => segment.trim())
              .filter(Boolean);
            if (segments.length === 0) return;

            const matchedOptions: VariantOption[] = [];
            segments.forEach((segment, index) => {
              const targetVariant = variantDefs[index];
              if (!targetVariant) return;
              const match = findOptionMatch(segment, targetVariant);
              if (match) matchedOptions.push(match);
            });

            if (matchedOptions.length === 1 && variantDefs.length === 1) {
              initialGroup[matchedOptions[0].localId] = rawPrice;
            } else if (
              matchedOptions.length === segments.length &&
              matchedOptions.length > 0
            ) {
              const key = matchedOptions
                .map((option) => option.localId)
                .join("|");
              initialIndividual[key] = rawPrice;
            }
          });
        }
        setGroupPrices(initialGroup);
        setIndividualPrices(initialIndividual);
      } catch (error: any) {
        if (error?.response?.status === 404) {
          setNotFound(true);
        } else {
          setErrorMessage("Failed to load product.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, resolveImageUrl]);

  useEffect(() => {
    return () => {
      if (coverPreview && coverPreview.startsWith("blob:")) {
        URL.revokeObjectURL(coverPreview);
      }
      galleries.forEach((gallery) => {
        if (gallery.imageUrl.startsWith("blob:")) {
          URL.revokeObjectURL(gallery.imageUrl);
        }
      });
    };
  }, [coverPreview, galleries]);

  const combinationEntries = useMemo<CombinationEntry[]>(() => {
    const prepared = variants
      .map((variant) => ({
        variant,
        options: variant.options.filter((option) => {
          const idLabel = sanitizeText(option.label.id);
          const enLabel = sanitizeText(option.label.en);
          return Boolean(idLabel || enLabel);
        }),
      }))
      .filter((entry) => entry.options.length > 0);

    if (!prepared.length) return [];

    let combos: CombinationEntry[] = [{ key: "", items: [] }];

    prepared.forEach(({ variant, options }) => {
      const next: CombinationEntry[] = [];
      options.forEach((option) => {
        combos.forEach((combo) => {
          const key = combo.items.length
            ? `${combo.key}|${option.localId}`
            : option.localId;
          next.push({
            key,
            items: [...combo.items, { variant, option }],
          });
        });
      });
      combos = next;
    });

    return combos;
  }, [variants]);

  const singleVariantCombos = useMemo(
    () => combinationEntries.filter((combo) => combo.items.length === 1),
    [combinationEntries]
  );

  const multiVariantCombos = useMemo(
    () => combinationEntries.filter((combo) => combo.items.length > 1),
    [combinationEntries]
  );

  useEffect(() => {
    if (pricingType !== "individual") return;

    setGroupPrices((prev) => {
      const keys = singleVariantCombos.map((combo) => combo.key);
      let changed = Object.keys(prev).length !== keys.length;
      const next: Record<string, string> = {};
      keys.forEach((key) => {
        if (!Object.prototype.hasOwnProperty.call(prev, key)) {
          changed = true;
        }
        next[key] = prev[key] ?? "";
      });
      if (!changed) {
        const prevKeysSorted = Object.keys(prev).sort();
        const keysSorted = [...keys].sort();
        for (let i = 0; i < keysSorted.length; i += 1) {
          if (prevKeysSorted[i] !== keysSorted[i]) {
            changed = true;
            break;
          }
        }
      }
      return changed ? next : prev;
    });

    setIndividualPrices((prev) => {
      const keys = multiVariantCombos.map((combo) => combo.key);
      let changed = Object.keys(prev).length !== keys.length;
      const next: Record<string, string> = {};
      keys.forEach((key) => {
        if (!Object.prototype.hasOwnProperty.call(prev, key)) {
          changed = true;
        }
        next[key] = prev[key] ?? "";
      });
      if (!changed) {
        const prevKeysSorted = Object.keys(prev).sort();
        const keysSorted = [...keys].sort();
        for (let i = 0; i < keysSorted.length; i += 1) {
          if (prevKeysSorted[i] !== keysSorted[i]) {
            changed = true;
            break;
          }
        }
      }
      return changed ? next : prev;
    });
  }, [pricingType, singleVariantCombos, multiVariantCombos]);

  const handleTextInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name as keyof ProductFormState]: value,
    }));
  };

  const updateMultilingualField = (
    field: "name" | "description" | "seoKeyword" | "seoDescription",
    lang: Language,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        [lang]: value,
      },
    }));
  };

  const handleCategoryChange = (option: CategoryOption | null) => {
    setForm((prev) => ({
      ...prev,
      categoryId: option?.value ?? null,
      categoryLabel: option?.label ?? "",
    }));
  };

  const handleAddVariant = () => {
    setVariants((prev) => {
      if (prev.length >= 3) return prev;
      return [
        ...prev,
        {
          localId: uuidv7(),
          name: { id: "", en: "" },
          options: [createEmptyVariantOption()],
        },
      ];
    });
  };

  const handleRemoveVariant = (variantId: string) => {
    setVariants((prev) =>
      prev.filter((variant) => variant.localId !== variantId)
    );
  };

  const handleVariantNameChange = (
    variantId: string,
    lang: Language,
    value: string
  ) => {
    setVariants((prev) =>
      prev.map((variant) =>
        variant.localId === variantId
          ? {
              ...variant,
              name: { ...variant.name, [lang]: value },
            }
          : variant
      )
    );
  };

  const handleOptionLabelChange = (
    variantId: string,
    optionId: string,
    lang: Language,
    value: string
  ) => {
    setVariants((prev) =>
      prev.map((variant) =>
        variant.localId === variantId
          ? {
              ...variant,
              options: variant.options.map((option) =>
                option.localId === optionId
                  ? {
                      ...option,
                      label: { ...option.label, [lang]: value },
                    }
                  : option
              ),
            }
          : variant
      )
    );
  };

  const handleAddOption = (variantId: string) => {
    setVariants((prev) =>
      prev.map((variant) =>
        variant.localId === variantId
          ? {
              ...variant,
              options: [...variant.options, createEmptyVariantOption()],
            }
          : variant
      )
    );
  };

  const handleRemoveOption = (variantId: string, optionId: string) => {
    setVariants((prev) =>
      prev.map((variant) => {
        if (variant.localId !== variantId) return variant;
        const remaining = variant.options.filter(
          (option) => option.localId !== optionId
        );
        return {
          ...variant,
          options: remaining.length ? remaining : [createEmptyVariantOption()],
        };
      })
    );
  };

  const handleAddGallery = () => {
    setGalleries((prev) => [
      ...prev,
      {
        localId: uuidv7(),
        imageUrl: "",
        file: null,
        fileName: "",
        title: { id: "", en: "" },
        alt: { id: "", en: "" },
      },
    ]);
  };

  const handleRemoveGallery = (galleryId: string) => {
    setGalleries((prev) =>
      prev.filter((gallery) => gallery.localId !== galleryId)
    );
  };

  const handleGalleryTextChange = (
    galleryId: string,
    field: "title" | "alt",
    lang: Language,
    value: string
  ) => {
    setGalleries((prev) =>
      prev.map((gallery) =>
        gallery.localId === galleryId
          ? {
              ...gallery,
              [field]: { ...gallery[field], [lang]: value },
            }
          : gallery
      )
    );
  };

  const handleGalleryFileChange = (
    galleryId: string,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setGalleries((prev) =>
      prev.map((gallery) => {
        if (gallery.localId !== galleryId) return gallery;
        if (gallery.imageUrl.startsWith("blob:")) {
          URL.revokeObjectURL(gallery.imageUrl);
        }
        return {
          ...gallery,
          file,
          imageUrl: URL.createObjectURL(file),
          fileName: file.name,
        };
      })
    );
  };

  const handleCoverFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (coverPreview && coverPreview.startsWith("blob:")) {
      URL.revokeObjectURL(coverPreview);
    }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const loadCategoryOptions = useCallback(
    async (inputValue: string) => {
      try {
        const response = await api.get("/categories", {
          params: { status: "active", per_page: 100, search: inputValue },
        });
        const list =
          (response as any)?.data?.data ??
          (response as any)?.data ??
          (response as any);
        if (!Array.isArray(list)) return [];
        return list.map((item: any) => {
          const name = toBilingual(item.name);
          const label =
            sanitizeText(name.id) ||
            sanitizeText(name.en) ||
            sanitizeText(item.slug) ||
            `Category ${item.id}`;
          return {
            value: item.id,
            label,
            image: sanitizeText(item.cover_url),
          } as CategoryOption;
        });
      } catch {
        return [];
      }
    },
    []
  );

  const validateBeforeSubmit = (): boolean => {
    const missing: string[] = [];
    if (!sanitizeText(form.name.id)) missing.push("Name (ID)");
    if (!sanitizeText(form.name.en)) missing.push("Name (EN)");
    if (!sanitizeText(form.description.id)) missing.push("Description (ID)");
    if (!sanitizeText(form.description.en)) missing.push("Description (EN)");
    if (!sanitizeText(form.slug)) missing.push("Slug");
    if (!form.categoryId) missing.push("Category");
    if (pricingType === "single" && !sanitizeText(singlePrice)) {
      missing.push("Price");
    }

    if (missing.length > 0) {
      setErrorMessage(`Please complete: ${missing.join(", ")}`);
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    if (!validateBeforeSubmit()) return;

    setSubmitting(true);
    try {
      const formData = new FormData();

      formData.append("pricing_mode", pricingType);
      formData.append("name[id]", sanitizeText(form.name.id));
      formData.append("name[en]", sanitizeText(form.name.en));
      formData.append("description[id]", sanitizeText(form.description.id));
      formData.append("description[en]", sanitizeText(form.description.en));
      formData.append("slug", sanitizeText(form.slug));

      if (form.categoryId) {
        formData.append("category_id", String(form.categoryId));
      }
      if (sanitizeText(form.stock)) {
        formData.append("stock", sanitizeText(form.stock));
      }
      if (sanitizeText(form.heelHeightCm)) {
        formData.append("heel_height_cm", sanitizeText(form.heelHeightCm));
      }

      if (pricingType === "single") {
        formData.append("price", sanitizeText(singlePrice));
      }

      const tags = form.seoTagsInput
        .split(/[,\\n]/)
        .map((tag) => sanitizeText(tag))
        .filter(Boolean);
      tags.forEach((tag, index) => {
        formData.append(`seo_tags[${index}]`, tag);
      });

      if (sanitizeText(form.seoKeyword.id)) {
        formData.append("seo_keyword[id]", sanitizeText(form.seoKeyword.id));
      }
      if (sanitizeText(form.seoKeyword.en)) {
        formData.append("seo_keyword[en]", sanitizeText(form.seoKeyword.en));
      }
      if (sanitizeText(form.seoDescription.id)) {
        formData.append(
          "seo_description[id]",
          sanitizeText(form.seoDescription.id)
        );
      }
      if (sanitizeText(form.seoDescription.en)) {
        formData.append(
          "seo_description[en]",
          sanitizeText(form.seoDescription.en)
        );
      }

      formData.append("featured", form.featured ? "1" : "0");
      formData.append("status", form.status ? "1" : "0");

      if (coverFile) {
        formData.append("cover", coverFile);
      }

      const preparedVariants = variants
        .map((variant) => {
          const options = variant.options.filter((option) => {
            const idLabel = sanitizeText(option.label.id);
            const enLabel = sanitizeText(option.label.en);
            return Boolean(idLabel || enLabel);
          });
          return { variant, options };
        })
        .filter(({ options }) => options.length > 0);

      preparedVariants.forEach(({ variant, options }, variantIndex) => {
        const nameId =
          sanitizeText(variant.name.id) ||
          sanitizeText(variant.name.en) ||
          `Variant ${variantIndex + 1}`;
        const nameEn =
          sanitizeText(variant.name.en) ||
          sanitizeText(variant.name.id) ||
          `Variant ${variantIndex + 1}`;
        formData.append(`attributes[${variantIndex}][name][id]`, nameId);
        formData.append(`attributes[${variantIndex}][name][en]`, nameEn);
        options.forEach((option, optionIndex) => {
          const idValue =
            sanitizeText(option.label.id) || sanitizeText(option.label.en);
          const enValue =
            sanitizeText(option.label.en) || sanitizeText(option.label.id);
          formData.append(
            `attributes[${variantIndex}][options][${optionIndex}][id]`,
            idValue || enValue
          );
          formData.append(
            `attributes[${variantIndex}][options][${optionIndex}][en]`,
            enValue || idValue
          );
        });
      });

      galleries.forEach((gallery, index) => {
        if (gallery.file) {
          formData.append(`gallery[${index}][image]`, gallery.file);
        }
        formData.append(`gallery[${index}][sort]`, String(index));
        const titleId = sanitizeText(gallery.title.id);
        const titleEn = sanitizeText(gallery.title.en);
        const altId = sanitizeText(gallery.alt.id);
        const altEn = sanitizeText(gallery.alt.en);
        if (titleId) {
          formData.append(`gallery[${index}][title][id]`, titleId);
        }
        if (titleEn) {
          formData.append(`gallery[${index}][title][en]`, titleEn);
        }
        if (altId) {
          formData.append(`gallery[${index}][alt][id]`, altId);
        }
        if (altEn) {
          formData.append(`gallery[${index}][alt][en]`, altEn);
        }
      });

      if (pricingType === "individual") {
        const variantPriceEntries: {
          labels: BilingualText[];
          price: string;
          sizeEU?: string;
        }[] = [];

        if (singleVariantCombos.length > 0 && multiVariantCombos.length === 0) {
          singleVariantCombos.forEach((combo) => {
            const priceValue = sanitizeText(groupPrices[combo.key]);
            if (!priceValue) return;
            const { variant, option } = combo.items[0];
            const variantIdText =
              sanitizeText(variant.name.id) ||
              sanitizeText(variant.name.en) ||
              "Variant";
            const variantEnText =
              sanitizeText(variant.name.en) ||
              sanitizeText(variant.name.id) ||
              "Variant";
            const optionIdText =
              sanitizeText(option.label.id) || sanitizeText(option.label.en);
            const optionEnText =
              sanitizeText(option.label.en) || sanitizeText(option.label.id);
            const entry: {
              labels: BilingualText[];
              price: string;
              sizeEU?: string;
            } = {
              labels: [
                {
                  id: `${variantIdText}: ${optionIdText}`,
                  en: `${variantEnText}: ${optionEnText}`,
                },
              ],
              price: priceValue,
            };
            const numericCandidate = optionEnText || optionIdText;
            if (numericCandidate && /^\d+(\.\d+)?$/.test(numericCandidate)) {
              entry.sizeEU = numericCandidate;
            }
            variantPriceEntries.push(entry);
          });
        } else if (multiVariantCombos.length > 0) {
          multiVariantCombos.forEach((combo) => {
            const priceValue = sanitizeText(individualPrices[combo.key]);
            if (!priceValue) return;
            const labels = combo.items.map(({ variant, option }) => {
              const variantIdText =
                sanitizeText(variant.name.id) ||
                sanitizeText(variant.name.en) ||
                "Variant";
              const variantEnText =
                sanitizeText(variant.name.en) ||
                sanitizeText(variant.name.id) ||
                "Variant";
              const optionIdText =
                sanitizeText(option.label.id) ||
                sanitizeText(option.label.en);
              const optionEnText =
                sanitizeText(option.label.en) ||
                sanitizeText(option.label.id);
              return {
                id: `${variantIdText}: ${optionIdText}`,
                en: `${variantEnText}: ${optionEnText}`,
              };
            });
            variantPriceEntries.push({
              labels,
              price: priceValue,
            });
          });
        }

        variantPriceEntries.forEach((entry, entryIndex) => {
          entry.labels.forEach((label, labelIndex) => {
            formData.append(
              `variant_prices[${entryIndex}][labels][${labelIndex}][id]`,
              label.id
            );
            formData.append(
              `variant_prices[${entryIndex}][labels][${labelIndex}][en]`,
              label.en
            );
          });
          formData.append(
            `variant_prices[${entryIndex}][price]`,
            entry.price
          );
          formData.append(`variant_prices[${entryIndex}][stock]`, "0");
          formData.append(`variant_prices[${entryIndex}][active]`, "1");
          if (entry.sizeEU) {
            formData.append(
              `variant_prices[${entryIndex}][size_eu]`,
              entry.sizeEU
            );
          }
        });
      }

      await api.patch(`/products/${id}`, formData);
      setSuccessMessage("Product updated successfully.");
      setTimeout(() => {
        router.push("/products");
      }, 800);
    } catch {
      setErrorMessage("Failed to update product.");
    } finally {
      setSubmitting(false);
    }
  };

  const categoryValue = form.categoryId
    ? ({
        value: form.categoryId,
        label: form.categoryLabel,
      } as CategoryOption)
    : null;

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          Loading...
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="p-6 space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-lg font-semibold text-gray-900 mb-3">
            Product not found
          </h1>
          <p className="text-sm text-gray-600 mb-4">
            The product you are trying to edit could not be found.
          </p>
          <CreateButton onClick={() => router.push("/products")}>
            Back to Products
          </CreateButton>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Edit Product</h1>
        <div className="flex gap-3">
          <CancelButton onClick={() => router.push("/products")} />
          <CreateButton onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving..." : "Save Changes"}
          </CreateButton>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setActiveLang("id")}
          className={`px-3 py-1 rounded ${
            activeLang === "id"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-800"
          }`}
        >
          Indonesia
        </button>
        <button
          type="button"
          onClick={() => setActiveLang("en")}
          className={`px-3 py-1 rounded ${
            activeLang === "en"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-800"
          }`}
        >
          English
        </button>
      </div>

      {errorMessage && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm">
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="bg-green-50 text-green-700 border border-green-200 rounded-lg p-3 text-sm">
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Details
              </h2>
              <p className="text-sm text-gray-500">
                Manage core product information and language-specific content.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name ({activeLang.toUpperCase()}){" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={getLocalizedText(form.name, activeLang)}
                onChange={(event) =>
                  updateMultilingualField(
                    "name",
                    activeLang,
                    event.target.value
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slug <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="slug"
                value={form.slug}
                onChange={handleTextInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                placeholder="product-slug"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-3">
                <ToggleSwitch
                  checked={form.featured}
                  onChange={() =>
                    setForm((prev) => ({ ...prev, featured: !prev.featured }))
                  }
                  aria-label="Toggle featured product"
                />
                <span className="text-sm font-medium text-gray-700">
                  Featured
                </span>
              </div>
              <div className="flex items-center gap-3">
                <ToggleSwitch
                  checked={form.status}
                  onChange={() =>
                    setForm((prev) => ({ ...prev, status: !prev.status }))
                  }
                  aria-label="Toggle product status"
                />
                <span className="text-sm font-medium text-gray-700">
                  Status
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description ({activeLang.toUpperCase()}){" "}
                <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={6}
                value={getLocalizedText(form.description, activeLang)}
                onChange={(event) =>
                  updateMultilingualField(
                    "description",
                    activeLang,
                    event.target.value
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black resize-none"
                placeholder="Describe the product"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <AsyncSelect<CategoryOption>
                cacheOptions
                defaultOptions
                isClearable
                loadOptions={loadCategoryOptions}
                value={categoryValue}
                onChange={(selected) =>
                  handleCategoryChange(selected as CategoryOption | null)
                }
                placeholder="Search and select category..."
                formatOptionLabel={(option) => (
                  <div className="flex items-center gap-2">
                    {option.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={option.image}
                        alt={option.label}
                        className="w-6 h-6 rounded object-cover"
                      />
                    ) : null}
                    <span>{option.label}</span>
                  </div>
                )}
                styles={{
                  control: (base) => ({
                    ...base,
                    borderRadius: "0.75rem",
                    borderColor: "#d1d5db",
                    padding: "2px",
                    minHeight: "44px",
                  }),
                }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock
                </label>
                <input
                  type="number"
                  name="stock"
                  value={form.stock}
                  onChange={handleTextInputChange}
                  min={0}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Heel Height (cm)
                </label>
                <input
                  type="number"
                  name="heelHeightCm"
                  value={form.heelHeightCm}
                  onChange={handleTextInputChange}
                  min={0}
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Variants &amp; Pricing
                </h2>
                <p className="text-sm text-gray-500">
                  Configure up to three variant groups and set pricing rules.
                </p>
              </div>
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
                Add Variant{variants.length >= 3 ? " (Max 3)" : ""}
              </button>
            </div>

            {variants.length === 0 ? (
              <div className="border border-dashed border-gray-300 rounded-lg p-6 text-sm text-gray-500">
                No variants defined yet. Click &ldquo;Add Variant&rdquo; to
                start configuring product attributes.
              </div>
            ) : (
              <div className="space-y-4">
                {variants.map((variant, index) => (
                  <div
                    key={variant.localId}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700">
                          Variant {index + 1}
                        </span>
                        <input
                          type="text"
                          value={getLocalizedText(variant.name, activeLang)}
                          onChange={(event) =>
                            handleVariantNameChange(
                              variant.localId,
                              activeLang,
                              event.target.value
                            )
                          }
                          className="px-3 py-1.5 border border-gray-300 rounded text-sm text-black bg-white"
                          placeholder={
                            activeLang === "id"
                              ? "Nama varian"
                              : "Variant name"
                          }
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(variant.localId)}
                        className="text-gray-400 hover:text-red-600 text-sm"
                      >
                        Remove
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Options ({activeLang.toUpperCase()})
                      </label>
                      <div className="space-y-2">
                        {variant.options.map((option) => (
                          <div
                            key={option.localId}
                            className="flex items-center gap-3"
                          >
                            <input
                              type="text"
                              value={getLocalizedText(option.label, activeLang)}
                              onChange={(event) =>
                                handleOptionLabelChange(
                                  variant.localId,
                                  option.localId,
                                  activeLang,
                                  event.target.value
                                )
                              }
                              className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm text-black bg-white"
                              placeholder={
                                activeLang === "id"
                                  ? "Nama opsi"
                                  : "Option label"
                              }
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveOption(
                                  variant.localId,
                                  option.localId
                                )
                              }
                              className="text-gray-400 hover:text-red-600 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddOption(variant.localId)}
                        className="mt-3 inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        Add Option
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pricing Mode
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPricingType("single")}
                  className={`px-3 py-1.5 rounded-lg border text-sm ${
                    pricingType === "single"
                      ? "border-blue-500 text-blue-600 bg-blue-50"
                      : "border-gray-300 text-gray-700 bg-white"
                  }`}
                >
                  Single Price
                </button>
                <button
                  type="button"
                  onClick={() => setPricingType("individual")}
                  className={`px-3 py-1.5 rounded-lg border text-sm ${
                    pricingType === "individual"
                      ? "border-blue-500 text-blue-600 bg-blue-50"
                      : "border-gray-300 text-gray-700 bg-white"
                  }`}
                >
                  Individual Prices
                </button>
              </div>
            </div>

            {pricingType === "single" ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (Rp) <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Rp</span>
                  <input
                    type="number"
                    min={0}
                    value={singlePrice}
                    onChange={(event) => setSinglePrice(event.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                    placeholder="0"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {combinationEntries.length === 0 ? (
                  <div className="border border-dashed border-gray-300 rounded-lg p-4 text-sm text-gray-500">
                    Add at least one option for each variant to generate
                    combination pricing fields.
                  </div>
                ) : null}

                {singleVariantCombos.length > 0 &&
                multiVariantCombos.length === 0 ? (
                  <div className="space-y-3">
                    {singleVariantCombos.map((combo) => {
                      const { variant, option } = combo.items[0];
                      const label = `${getLocalizedText(
                        variant.name,
                        activeLang
                      )} • ${getLocalizedText(option.label, activeLang)}`;
                      return (
                        <div
                          key={combo.key}
                          className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-3 items-center"
                        >
                          <span className="text-sm text-gray-700">{label}</span>
                          <span className="text-sm text-gray-500">Rp</span>
                          <input
                            type="number"
                            min={0}
                            value={groupPrices[combo.key] ?? ""}
                            onChange={(event) =>
                              setGroupPrices((prev) => ({
                                ...prev,
                                [combo.key]: event.target.value,
                              }))
                            }
                            className="w-32 px-3 py-1.5 border border-gray-300 rounded text-sm text-black"
                            placeholder="0"
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                {multiVariantCombos.length > 0 ? (
                  <div className="space-y-3">
                    {multiVariantCombos.map((combo) => {
                      const label = combo.items
                        .map(
                          ({ variant, option }) =>
                            `${getLocalizedText(
                              variant.name,
                              activeLang
                            )}: ${getLocalizedText(option.label, activeLang)}`
                        )
                        .join(" • ");
                      return (
                        <div
                          key={combo.key}
                          className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-3 items-center"
                        >
                          <span className="text-sm text-gray-700">{label}</span>
                          <span className="text-sm text-gray-500">Rp</span>
                          <input
                            type="number"
                            min={0}
                            value={individualPrices[combo.key] ?? ""}
                            onChange={(event) =>
                              setIndividualPrices((prev) => ({
                                ...prev,
                                [combo.key]: event.target.value,
                              }))
                            }
                            className="w-32 px-3 py-1.5 border border-gray-300 rounded text-sm text-black"
                            placeholder="0"
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Media</h2>
              <p className="text-sm text-gray-500">
                Update cover image and gallery assets. Existing media is kept
                unless replaced.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Cover</h3>
              <div className="flex items-center gap-4">
                {coverPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={coverPreview}
                    alt="Cover preview"
                    className="w-24 h-24 object-cover rounded border"
                  />
                ) : (
                  <div className="w-24 h-24 rounded border border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs">
                    No cover
                  </div>
                )}
                <label className="px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded cursor-pointer text-sm">
                  Choose File
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleCoverFileChange}
                  />
                </label>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-700">Gallery</h3>
                <button
                  type="button"
                  onClick={handleAddGallery}
                  className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Add Image
                </button>
              </div>
              {galleries.length === 0 ? (
                <div className="border border-dashed border-gray-300 rounded-lg p-4 text-sm text-gray-500">
                  No gallery items yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {galleries.map((gallery, index) => (
                    <div
                      key={gallery.localId}
                      className="border border-gray-200 rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-20 h-20 rounded border border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                          {gallery.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={gallery.imageUrl}
                              alt={`Gallery ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs text-gray-400">
                              Preview
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded cursor-pointer text-sm">
                            Select Image
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              className="hidden"
                              onChange={(event) =>
                                handleGalleryFileChange(
                                  gallery.localId,
                                  event
                                )
                              }
                            />
                          </label>
                          {gallery.fileName ? (
                            <span className="text-xs text-gray-500 truncate max-w-[160px]">
                              {gallery.fileName}
                            </span>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveGallery(gallery.localId)}
                          className="ml-auto text-sm text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Title ({activeLang.toUpperCase()})
                        </label>
                        <input
                          type="text"
                          value={getLocalizedText(gallery.title, activeLang)}
                          onChange={(event) =>
                            handleGalleryTextChange(
                              gallery.localId,
                              "title",
                              activeLang,
                              event.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                          placeholder="Image title"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Alt ({activeLang.toUpperCase()})
                        </label>
                        <input
                          type="text"
                          value={getLocalizedText(gallery.alt, activeLang)}
                          onChange={(event) =>
                            handleGalleryTextChange(
                              gallery.localId,
                              "alt",
                              activeLang,
                              event.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                          placeholder="Accessible description"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">SEO</h2>
              <p className="text-sm text-gray-500">
                Optimise discovery across languages with relevant keywords and
                descriptions.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <textarea
                rows={2}
                name="seoTagsInput"
                value={form.seoTagsInput}
                onChange={handleTextInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                placeholder="summer, sport, leather"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SEO Keyword ({activeLang.toUpperCase()})
              </label>
              <input
                type="text"
                value={getLocalizedText(form.seoKeyword, activeLang)}
                onChange={(event) =>
                  updateMultilingualField(
                    "seoKeyword",
                    activeLang,
                    event.target.value
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SEO Description ({activeLang.toUpperCase()})
              </label>
              <textarea
                rows={3}
                value={getLocalizedText(form.seoDescription, activeLang)}
                onChange={(event) =>
                  updateMultilingualField(
                    "seoDescription",
                    activeLang,
                    event.target.value
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
