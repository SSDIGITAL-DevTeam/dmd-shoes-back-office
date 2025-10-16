// app/(admin)/product-category/edit/[id]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { DraftButton, CancelButton, DeleteButton } from "@/components/ui/ActionButton";
import { useParams, useRouter } from "next/navigation";

type ApiCategory = {
  id: number;
  parent_id: number | null;
  name?: { id?: string; en?: string };
  name_text?: string;
  slug?: string;
  status?: boolean;
  cover?: string | null;
  cover_url?: string | null;
};

type FormState = {
  name_id: string;
  name_en: string;
  slug: string;
  parent_id: string;
  status: boolean;
  cover_url: string;
};

const withNoCache = (url: string) => `${url}${url.includes("?") ? "&" : "?"}_=${Date.now()}`;

async function fetchJSON(input: string, init?: RequestInit) {
  const headers = new Headers(init?.headers || {});
  headers.set("Accept", "application/json");
  headers.set("X-Requested-With", "XMLHttpRequest");
  const res = await fetch(input, { ...init, headers, credentials: "include", cache: "no-store" });
  const text = await res.text().catch(() => "");
  const data = text ? JSON.parse(text) : {};
  return { ok: res.ok, status: res.status, data };
}

export default function EditCategoryPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);
  const router = useRouter();

  const [parentCategories, setParentCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormState>({
    name_id: "",
    name_en: "",
    slug: "",
    parent_id: "",
    status: true,
    cover_url: "",
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const t = e.target as HTMLInputElement;
    const { name, value, type, checked } = t;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Load data kategori & parent
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [listRes, parentsRes] = await Promise.all([
          fetchJSON(withNoCache(`/api/category?perPage=100`)),
          fetchJSON(withNoCache(`/api/category?status=active&perPage=100`)),
        ]);

        const list: ApiCategory[] =
          Array.isArray(listRes.data?.data)
            ? listRes.data.data
            : Array.isArray(listRes.data)
            ? listRes.data
            : Array.isArray(listRes.data?.data?.data)
            ? listRes.data.data.data
            : [];

        const parentsRaw: ApiCategory[] =
          Array.isArray(parentsRes.data?.data)
            ? parentsRes.data.data
            : Array.isArray(parentsRes.data)
            ? parentsRes.data
            : Array.isArray(parentsRes.data?.data?.data)
            ? parentsRes.data.data.data
            : [];

        // filter parent: hanya yang top-level & bukan dirinya sendiri
        const topLevelParents = parentsRaw.filter((p) => !p.parent_id && p.id !== id);

        if (!mounted) return;
        setParentCategories(topLevelParents);

        // detail kategori yg diedit
        const found = list.find((c) => c.id === id);
        if (found) {
          const foundParent =
            found.parent_id && found.parent_id !== found.id ? String(found.parent_id) : "";

          setFormData({
            name_id: found.name?.id || found.name_text || "",
            name_en: found.name?.en || "",
            slug: found.slug || "",
            parent_id: foundParent,
            status: !!found.status,
            cover_url: found.cover_url || found.cover || "",
          });
        } else {
          setError("Category not found");
        }
      } catch (e: any) {
        setError(e?.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const handleSaveChanges = async () => {
    setError(null);

    // cegah pilih diri sendiri
    if (formData.parent_id && Number(formData.parent_id) === id) {
      setFormData((prev) => ({ ...prev, parent_id: "" }));
      setError("Parent category tidak boleh diri sendiri.");
      return;
    }

    try {
      const url = `/api/category/${id}`;
      let res: Response;

      if (coverFile) {
        const fd = new FormData();
        fd.append("name[id]", formData.name_id);
        fd.append("name[en]", formData.name_en);
        if (formData.slug) fd.append("slug", formData.slug);
        if (formData.parent_id) fd.append("parent_id", String(Number(formData.parent_id)));
        fd.append("status", formData.status ? "1" : "0");
        fd.append("cover", coverFile);

        res = await fetch(url, { method: "PATCH", body: fd, credentials: "include", cache: "no-store" });
      } else {
        const payload = {
          name: { id: formData.name_id, en: formData.name_en },
          slug: formData.slug || undefined,
          parent_id: formData.parent_id ? Number(formData.parent_id) : null,
          status: !!formData.status,
        };

        res = await fetch(url, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
          credentials: "include",
          cache: "no-store",
        });
      }

      const txt = await res.text().catch(() => "");
      const json = txt ? JSON.parse(txt) : {};
      if (!res.ok) throw new Error(json?.message || `Failed to update (${res.status})`);

      console.log("✅ Category updated:", { id, response: json });
      router.push("/product-category");
      router.refresh(); // 🔄 paksa re-fetch data di App Router
    } catch (e: any) {
      console.error("❌ Error updating category:", e);
      setError(e?.message || "Failed to update");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this category?")) return;
    try {
      const res = await fetch(withNoCache(`/api/category/${id}`), { method: "DELETE", credentials: "include" });
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || `Failed to delete (${res.status})`);
      }
      router.push("/product-category");
      router.refresh();
    } catch (e: any) {
      setError(e?.message || "Failed to delete");
    }
  };

  const handleCancel = () => router.push("/product-category");

  return (
    <div className="min-h-full">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <span>Categories</span>
          <span className="text-gray-300">›</span>
          <span className="text-gray-600">Edit</span>
        </nav>
      </div>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Edit Category</h1>
          <DeleteButton onClick={handleDelete} />
        </div>
      </div>

      {/* Main */}
      <div className="bg-gray-50 min-h-screen">
        <div className="px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Category</h2>

                {error && (
                  <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </div>
                )}
                {loading && <div className="mb-4 text-sm text-gray-600">Loading…</div>}

                {/* Name ID */}
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

                {/* Name EN */}
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

                {/* Slug + Parent */}
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
                    >
                      <option value="">Select Parent Category</option>
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

                {/* Status */}
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

            {/* Right column (Cover upload) */}
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
                            URL.revokeObjectURL((e.target as HTMLImageElement).src);
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-4">
            <DraftButton onClick={handleSaveChanges}>Save Changes</DraftButton>
            <CancelButton onClick={() => router.push("/product-category")} />
          </div>
        </div>
      </div>
    </div>
  );
}