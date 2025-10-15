"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CreateButton, CancelButton } from "@/components/ui/ActionButton";
import { createUser } from "@/services/users.service";

export default function CreateUserPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErr, setFieldErr] = useState<{ name?: string; email?: string; password?: string }>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (fieldErr[name as keyof typeof fieldErr]) {
      setFieldErr((p) => ({ ...p, [name]: undefined }));
    }
  };

  const handleCreate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setErrorMsg(null);
    setFieldErr({});

    try {
      await createUser({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        status: true,
      });
      router.push("/users");
    } catch (err: any) {
      const msg = err?.message || "Failed to create user";
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => router.push("/users");

  return (
    <div className="min-h-full">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <nav className="flex items-center gap-2 text-sm text-gray-600">
          <a href="/dashboard" className="hover:underline">Dashboard</a>
          <span>/</span>
          <a href="/users" className="hover:underline">Users</a>
          <span>/</span>
          <span className="text-gray-900 font-medium">Create</span>
        </nav>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-900">Create User</h1>
      </div>

      {/* Content */}
      <div className="px-6 pb-10">
        <div className="rounded-lg border bg-white p-6">
          {errorMsg && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Left */}
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label htmlFor="name" className="mb-1 block text-xs font-medium text-slate-600">Name</label>
                <input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter full name"
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm text-black focus:border-[#0C3C66] focus:ring-[#0C3C66] ${
                    fieldErr.name ? "border-red-400" : "border-gray-300"
                  }`}
                />
                {fieldErr.name && <p className="mt-1 text-xs text-red-600">{fieldErr.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="mb-1 block text-xs font-medium text-slate-600">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="email@example.com"
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm text-black focus:border-[#0C3C66] focus:ring-[#0C3C66] ${
                    fieldErr.email ? "border-red-400" : "border-gray-300"
                  }`}
                />
                {fieldErr.email && <p className="mt-1 text-xs text-red-600">{fieldErr.email}</p>}
              </div>
            </div>

            {/* Right */}
            <div className="space-y-4">
              {/* Password */}
              <div>
                <label htmlFor="password" className="mb-1 block text-xs font-medium text-slate-600">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter password"
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm text-black focus:border-[#0C3C66] focus:ring-[#0C3C66] ${
                    fieldErr.password ? "border-red-400" : "border-gray-300"
                  }`}
                />
                {fieldErr.password && <p className="mt-1 text-xs text-red-600">{fieldErr.password}</p>}
              </div>
            </div>

            <button type="submit" className="hidden" />
          </form>

          {/* Actions */}
          <div className="mt-6 flex items-center gap-3">
            <CreateButton onClick={handleCreate} disabled={submitting}>
              {submitting ? "Saving..." : "Create"}
            </CreateButton>
            <CancelButton onClick={handleCancel}>Cancel</CancelButton>
          </div>
        </div>
      </div>
    </div>
  );
}