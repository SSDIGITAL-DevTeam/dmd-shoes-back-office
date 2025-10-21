// app/users/[id]/edit/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DraftButton, CancelButton } from "@/components/ui/ActionButton";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { getUser, updateUser } from "@/services/users.service";

type FieldErrors = Record<string, string[]>;

export default function EditUserPage() {
  const params = useParams<{ id?: string }>();
  const id = params?.id ?? "";
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    status: true,
  });

  // helper: normalisasi error {key: string|string[]} -> string[]
  const normalizeErrors = (e: any): FieldErrors => {
    const out: FieldErrors = {};
    if (!e || typeof e !== "object") return out;
    for (const k of Object.keys(e)) {
      const v = (e as any)[k];
      out[k] = Array.isArray(v) ? v : [String(v)];
    }
    return out;
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      setErrors({});
      try {
        const res = await getUser(id);
        const u = (res && typeof res === "object" && "data" in res ? (res as any).data : res) ?? {};
        if (!alive) return;
        setFormData({
          name: u?.name ?? "",
          email: u?.email ?? "",
          status: u?.status === true || u?.status === 1 || u?.status === "1" || u?.status === "true",
        });
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || "Failed to load user");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  async function handleSaveChanges(e?: React.FormEvent) {
    e?.preventDefault();
    setSaving(true);
    setError(null);
    setErrors({});
    try {
      const res = await updateUser(id, {
        name: formData.name,
        email: formData.email,
        status: formData.status,
      });

      // jika backend mengembalikan errors (422), tangani di sini juga
      if ((res as any)?.errors) {
        setErrors(normalizeErrors((res as any).errors));
        setError((res as any)?.message || "Validation error.");
        setSaving(false);
        return;
      }

      router.push("/users");
      router.refresh();
    } catch (e: any) {
      if (e?.errors) {
        setErrors(normalizeErrors(e.errors));
        setError(e?.message || "Validation error.");
      } else {
        setError(e?.message || "Failed to update user");
      }
      setSaving(false);
    }
  }

  const FieldError = ({ name }: { name: string }) => {
    const msgs = errors?.[name];
    if (!msgs || msgs.length === 0) return null;
    return <p className="mt-1 text-xs text-red-600">{msgs.join(", ")}</p>;
  };

  return (
    <div className="min-h-full">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <span>Users</span>
          <span className="text-gray-300">›</span>
          <span className="text-gray-600">Edit</span>
        </nav>
      </div>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <h1 className="text-2xl font-semibold text-gray-900">Edit User</h1>
      </div>

      {/* Content */}
      <div className="bg-gray-50 min-h-screen">
        <div className="px-6 py-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-full">
            {error && (
              <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {loading ? (
              <div className="h-40 animate-pulse rounded bg-gray-100" />
            ) : (
              <form onSubmit={handleSaveChanges}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Name
                    </label>
                    <input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={(e) => setFormData((s) => ({ ...s, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                    />
                    <FieldError name="name" />
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData((s) => ({ ...s, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                    />
                    <FieldError name="email" />
                  </div>
                </div>

                {/* Status */}
                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Status</label>
                  <ToggleSwitch
                    checked={formData.status}
                    onChange={(v: boolean) => setFormData((s) => ({ ...s, status: v }))}
                    size="md"
                  />
                  <FieldError name="status" />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4">
                  {/* Gunakan prop loading bila komponen mendukung; kalau tidak, teks berubah sudah cukup */}
                  <DraftButton type="submit" disabled={saving} >
                    {saving ? "Saving..." : "Save Changes"}
                  </DraftButton>
                  <CancelButton onClick={() => router.back()} />
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}