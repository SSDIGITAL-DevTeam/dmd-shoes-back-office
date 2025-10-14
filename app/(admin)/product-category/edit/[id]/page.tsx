"use client";

import React, { useEffect, useState } from "react";
import { DraftButton, CancelButton, DeleteButton } from "@/components/ui/ActionButton";
import api from "@/lib/fetching";
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

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);

  const [parentCategories, setParentCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name_id: "",
    name_en: "",
    slug: "",
    parent_id: "",
    status: true,
    cover_url: "",
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [listRes, allRes] = await Promise.all([
          api.get('/categories', { params: { per_page: 100 } }),
          api.get('/categories', { params: { status: 'active', per_page: 100 } }),
        ]);
        const all = Array.isArray(listRes.data?.data) ? listRes.data.data as ApiCategory[] : [];
        const parents = Array.isArray(allRes.data?.data) ? allRes.data.data as ApiCategory[] : [];
        if (!mounted) return;
        setParentCategories(parents);

        const found = all.find((c) => c.id === id);
        if (found) {
          setFormData({
            name_id: found.name?.id || found.name_text || "",
            name_en: found.name?.en || "",
            slug: found.slug || "",
            parent_id: found.parent_id ? String(found.parent_id) : "",
            status: !!found.status,
            cover_url: found.cover_url || found.cover || "",
          });
        } else {
          setError('Category not found');
        }
      } catch (e: any) {
        setError(e?.response?.data?.message || e?.message || 'Failed to load category');
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSaveChanges = async () => {
  setError(null);
  try {
    const fd = new FormData();
    fd.append("name[id]", formData.name_id);
    fd.append("name[en]", formData.name_en || "");
    if (formData.slug) fd.append("slug", formData.slug);
    if (formData.parent_id) fd.append("parent_id", String(Number(formData.parent_id)));
    fd.append("status", formData.status ? "1" : "0");
    if (coverFile) fd.append("cover", coverFile);
    else if (formData.cover_url) fd.append("cover_url", formData.cover_url);

    // Opsi A (paling aman): spoof PATCH via POST
    fd.append("_method", "PATCH");
    await api.post(`/categories/${id}`, fd); // <-- JANGAN kirim headers Content-Type
    router.push("/product-category");
    router.refresh();

    // Opsi B (kalau PATCH multipart diizinkan):
    // await api.patch(`/categories/${id}`, fd); // juga tanpa headers Content-Type

    router.replace("/product-category");
  } catch (e: any) {
    setError(e?.response?.data?.message || e?.message || "Failed to update category");
  }
};

  const handleCancel = () => router.push('/product-category');

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await api.delete(`/categories/${id}`);
      router.replace('/product-category');
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'Failed to delete');
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-600">Loading...</div>;
  }

  return (
    <div className="min-h-full">
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <span>Categories</span>
          <span className="text-gray-300">›</span>
          <span className="text-gray-600">Edit</span>
        </nav>
      </div>

      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Edit Category</h1>
          <DeleteButton onClick={handleDelete} />
        </div>
      </div>

      <div className="bg-gray-50 min-h-screen">
        <div className="px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Category</h2>

                {error && <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

                <div className="mb-6">
                  <div className="mb-2 text-sm font-medium text-gray-700">Name (Bahasa Indonesia) <span className="text-red-500">*</span></div>
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
                    <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">Slug</label>
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
                    <label htmlFor="parent_id" className="block text-sm font-medium text-gray-700 mb-2">Parent Category</label>
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
                          {typeof c.name === 'string' ? c.name : (c.name?.id || c.name?.en || `#${c.id}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" name="status" checked={formData.status} onChange={handleInputChange} className="h-4 w-4 rounded border-gray-300" />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Cover</h3>
                <div className="mb-4">
                  <label htmlFor="cover_file" className="block text-sm font-medium text-gray-700 mb-2">Cover File</label>
                  <input
                    id="cover_file"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      setCoverFile(f);
                    }}
                    className="block w-full text-sm text-gray-900 file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-gray-700 hover:file:bg-gray-200"
                  />
                  {(coverFile || formData.cover_url) && (
                    <div className="mt-3">
                      <img
                        src={coverFile ? URL.createObjectURL(coverFile) : formData.cover_url}
                        alt="Cover preview"
                        className="h-28 w-full max-w-xs rounded border object-cover"
                        onLoad={(e) => { if (coverFile) URL.revokeObjectURL((e.target as HTMLImageElement).src); }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-4">
            <DraftButton onClick={handleSaveChanges}>Save Changes</DraftButton>
            <CancelButton onClick={handleCancel} />
          </div>
        </div>
      </div>
    </div>
  );
}
