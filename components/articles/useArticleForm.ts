"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createArticle,
  updateArticle,
  type ArticleJsonPayload,
  type ArticleMultipartPayload,
  type LangPair,
} from "@/services/articles.service";

export type Article = {
  id?: number;
  slug: string;

  // bilingual
  title: { id?: string | null; en?: string | null };
  content: { id?: string | null; en?: string | null };

  // cover
  coverUrl?: string;

  // tags + SEO bilingual
  tags: string[];
  seo: {
    keyword: { id?: string | null; en?: string | null };
    description: { id?: string | null; en?: string | null };
  };
};

export function kebabCase(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

type UseArticleFormOptions = {
  mode?: "add" | "edit";
  idForEdit?: string | number;
  initial?: Partial<Article>;
};

export function useArticleForm(opts?: UseArticleFormOptions) {
  const mode = opts?.mode ?? "add";

  // bilingual states
  const [title, setTitleState] = useState<Article["title"]>({
    id: opts?.initial?.title?.id ?? "",
    en: opts?.initial?.title?.en ?? "",
  });
  const [content, setContentState] = useState<Article["content"]>({
    id: opts?.initial?.content?.id ?? "",
    en: opts?.initial?.content?.en ?? "",
  });

  const [slug, setSlug] = useState(opts?.initial?.slug ?? "");
  const [coverUrl, setCoverUrl] = useState<string | undefined>(opts?.initial?.coverUrl);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const [tags, setTags] = useState<string[]>(opts?.initial?.tags ?? []);

  const [seoKeyword, setSeoKeywordState] = useState<Article["seo"]["keyword"]>({
    id: opts?.initial?.seo?.keyword?.id ?? "",
    en: opts?.initial?.seo?.keyword?.en ?? "",
  });
  const [seoDescription, setSeoDescriptionState] = useState<Article["seo"]["description"]>({
    id: opts?.initial?.seo?.description?.id ?? "",
    en: opts?.initial?.seo?.description?.en ?? "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [dirty, setDirty] = useState(false);

  // track manual slug
  const manualSlugRef = useRef(false);
  const markSlugManual = useCallback((v: string) => {
    manualSlugRef.current = true;
    setSlug(v);
  }, []);

  // auto slug dari title.id (prioritas ID)
  useEffect(() => {
    if (!manualSlugRef.current) {
      const seed = (title.id ?? "") || (title.en ?? "") || "";
      setSlug(kebabCase(seed));
    }
  }, [title]);

  // before unload guard
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // mark dirty on any change
  useEffect(() => {
    setDirty(true);
  }, [title, content, slug, coverUrl, tags, seoKeyword, seoDescription]);

  // tag helpers
  const addTag = (t: string) => {
    const v = t.trim();
    if (!v) return;
    setTags((prev) => (prev.includes(v) ? prev : [...prev, v]));
  };
  const removeTag = (t: string) => setTags((prev) => prev.filter((x) => x !== t));

  // cover helpers
  const onPickCover = (file: File) => {
    setCoverFile(file);
    const url = URL.createObjectURL(file);
    setCoverUrl(url);
  };
  const clearCover = () => {
    setCoverFile(null);
    setCoverUrl(undefined);
  };

  // setters bilingual untuk UI
  const setTitle = (lang: "id" | "en", val: string) =>
    setTitleState((p) => ({ ...p, [lang]: val }));
  const setContent = (lang: "id" | "en", val: string) =>
    setContentState((p) => ({ ...p, [lang]: val }));
  const setSeoKeyword = (lang: "id" | "en", val: string) =>
    setSeoKeywordState((p) => ({ ...p, [lang]: val }));
  const setSeoDescription = (lang: "id" | "en", val: string) =>
    setSeoDescriptionState((p) => ({ ...p, [lang]: val }));

  // utils
  function nn(v?: string | null): string | null {
    const s = (v ?? "").trim();
    return s === "" ? null : s;
  }

  // payload builders
  function buildJsonPayload(status: "publish" | "draft"): ArticleJsonPayload {
    const published = status === "publish";
    const titlePair: LangPair = { id: nn(title.id) ?? "", en: nn(title.en) };
    const contentPair: LangPair = { id: nn(content.id) ?? "", en: nn(content.en) };

    return {
      title: titlePair,
      content: contentPair,
      status,
      published,
      slug: nn(slug),
      // SEO:
      seo_keyword: { id: nn(seoKeyword.id), en: nn(seoKeyword.en) },
      seo_description: { id: nn(seoDescription.id), en: nn(seoDescription.en) },
      seo_tags: tags.length ? tags : null,
      // gunakan cover_url jika tidak upload file DAN sudah http(s)
      cover_url:
        coverFile ? undefined : coverUrl && coverUrl.startsWith("http") ? coverUrl : undefined,
    };
  }

  function buildMultipartPayload(status: "publish" | "draft"): ArticleMultipartPayload | null {
    if (!coverFile) return null;
    const published = status === "publish";
    const titlePair: LangPair = { id: nn(title.id) ?? "", en: nn(title.en) };
    const contentPair: LangPair = { id: nn(content.id) ?? "", en: nn(content.en) };

    return {
      title: titlePair,
      content: contentPair,
      status,
      published,
      slug: nn(slug),
      cover: coverFile,
      seo_keyword: { id: nn(seoKeyword.id), en: nn(seoKeyword.en) },
      seo_description: { id: nn(seoDescription.id), en: nn(seoDescription.en) },
      seo_tags: tags.length ? tags : null,
    };
  }

  const submit = async (status: "publish" | "draft") => {
    setSubmitting(true);
    try {
      let result;
      if (mode === "add") {
        if (coverFile) {
          result = await createArticle(buildMultipartPayload(status)!);
        } else {
          result = await createArticle(buildJsonPayload(status));
        }
      } else {
        if (!opts?.idForEdit) throw new Error("Missing id for edit");
        if (coverFile) {
          result = await updateArticle(opts.idForEdit, buildMultipartPayload(status)!);
        } else {
          result = await updateArticle(opts.idForEdit, buildJsonPayload(status));
        }
      }
      setDirty(false);
      return result;
    } finally {
      setSubmitting(false);
    }
  };

  const submitPublish = () => submit("publish");
  const submitDraft = () => submit("draft");

  return {
    state: {
      title,
      content,
      slug,
      coverUrl,
      tags,
      seo: { keyword: seoKeyword, description: seoDescription },
      submitting,
      dirty,
    },
    actions: {
      setTitle,
      setSlug: markSlugManual,
      setContent,
      onPickCover,
      clearCover,
      addTag,
      removeTag,
      setSeoKeyword,
      setSeoDescription,
      submitPublish,
      submitDraft,
    },
  };
}
