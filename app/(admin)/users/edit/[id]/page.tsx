"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DraftButton, CancelButton } from "@/components/ui/ActionButton";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { getUser, updateUser } from "@/services/users.service";

export default function EditUserPage() {
  const params = useParams();
  const id = (params as { id?: string }).id!;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({ name: "", email: "", status: true });

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const u = await getUser(id);
        if (!alive) return;
        setFormData({ name: u.name ?? "", email: u.email ?? "", status: Boolean(u.status) });
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || "Failed to load user");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  async function handleSaveChanges() {
    setSaving(true);
    setError(null);
    try {
      await updateUser(id, { name: formData.name, email: formData.email, status: formData.status });
      router.push("/users");
      router.refresh();
    } catch (e: any) {
      setError(e?.message || "Failed to update user");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-full">
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <span>Users</span><span className="text-gray-300">›</span><span className="text-gray-600">Edit</span>
        </nav>
      </div>

      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <h1 className="text-2xl font-semibold text-gray-900">Edit User</h1>
      </div>

      <div className="bg-gray-50 min-h-screen">
        <div className="px-6 py-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-full">
            {error && <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            {loading ? (
              <div className="h-40 animate-pulse rounded bg-gray-100" />
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <input
                      id="name" name="name" value={formData.name}
                      onChange={(e) => setFormData(s => ({ ...s, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      id="email" name="email" type="email" value={formData.email}
                      onChange={(e) => setFormData(s => ({ ...s, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                    />
                  </div>
                </div>

                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Status</label>
                  <ToggleSwitch checked={formData.status} onChange={(v) => setFormData(s => ({ ...s, status: v }))} size="md" />
                </div>

                <div className="flex items-center gap-4">
                  <DraftButton onClick={handleSaveChanges} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</DraftButton>
                  <CancelButton onClick={() => router.back()} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}