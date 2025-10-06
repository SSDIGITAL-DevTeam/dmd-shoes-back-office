"use client";

import React from "react";
import { ArticleForm } from "@/components/articles/ArticleForm";
import { useParams } from "next/navigation";

export default function EditArticlePage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string | undefined);
  // NOTE: In real app, fetch article by id. Using minimal initial for now.
  const initial = { title: "", slug: "", content: null, tags: [], seo: {} };
  return <ArticleForm mode="edit" initial={initial} showDelete />;
}
