import { getCookie } from './cookies';

const baseURL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

type Params = Record<string, string | number | boolean | null | undefined> | undefined;
type Config = { params?: Params; headers?: Record<string, string> };

function withParams(url: string, params?: Params) {
  if (!params) return url;
  const u = new URL(url, 'http://dummy');
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') u.searchParams.set(k, String(v));
  });
  const path = u.pathname + (u.search ? `?${u.searchParams.toString()}` : '');
  return path;
}

function getToken() {
  try {
    return getCookie('access_token');
  } catch {
    return null;
  }
}

async function request<T>(method: string, path: string, body?: any, config?: Config) {
  const token = getToken();
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(method !== 'GET' && method !== 'DELETE' && !isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(config?.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const url = baseURL + withParams(path, config?.params);
  const init: RequestInit = {
    method,
    headers,
    cache: 'no-store',
  };
  if (body !== undefined) {
    init.body = isFormData ? body : (typeof body === 'string' ? body : JSON.stringify(body));
  }

  const res = await fetch(url, init);
  const status = res.status;
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const err: any = new Error((data && (data.message || data.error)) || `HTTP ${status}`);
    err.response = { status, data };
    throw err;
  }
  return { data: data as T, status, ok: res.ok };
}

export const api = {
  get: <T = any>(path: string, config?: Config) => request<T>('GET', path, undefined, config),
  delete: <T = any>(path: string, config?: Config) => request<T>('DELETE', path, undefined, config),
  post: <T = any>(path: string, data?: any, config?: Config) => request<T>('POST', path, data, config),
  patch: <T = any>(path: string, data?: any, config?: Config) => request<T>('PATCH', path, data, config),
};

export default api;
