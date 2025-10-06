"use client";

import { useEffect, useMemo, useState } from "react";

export type Article = {
  id?: number;
  title: string;
  slug: string;
  content: string; // CKEditor HTML output
  category?: string;
  coverUrl?: string; // preview or remote url
  tags: string[];
  seo: {
    tags?: string;
    keyword?: string;
    description?: string;
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

export function useArticleForm(initial?: Partial<Article>) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [content, setContent] = useState<string>(initial?.content ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [coverUrl, setCoverUrl] = useState<string | undefined>(initial?.coverUrl);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [seoTags, setSeoTags] = useState(initial?.seo?.tags ?? "");
  const [keyword, setKeyword] = useState(initial?.seo?.keyword ?? "");
  const [seoDescription, setSeoDescription] = useState(initial?.seo?.description ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Auto slug from title (editable)
  useEffect(() => {
    if (!dirty || !title) return;
  }, [title, dirty]);

  useEffect(() => {
    // Make slug follow title until user edits slug manually
    if (!initial?.slug || slug === "" || slug === kebabCase(initial?.title ?? "")) {
      setSlug(kebabCase(title));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  }, [title, slug, content, category, coverUrl, tags, seoTags, keyword, seoDescription]);

  const addTag = (t: string) => {
    const v = t.trim();
    if (!v) return;
    setTags((prev) => (prev.includes(v) ? prev : [...prev, v]));
  };
  const removeTag = (t: string) => setTags((prev) => prev.filter((x) => x !== t));

  const onPickCover = (file: File) => {
    setCoverFile(file);
    const url = URL.createObjectURL(file);
    setCoverUrl(url);
  };
  const clearCover = () => {
    setCoverFile(null);
    setCoverUrl(undefined);
  };

  async function fakeApi(delay = 900) {
    await new Promise((r) => setTimeout(r, delay));
  }

  const buildPayload = (): Article => ({
    title,
    slug,
    content,
    category,
    coverUrl,
    tags,
    seo: { tags: seoTags, keyword, description: seoDescription },
  });

  const submitPublish = async () => {
    setSubmitting(true);
    try {
      await fakeApi();
      setDirty(false);
      return buildPayload();
    } finally {
      setSubmitting(false);
    }
  };
  const submitDraft = async () => submitPublish();

  return {
    state: {
      title,
      slug,
      content,
      category,
      coverUrl,
      tags,
      seoTags,
      keyword,
      seoDescription,
      submitting,
      dirty,
    },
    actions: {
      setTitle,
      setSlug,
      setContent,
      setCategory,
      onPickCover,
      clearCover,
      addTag,
      removeTag,
      setSeoTags,
      setKeyword,
      setSeoDescription,
      submitPublish,
      submitDraft,
    },
  };
}
