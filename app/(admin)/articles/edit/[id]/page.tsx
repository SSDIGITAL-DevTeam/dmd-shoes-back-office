"use client";

import { useEffect, useState } from "react";
import { getArticle, type ArticleItem } from "@/services/articles.service";
import { useParams } from "next/navigation";
import { ArticleForm } from "@/components/articles/ArticleForm";
import type { Article } from "@/components/articles/useArticleForm";

function toInitial(a: ArticleItem): Partial<Article> {
  // ambil bilingual (fallback ke *_text)
  const titleId = (a as any)?.title?.id ?? (a as any)?.title_id ?? (a as any)?.title_text ?? "";
  const titleEn = (a as any)?.title?.en ?? (a as any)?.title_en ?? "";
  const contentId = (a as any)?.content?.id ?? (a as any)?.content_id ?? (a as any)?.content_text ?? "";
  const contentEn = (a as any)?.content?.en ?? (a as any)?.content_en ?? "";

  // tags (array)
  const tagsArr: string[] = Array.isArray((a as any)?.seo_tags) ? (a as any).seo_tags : [];

  // SEO bilingual
  const keywordId = (a as any)?.seo_keyword?.id ?? (a as any)?.seo_keyword_id ?? "";
  const keywordEn = (a as any)?.seo_keyword?.en ?? (a as any)?.seo_keyword_en ?? "";
  const descId = (a as any)?.seo_description?.id ?? (a as any)?.seo_description_id ?? "";
  const descEn = (a as any)?.seo_description?.en ?? (a as any)?.seo_description_en ?? "";

  // cover & slug
  const coverUrl = (a as any)?.cover_url ?? (a as any)?.cover ?? undefined;
  const slug = (a as any)?.slug ?? "";

  // Kembalikan persis shape yang dibaca useArticleForm
  return {
    slug,
    coverUrl,
    title: { id: titleId ?? "", en: titleEn ?? "" },
    content: { id: contentId ?? "", en: contentEn ?? "" },
    tags: tagsArr,
    seo: {
      keyword: { id: keywordId ?? "", en: keywordEn ?? "" },
      description: { id: descId ?? "", en: descEn ?? "" },
    },
  };
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
    />
  );
}
