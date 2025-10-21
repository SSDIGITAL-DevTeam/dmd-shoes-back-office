// app/users/create/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createUser } from "@/services/users.service";

export default function CreateUserPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", status: true });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErr, setFieldErr] = useState<Record<string, string | undefined>>({});

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
    if (fieldErr[name]) setFieldErr((m) => ({ ...m, [name]: undefined }));
  };

  const onSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSubmitting(true);
    setError(null);
    setFieldErr({});
    try {
      await createUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        status: form.status,
      });
      router.push("/users");
    } catch (err: any) {
      const msg = err?.message || err?.data?.message || "Failed to create user";
      setError(msg);
      const errors = err?.errors || err?.data?.errors;
      if (errors && typeof errors === "object") {
        const m: Record<string, string> = {};
        Object.entries(errors).forEach(([k, v]: any) => (m[k] = Array.isArray(v) ? v[0] : String(v)));
        setFieldErr(m);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-full">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center text-sm text-gray-500">
          <button onClick={() => router.push("/users")} className="hover:underline">Users</button>
          <span className="mx-2 text-gray-300">›</span>
          <span className="text-gray-600">Create</span>
        </div>
      </div>

      <form onSubmit={onSubmit} className="px-6 py-6">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h1 className="text-2xl font-semibold text-gray-900">Create User</h1>
          </div>

          {error && (
            <div className="mx-6 mt-4 rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-6 px-6 py-6 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
              <input
                name="name"
                value={form.name}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Full name"
              />
              {fieldErr.name && <p className="mt-1 text-xs text-red-600">{fieldErr.name}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="fiqi@mail.com"
              />
              {fieldErr.email && <p className="mt-1 text-xs text-red-600">{fieldErr.email}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="••••••••"
              />
              {fieldErr.password && <p className="mt-1 text-xs text-red-600">{fieldErr.password}</p>}
            </div>

            <div className="flex items-center gap-3 pt-6">
              <input
                id="status"
                type="checkbox"
                name="status"
                checked={form.status}
                onChange={onChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="status" className="text-sm text-gray-700">
                Active
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-6 py-4">
            <button
              type="button"
              onClick={() => router.push("/users")}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Create"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}