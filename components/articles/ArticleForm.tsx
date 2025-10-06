"use client";

import React, { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TinyMCEEditor } from "@/components/common/TinyMCEEditor";
import { useArticleForm, kebabCase, type Article } from "./useArticleForm";
import { PublishButton, DraftButton, CancelButton, DeleteButton } from "@/components/ui/ActionButton";
import { Toast } from "@/components/ui/Toast";

type Props = {
  mode: "add" | "edit";
  initial?: Partial<Article>;
  showDelete?: boolean;
};

export const ArticleForm: React.FC<Props> = ({ mode, initial, showDelete }) => {
  const router = useRouter();
  const { state, actions } = useArticleForm(initial);
  const [toast, setToast] = useState<{ show: boolean; msg: string; variant?: "success" | "error" }>({ show: false, msg: "" });
  const [newTag, setNewTag] = useState("");

  const titleError = useMemo(() => (state.title.trim().length === 0 ? "Title wajib diisi" : ""), [state.title]);

  const onTagKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      actions.addTag(newTag);
      setNewTag("");
    }
  };

  const onDropCover: React.DragEventHandler<HTMLLabelElement> = (e) => {
    e.preventDefault();
    if (!e.dataTransfer.files?.length) return;
    const file = e.dataTransfer.files[0];
    if (file) actions.onPickCover(file);
  };

  const onPickFile: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (file) actions.onPickCover(file);
  };

  const onCancel = () => {
    if (state.dirty && !confirm("Perubahan belum disimpan. Yakin ingin keluar?")) return;
    router.push("/articles");
  };

  const onPublish = async () => {
    if (titleError) {
      setToast({ show: true, msg: titleError, variant: "error" });
      return;
    }
    await actions.submitPublish();
    setToast({ show: true, msg: mode === "add" ? "Artikel berhasil dipublish" : "Perubahan tersimpan", variant: "success" });
  };
  const onDraft = async () => {
    await actions.submitDraft();
    setToast({ show: true, msg: "Draft tersimpan", variant: "success" });
  };

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
        {showDelete && (
          <DeleteButton aria-label="Delete Article">Delete</DeleteButton>
        )}
      </div>

      <h1 className="mb-4 text-2xl font-semibold text-gray-900">{mode === "add" ? "Add Article" : "Edit Article"}</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Left column: Post form */}
        <div className="md:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-base font-medium text-gray-900">Post</h2>
            </div>
            <div className="px-6 py-6 space-y-4">
              {/* Title */}
              <div>
                <label htmlFor="title" className="mb-2 block text-sm font-medium text-gray-700">Title</label>
                <input
                  id="title"
                  aria-label="Title"
                  placeholder="Masukkan judul artikel..."
                  value={state.title}
                  onChange={(e) => actions.setTitle(e.target.value)}
                  className={`w-full rounded-md border px-3 py-2 text-xl font-medium ${titleError ? "border-red-500" : "border-gray-300"}`}
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
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>

              {/* Category (optional) */}
              <div>
                <label htmlFor="category" className="mb-2 block text-sm font-medium text-gray-700">Category</label>
                <select
                  id="category"
                  aria-label="Category"
                  value={state.category}
                  onChange={(e) => actions.setCategory(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">- Choose -</option>
                  <option value="Teknologi">Teknologi</option>
                  <option value="Desain">Desain</option>
                  <option value="Bisnis">Bisnis</option>
                </select>
              </div>

              {/* Description / Content (CKEditor) */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Description</label>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
                  <TinyMCEEditor
                    value={state.content}
                    onChange={actions.setContent}
                    placeholder="Tulis artikel Anda di sini…"
                    autosaveKey={`article:${mode}:content`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Side panel */}
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
                  <button
                    aria-label="Remove cover"
                    onClick={actions.clearCover}
                    className="absolute left-2 top-2 rounded-full bg-black/80 p-1 text-white hover:bg-black"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <label
                  onDrop={onDropCover}
                  onDragOver={(e) => e.preventDefault()}
                  className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6 text-sm text-gray-500 hover:bg-gray-50"
                >
                  <span>Drag & drop cover here, or click to upload</span>
                  <input type="file" accept="image/*" className="hidden" onChange={onPickFile} aria-label="Upload cover" />
                </label>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-base font-medium text-gray-900">Tags</h2>
            </div>
            <div className="px-6 py-4 space-y-3">
              <input
                aria-label="New Tag"
                placeholder="New Tag"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={onTagKey}
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

          {/* SEO */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-base font-medium text-gray-900">SEO</h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Tags</label>
                <input
                  aria-label="SEO Tags"
                  value={state.seoTags}
                  onChange={(e) => actions.setSeoTags(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Keyword</label>
                <input
                  aria-label="SEO Keyword"
                  value={state.keyword}
                  onChange={(e) => actions.setKeyword(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  aria-label="SEO Description"
                  rows={4}
                  value={state.seoDescription}
                  onChange={(e) => actions.setSeoDescription(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
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
