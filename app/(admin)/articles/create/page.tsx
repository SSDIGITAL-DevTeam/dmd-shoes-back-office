"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { RichTextEditor } from "@/components/common/RichTextEditor";
import { CancelButton, PublishButton } from "@/components/ui/ActionButton";
import { Toast } from "@/components/ui/Toast";

export default function CreateArticlePage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState<string>("");
  const [toast, setToast] = useState<{ show: boolean; msg: string; variant?: "success" | "error" }>({ show: false, msg: "" });

  const canPublish = useMemo(() => title.trim().length > 0, [title]);

  const onPublish = () => {
    if (!canPublish) {
      setToast({ show: true, msg: "Judul wajib diisi", variant: "error" });
      return;
    }
    // TODO call API to create article with { title, content }
    setToast({ show: true, msg: "Artikel berhasil disimpan", variant: "success" });
  };

  const onCancel = () => history.back();

  return (
    <div className="min-h-full">
      {/* Breadcrumb */}
      <div className="px-6 py-3 border-b border-gray-200 bg-white">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/dashboard" className="hover:text-gray-700">Dashboard</Link>
          <span className="text-gray-300">›</span>
          <Link href="/articles" className="hover:text-gray-700">Articles</Link>
          <span className="text-gray-300">›</span>
          <span className="text-gray-600">Create</span>
        </nav>
      </div>

      {/* Header */}
      <div className="px-6 py-6 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Create Article</h1>
        </div>
      </div>

      {/* Form card */}
      <div className="bg-gray-50">
        <div className="px-6 py-6 space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="px-6 py-6 space-y-5">
              {/* Title */}
              <div>
                <label htmlFor="title" className="mb-2 block text-sm font-medium text-gray-700">Title</label>
                <input
                  id="title"
                  aria-label="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  placeholder="Judul artikel"
                />
              </div>

              {/* Editor */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Content</label>
                <RichTextEditor
                  value={content}
                  onChange={(html) => setContent(html)}
                  placeholder="Tulis artikel Anda di sini…"
                  autosaveKey="article:create:draft"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 border-t border-gray-200 px-6 py-5">
              <PublishButton onClick={onPublish} aria-label="Publish" disabled={!canPublish}>Save Changes</PublishButton>
              <CancelButton onClick={onCancel} aria-label="Cancel" />
            </div>
          </div>
        </div>
      </div>

      <Toast show={toast.show} message={toast.msg} variant={toast.variant} onClose={() => setToast({ show: false, msg: "" })} />
    </div>
  );
}
