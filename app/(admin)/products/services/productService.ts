import api from '@/lib/fetching';

export type ProductPayload = {
  name_id: string;
  name_en?: string;
  description_id?: string;
  description_en?: string;
  price?: number;
  stock?: number;
  category_id: number;
  status?: boolean;
  cover?: File | null;
};

export async function fetchProducts(params?: { search?: string; per_page?: number }) {
  return api.get('/products', { params });
}

export async function fetchProduct(id: number) {
  return api.get(`/products/${id}`);
}

export async function createProduct(payload: ProductPayload) {
  const fd = new FormData();
  fd.append('name[id]', payload.name_id);
  if (payload.name_en) fd.append('name[en]', payload.name_en);
  if (payload.description_id) fd.append('description[id]', payload.description_id);
  if (payload.description_en) fd.append('description[en]', payload.description_en);
  if (payload.price != null) fd.append('price', String(payload.price));
  if (payload.stock != null) fd.append('stock', String(payload.stock));
  fd.append('category_id', String(payload.category_id));
  fd.append('status', payload.status === false ? '0' : '1');
  if (payload.cover) fd.append('cover', payload.cover);
  return api.post('/products', fd as any);
}

export async function updateProduct(id: number, payload: ProductPayload) {
  const fd = new FormData();
  fd.append('name[id]', payload.name_id);
  if (payload.name_en) fd.append('name[en]', payload.name_en);
  if (payload.description_id) fd.append('description[id]', payload.description_id);
  if (payload.description_en) fd.append('description[en]', payload.description_en);
  if (payload.price != null) fd.append('price', String(payload.price));
  if (payload.stock != null) fd.append('stock', String(payload.stock));
  fd.append('category_id', String(payload.category_id));
  fd.append('status', payload.status === false ? '0' : '1');
  if (payload.cover) fd.append('cover', payload.cover);
  return api.patch(`/products/${id}`, fd as any);
}

export async function deleteProduct(id: number) {
  return api.delete(`/products/${id}`);
}

