"use client";

import { useEffect, useState } from "react";
import { getArticle, type ArticleItem } from "@/services/articles.service";
import { useParams } from "next/navigation";
import { ArticleForm } from "@/components/articles/ArticleForm";
import type { Article } from "@/components/articles/useArticleForm";

function toInitial(a: ArticleItem) {
  const titleId = (a as any)?.title?.id ?? a.title_text ?? "";
  const titleEn = (a as any)?.title?.en ?? "";
  const contentId = (a as any)?.content?.id ?? a.content_text ?? "";
  const contentEn = (a as any)?.content?.en ?? "";
  const tagsArr: string[] = Array.isArray((a as any).seo_tags) ? (a as any).seo_tags : [];

  const keywordId = (a as any)?.seo_keyword?.id ?? "";
  const keywordEn = (a as any)?.seo_keyword?.en ?? "";
  const descId = (a as any)?.seo_description?.id ?? "";
  const descEn = (a as any)?.seo_description?.en ?? "";

  // Kembalikan shape yang enak dipakai ArticleForm/useArticleForm (bilingual + fallback)
  const initial: Partial<Article> & any = {
    // umum
    slug: a.slug ?? "",
    coverUrl: a.cover_url ?? undefined,

    // — Post bilingual —
    title_id: titleId,
    title_en: titleEn,
    content_id: contentId,
    content_en: contentEn,

    // Jika ArticleForm-mu masih baca field lama (single), kasih fallback juga:
    title: titleId || titleEn || "",
    content: contentId || contentEn || "",

    // — Tags (chip kanan) —
    tags: tagsArr,

    // — SEO bilingual + string helper (kalau formmu punya 2 input per bahasa) —
    seo_keyword_id: keywordId,
    seo_keyword_en: keywordEn,
    seo_description_id: descId,
    seo_description_en: descEn,

    // Jika form masih punya single fields:
    seo: {
      tags: tagsArr.join(", "),
      keyword: keywordId || keywordEn || "",
      description: descId || descEn || "",
    },
  };

  return initial as Partial<Article>;
}

export default function EditArticlePage() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [initial, setInitial] = useState<Partial<Article> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // Ambil tanpa lang → dapat {title:{id,en}, content:{id,en}, ...}
        const detail = await getArticle(id);
        setInitial(toInitial(detail.data));
      } catch (e: any) {
        setError(e?.message || "Failed to load article");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!initial) return <div className="p-6 text-red-600">Gagal memuat data</div>;

  return (
    <ArticleForm
      mode="edit"
      idForEdit={Number(id)}
      initial={initial}
      showDelete
    />
  );
}
