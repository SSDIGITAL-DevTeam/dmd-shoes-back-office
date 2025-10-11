"use client";

import React from "react";
import { ArticleForm } from "@/components/articles/ArticleForm";
import { useParams } from "next/navigation";

// export default function EditArticlePage() {
//   const params = useParams();
//   const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string | undefined);
//   // NOTE: In real app, fetch article by id. Using minimal initial for now.
//   const initial = { title: "", slug: "", content: null, tags: [], seo: {} };
//   return <ArticleForm mode="edit" initial={initial} showDelete />;
// }

export default function EditArticlePage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string | undefined);

  // Contoh initial dengan data nyata
  const initial = {
    title: "Contoh Judul Artikel",
    slug: "contoh-judul-artikel",
    content: "<p>Ini adalah isi artikel awal.</p>",
    category: "Teknologi",
    coverUrl: "https://via.placeholder.com/600x400.png?text=Cover+Image",
    tags: ["React", "Next.js", "Web Dev"],
    seoTags: "react,nextjs,web development",
    keyword: "artikel react nextjs",
    seoDescription: "Deskripsi SEO artikel contoh untuk React dan Next.js",
  };

  return <ArticleForm mode="edit" initial={initial} showDelete />;
}
