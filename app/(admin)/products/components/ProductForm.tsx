"use client";
import React, { useEffect, useState } from 'react';
import { CreateButton, CancelButton, DraftButton } from '@/components/ui/ActionButton';
import api from '@/lib/fetching';

type CategoryOption = { id: number; name: { id?: string; en?: string } | string };

export type ProductFormValues = {
  name_id: string;
  name_en?: string;
  description_id?: string;
  description_en?: string;
  price?: string;
  stock?: string;
  category_id: string;
  status: boolean;
  cover?: File | null;
};

export function ProductForm({
  initial,
  onSubmit,
  submitting,
  mode,
  onCancel,
}: {
  initial?: Partial<ProductFormValues>;
  onSubmit: (values: ProductFormValues) => void | Promise<void>;
  submitting?: boolean;
  mode: 'create' | 'edit';
  onCancel: () => void;
}) {
  const [values, setValues] = useState<ProductFormValues>({
    name_id: '',
    name_en: '',
    description_id: '',
    description_en: '',
    price: '',
    stock: '',
    category_id: '',
    status: true,
    cover: null,
    ...initial,
  });
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/categories', { params: { status: 'active', per_page: 100 } });
        const data = (res.data as any)?.data ?? [];
        setCategories(Array.isArray(data) ? data : []);
      } catch {}
    })();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setValues((v) => ({ ...v, [name]: type === 'checkbox' ? checked : value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!values.name_id) { setError('Name (ID) is required'); return; }
    if (!values.category_id) { setError('Category is required'); return; }
    await onSubmit(values);
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Product</h2>

            <div className="mb-6">
              <div className="mb-2 text-sm font-medium text-gray-700">Name (Bahasa Indonesia) <span className="text-red-500">*</span></div>
              <input name="name_id" value={values.name_id} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm text-black" placeholder="Nama produk" />
            </div>
            <div className="mb-6">
              <div className="mb-2 text-sm font-medium text-gray-700">Name (English)</div>
              <input name="name_en" value={values.name_en} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm text-black" placeholder="Product name" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                <input name="price" value={values.price || ''} onChange={handleChange} type="number" min="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm text-black" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stock</label>
                <input name="stock" value={values.stock || ''} onChange={handleChange} type="number" min="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm text-black" placeholder="0" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category <span className="text-red-500">*</span></label>
                <select name="category_id" value={values.category_id} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm text-black">
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{typeof c.name === 'string' ? c.name : (c.name.id || c.name.en || `#${c.id}`)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" name="status" checked={values.status} onChange={handleChange} className="h-4 w-4 rounded border-gray-300" />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-2 text-sm font-medium text-gray-700">Description (Bahasa Indonesia)</div>
              <textarea name="description_id" value={values.description_id} onChange={handleChange} className="w-full min-h-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm text-black" placeholder="Deskripsi" />
            </div>
            <div className="mt-6">
              <div className="mb-2 text-sm font-medium text-gray-700">Description (English)</div>
              <textarea name="description_en" value={values.description_en} onChange={handleChange} className="w-full min-h-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm text-black" placeholder="Description" />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cover</h3>
            <input type="file" accept="image/*" onChange={(e) => setValues((v) => ({ ...v, cover: e.target.files?.[0] || null }))} className="block w-full text-sm text-gray-900 file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-gray-700 hover:file:bg-gray-200" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {mode === 'create' ? (
          <CreateButton onClick={() => onSubmit(values)} />
        ) : (
          <DraftButton onClick={() => onSubmit(values)}>Save Changes</DraftButton>
        )}
        <CancelButton onClick={onCancel} />
      </div>
    </form>
  );
}

