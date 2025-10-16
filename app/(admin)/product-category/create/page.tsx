// app/(admin)/product-category/create/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { CreateButton, CancelButton } from "@/components/ui/ActionButton";
import { useRouter } from "next/navigation";

type ParentOption = {
  id: number;
  parent_id?: number | null;
  name?: { id?: string; en?: string } | string;
};

type FormState = {
  name_id: string;
  name_en: string;
  slug: string;
  parent_id: string;
  status: boolean;
  cover_url: string;
};

// ==== helpers ====
function extractArray(resp: any): ParentOption[] {
  if (Array.isArray(resp?.data)) return resp.data;
  if (Array.isArray(resp?.data?.data)) return resp.data.data;
  if (Array.isArray(resp)) return resp;
  return [];
}

async function fetchJSON(input: string, init?: RequestInit) {
  const headers = new Headers(init?.headers || {});
  headers.set("Accept", "application/json");
  headers.set("X-Requested-With", "XMLHttpRequest");
  const res = await fetch(input, { ...init, headers, credentials: "include" });
  const text = await res.text().catch(() => "");
  const data = text ? JSON.parse(text) : {};
  return { ok: res.ok, status: res.status, data };
}

export default function CreateCategoryPage() {
  const router = useRouter();

  const [formData, setFormData] = useState<FormState>({
    name_id: "",
    name_en: "",
    slug: "",
    parent_id: "",
    status: true,
    cover_url: "",
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [parentCategories, setParentCategories] = useState<ParentOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loadingParents, setLoadingParents] = useState(true);

  // ✅ Ambil daftar parent category (status=active) dan filter hanya yang tidak punya parent_id
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingParents(true);
      try {
        const res = await fetchJSON(`/api/category?status=active&perPage=100`);
        const list = extractArray(res.data);

        // hanya ambil kategori tanpa parent
        const topLevel = list.filter((c) => !c.parent_id);

        if (mounted) setParentCategories(topLevel);
      } catch {
        if (mounted) setParentCategories([]);
      } finally {
        if (mounted) setLoadingParents(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleCreate = async (andContinue = false) => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const fd = new FormData();
      fd.append("name[id]", formData.name_id);
      fd.append("name[en]", formData.name_en);
      if (formData.slug) fd.append("slug", formData.slug);
      if (formData.parent_id) fd.append("parent_id", String(Number(formData.parent_id)));
      fd.append("status", formData.status ? "1" : "0");
      if (coverFile) fd.append("cover", coverFile);

      const res = await fetch(`/api/category`, {
        method: "POST",
        body: fd,
        credentials: "include",
        headers: new Headers({ "X-Requested-With": "XMLHttpRequest", Accept: "application/json" }),
      });

      const text = await res.text().catch(() => "");
      const json = text ? JSON.parse(text) : {};
      if (!res.ok) throw new Error(json?.message || `Failed to create (${res.status})`);

      setSuccess(json?.message || "Category created");

      if (andContinue) {
        setFormData({
          name_id: "",
          name_en: "",
          slug: "",
          parent_id: "",
          status: true,
          cover_url: "",
        });
        setCoverFile(null);
      } else {
        router.push("/product-category");
      }
    } catch (e: any) {
      setError(e?.message || "Failed to create");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => router.push("/product-category");

  return (
    <div className="min-h-full">
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <span>Categories</span>
          <span className="text-gray-300">›</span>
          <span className="text-gray-600">Create</span>
        </nav>
      </div>

      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <h1 className="text-2xl font-semibold text-gray-900">New Category</h1>
      </div>

      <div className="bg-gray-50 min-h-screen">
        <div className="px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Category</h2>

                <div className="mb-6">
                  <div className="mb-2 text-sm font-medium text-gray-700">
                    Name (Bahasa Indonesia) <span className="text-red-500">*</span>
                  </div>
                  <input
                    type="text"
                    id="name_id"
                    name="name_id"
                    value={formData.name_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                    placeholder="Sandal Jepit"
                  />
                </div>

                <div className="mb-6">
                  <div className="mb-2 text-sm font-medium text-gray-700">Name (English)</div>
                  <input
                    type="text"
                    id="name_en"
                    name="name_en"
                    value={formData.name_en}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                    placeholder="Flip-Flops"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
                      Slug
                    </label>
                    <input
                      type="text"
                      id="slug"
                      name="slug"
                      value={formData.slug}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                      placeholder="sandal-jepit"
                    />
                  </div>

                  <div>
                    <label htmlFor="parent_id" className="block text-sm font-medium text-gray-700 mb-2">
                      Parent Category
                    </label>
                    <select
                      id="parent_id"
                      name="parent_id"
                      value={formData.parent_id}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                      disabled={loadingParents}
                    >
                      <option value="">
                        {loadingParents ? "Loading..." : "Select Parent Category"}
                      </option>
                      {parentCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {typeof c.name === "string"
                            ? c.name
                            : c.name?.id || c.name?.en || `#${c.id}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="status"
                      checked={formData.status}
                      onChange={handleInputChange}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Cover</h3>
                <div className="mb-4">
                  <label htmlFor="cover_file" className="block text-sm font-medium text-gray-700 mb-2">
                    Cover File
                  </label>
                  <input
                    id="cover_file"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-gray-900 file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-gray-700 hover:file:bg-gray-200"
                  />
                  {(coverFile || formData.cover_url) && (
                    <div className="mt-3">
                      <img
                        src={
                          coverFile
                            ? URL.createObjectURL(coverFile)
                            : formData.cover_url ||
                              "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIGZpbGw9IiNGM0Y0RjYiLz48cGF0aCBkPSJNMjQgMzZDMzAuNjI3NCAzNiAzNiAzMC42Mjc0IDM2IDI0QzM2IDE3LjM3MjYgMzAuNjI3NCAxMiAyNCAxMkMxNy4zNzI2IDEyIDEyIDE3LjM3MjYgMTIgMjRDMTIgMzAuNjI3NiAxNy4zNzI2IDM2IDI0IDM2WiIgc3Ryb2tlPSIjOUNBM0FGIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNMjQgMjhDMjYuMjA5MSAyOCAyOCAyNi4yMDkxIDI4IDI0QzI4IDIxLjc5MDkgMjYuMjA5MSAyMCAyNCAyMEMyMS43OTA5IDIwIDIwIDIxLjc5MDkgMjAgMjRDMjAgMjYuMjA5MSAyMS43OTA5IDI4IDI0IDI4WiIgc3Ryb2tlPSIjOUNBM0FGIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4="
                        }
                        alt="Cover preview"
                        className="h-28 w-full max-w-xs rounded border object-cover"
                        onLoad={(e) => {
                          if (coverFile)
                            URL.revokeObjectURL(
                              (e.target as HTMLImageElement).src
                            );
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-4">
            {error && <div className="text-sm text-red-600">{error}</div>}
            {success && <div className="text-sm text-green-600">{success}</div>}
            <CreateButton onClick={() => handleCreate(false)} disabled={submitting} />
            <CancelButton onClick={() => handleCreate(true)}>
              {submitting ? "Processing..." : "Create & create another"}
            </CancelButton>
            <CancelButton onClick={handleCancel} />
          </div>
        </div>
      </div>
    </div>
  );
}