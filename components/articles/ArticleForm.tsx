"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TinyMCEEditor } from "@/components/common/TinyMCEEditor";
import { useArticleForm, kebabCase, type Article } from "./useArticleForm";
import { PublishButton, DraftButton, CancelButton, DeleteButton } from "@/components/ui/ActionButton";
import { Toast } from "@/components/ui/Toast";

type Props = {
  mode: "add" | "edit";
  initial?: Partial<Article>;
  idForEdit?: string | number;
  showDelete?: boolean;
};

export const ArticleForm: React.FC<Props> = ({ mode, initial, showDelete, idForEdit }) => {
  const router = useRouter();
  const { state, actions } = useArticleForm({ mode, idForEdit, initial });
  const [toast, setToast] = useState<{ show: boolean; msg: string; variant?: "success" | "error" }>({ show: false, msg: "" });
  const [newTag, setNewTag] = useState("");

  // 🔽 NEW: language switcher for inputs
  const [language, setLanguage] = useState<"id" | "en">("en");

  const titleError = useMemo(() => {
    const t = state.title[language]?.trim() || "";
    return t.length === 0 ? `Title (${language.toUpperCase()}) wajib diisi` : "";
  }, [state.title, language]);

  const onCancel = () => {
    if (state.dirty && !confirm("Perubahan belum disimpan. Yakin ingin keluar?")) return;
    router.push("/articles");
  };

  const onPublish = async () => {
    if (titleError) {
      setToast({ show: true, msg: titleError, variant: "error" });
      return;
    }
    try {
      await actions.submitPublish();
      // langsung balik ke list + query untuk toast
      router.replace("/articles?msg=published");
    } catch (e: any) {
      setToast({ show: true, msg: e?.message || "Gagal publish artikel", variant: "error" });
    }
  };

  const onDraft = async () => {
    try {
      await actions.submitDraft();
      router.replace("/articles?msg=draft");
    } catch (e: any) {
      setToast({ show: true, msg: e?.message || "Gagal menyimpan draft", variant: "error" });
    }
  };

  const inputCls = "w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black placeholder:text-gray-400";
  const titleCls = "w-full rounded-md border px-3 py-2 text-xl font-medium text-black";
  const selectCls = "w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black";

  return (
    <div className="p-6">
      {/* Breadcrumb + Delete (edit only) */}
      <div className="mb-6 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          <Link href="/dashboard" className="hover:text-gray-700">Dashboard</Link>
          <span className="mx-2 text-gray-300">›</span>
          <Link href="/articles" className="hover:text-gray-700">Articles</Link>
          <span className="mx-2 text-gray-300">›</span>
          <span className="text-gray-600">{mode === "add" ? "Add" : "Edit"}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* 🔽 NEW: Language selector (mirip products page) */}
          <label className="text-sm text-gray-600">Language:</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as "id" | "en")}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-black"
          >
            <option value="id">🇮🇩 Indonesia</option>
            <option value="en">🇬🇧 English</option>
          </select>

          {showDelete && <DeleteButton aria-label="Delete Article">Delete</DeleteButton>}
        </div>
      </div>

      <h1 className="mb-4 text-2xl font-semibold text-gray-900">{mode === "add" ? "Add Article" : "Edit Article"}</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Left column */}
        <div className="md:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-base font-medium text-gray-900">Post</h2>
            </div>
            <div className="px-6 py-6 space-y-4">
              {/* Title bilingual */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Title ({language.toUpperCase()})</label>
                <input
                  aria-label="Title"
                  placeholder={language === "id" ? "Masukkan judul (Indonesia)..." : "Enter title (English)..."}
                  value={state.title[language] || ""}
                  onChange={(e) => actions.setTitle(language, e.target.value)}
                  className={`${titleCls} ${titleError ? "border-red-500" : "border-gray-300"}`}
                />
                {titleError && <p className="mt-1 text-xs text-red-600">{titleError}</p>}
              </div>

              {/* Slug */}
              <div>
                <label htmlFor="slug" className="mb-2 block text-sm font-medium text-gray-700">Slug</label>
                <input
                  id="slug"
                  aria-label="Slug"
                  value={state.slug}
                  onChange={(e) => actions.setSlug(kebabCase(e.target.value))}
                  className={inputCls}
                />
              </div>

              {/* Description bilingual */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Description ({language === "id" ? "Indonesia" : "English"})
                </label>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
                  <TinyMCEEditor
                    // pakai value sesuai language
                    value={state.content[language] || ""}
                    onChange={(html) => actions.setContent(language, html)}
                    placeholder={language === "id" ? "Tulis artikel (Indonesia)…" : "Write your article (English)…"}
                    autosaveKey={`article:${mode}:content:${language}`}
                    contentStyle={`body{color:#111827} p,li,div,span{color:#111827}`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Cover */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-base font-medium text-gray-900">Cover</h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              {state.coverUrl ? (
                <div className="relative">
                  <img src={state.coverUrl} alt="cover preview" className="w-full rounded-lg object-cover" />
                  <button aria-label="Remove cover" onClick={actions.clearCover} className="absolute left-2 top-2 rounded-full bg-black/80 p-1 text-white hover:bg-black">×</button>
                </div>
              ) : (
                <label
                  onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) actions.onPickCover(f); }}
                  onDragOver={(e) => e.preventDefault()}
                  className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6 text-sm text-gray-500 hover:bg-gray-50"
                >
                  <span>Drag & drop cover here, or click to upload</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) actions.onPickCover(f); }} aria-label="Upload cover" />
                </label>
              )}
            </div>
          </div>

          {/* Tags (chip) */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-base font-medium text-gray-900">Tags</h2>
            </div>
            <div className="px-6 py-4 space-y-3">
              <input
                aria-label="New Tag"
                placeholder="New Tag"
                className={inputCls}
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    actions.addTag(newTag);
                    setNewTag("");
                  }
                }}
              />
              <div className="flex flex-wrap gap-2">
                {state.tags.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 rounded bg-orange-100 px-2 py-1 text-xs font-medium text-orange-600">
                    {t}
                    <button aria-label={`Remove ${t}`} onClick={() => actions.removeTag(t)} className="text-orange-500 hover:text-orange-700">×</button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* SEO bilingual */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-base font-medium text-gray-900">SEO</h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Keyword ({language.toUpperCase()})
                </label>
                <input
                  aria-label="SEO Keyword"
                  value={state.seo.keyword[language] || ""}
                  onChange={(e) => actions.setSeoKeyword(language, e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Description ({language.toUpperCase()})
                </label>
                <textarea
                  aria-label="SEO Description"
                  rows={4}
                  value={state.seo.description[language] || ""}
                  onChange={(e) => actions.setSeoDescription(language, e.target.value)}
                  className={`${inputCls} resize-none`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="mt-8 flex items-center gap-3">
        <PublishButton onClick={onPublish} disabled={state.submitting} aria-label="Publish">
          {state.submitting ? "Publishing…" : "Publish"}
        </PublishButton>
        <DraftButton onClick={onDraft} disabled={state.submitting} aria-label="Save Draft">
          {state.submitting ? "Saving…" : "Draft"}
        </DraftButton>
        <CancelButton onClick={onCancel} aria-label="Cancel" />
      </div>

      <Toast show={toast.show} message={toast.msg} variant={toast.variant} onClose={() => setToast({ show: false, msg: "" })} />
    </div>
  );
};