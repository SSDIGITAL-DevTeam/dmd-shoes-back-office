"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DraftButton, CancelButton } from "@/components/ui/ActionButton";
import ToggleSwitch from "@/components/ui/ToggleSwitch";

type UserDetail = {
  id: number;
  name: string;
  email: string;
  status: boolean; // true=active, false=inactive
};

type Envelope<T> = { status?: string; message?: string; data?: T };

export default function EditUserPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    status: true,
  });

  // Load user by ID
  useEffect(() => {
    let mounted = true;
    const ac = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/users/${id}`, {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
          signal: ac.signal,
        });
        if (!res.ok) {
          const j = (await res.json().catch(() => null)) as Envelope<UserDetail> | null;
          throw new Error(j?.message || `Request failed with ${res.status}`);
        }
        const payload = (await res.json()) as Envelope<UserDetail>;
        const u = payload?.data as UserDetail;
        if (mounted && u) {
          setFormData({
            name: u.name ?? "",
            email: u.email ?? "",
            status: Boolean(u.status),
          });
        }
      } catch (e: any) {
        if (!mounted || e?.name === "AbortError") return;
        setError(e?.message || "Failed to load user");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (id) load();
    return () => {
      mounted = false;
      ac.abort();
    };
  }, [id]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleStatusChange(v: boolean) {
    setFormData((prev) => ({ ...prev, status: v }));
  }

  async function handleSaveChanges() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          status: formData.status, // applied only if actor is admin (handled by backend)
        }),
      });
      const j = (await res.json().catch(() => null)) as Envelope<UserDetail> | null;
      if (!res.ok) throw new Error(j?.message || `Request failed with ${res.status}`);
      setSuccess(j?.message || "User updated successfully");
      router.push("/users");
      router.refresh();
      // Optional: redirect back after a short delay
      // setTimeout(() => router.push("/users"), 600);
    } catch (e: any) {
      setError(e?.message || "Failed to update user");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    router.back();
  }

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

      {/* Main */}
      <div className="bg-gray-50 min-h-screen">
        <div className="px-6 py-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-full">
            {error && (
              <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {success}
              </div>
            )}

            {loading ? (
              <div className="h-40 animate-pulse rounded bg-gray-100" />
            ) : (
              <>
                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Name
                    </label>
                    <input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Status</label>
                  <ToggleSwitch checked={formData.status} onChange={handleStatusChange} size="md" />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4">
                  <DraftButton onClick={handleSaveChanges} disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                  </DraftButton>
                  <CancelButton onClick={handleCancel} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}