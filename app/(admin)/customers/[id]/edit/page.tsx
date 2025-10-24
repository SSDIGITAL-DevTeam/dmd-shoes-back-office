"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/fetching";
import { CancelButton, DraftButton } from "@/components/ui/ActionButton";
import { Toast } from "@/components/ui/Toast";

type CustomerApi = {
  status: string;
  data: {
    id: number;
    full_name: string;
    email: string;
    whatsapp_number: string;
  };
};

export default function EditCustomerPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string | undefined);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsApp, setWhatsApp] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [toast, setToast] = useState<{ show: boolean; msg: string; variant?: "success" | "error" }>({ show: false, msg: "" });

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const { data: customer } = await api.get<CustomerApi>(`/customers/${id}`);
        if (!mounted) return;
        setFullName(customer.full_name || "");
        setEmail(customer.email || "");
        setWhatsApp(customer.whatsapp_number || "");
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || "Gagal memuat data customer");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchData();
    return () => {
      mounted = false;
    };
  }, [id]);

  const emailValid = useMemo(() => /[^\s@]+@[^\s@]+\.[^\s@]+/.test(email), [email]);
  const nameValid = useMemo(() => fullName.trim().length > 0, [fullName]);
  const phoneValid = useMemo(() => /^\d*$/.test(whatsApp), [whatsApp]);
  const formValid = nameValid && emailValid && phoneValid;

  const onSave = async () => {
    if (!formValid || !id) {
      setTouched({ fullName: true, email: true, whatsApp: true });
      setToast({ show: true, msg: "Validasi gagal. Mohon periksa input Anda.", variant: "error" });
      return;
    }
    try {
      await api.patch(`/customers/${id}`, {
        full_name: fullName,
        email,
        whatsapp_number: whatsApp,
      });
      setToast({ show: true, msg: "Perubahan berhasil disimpan", variant: "success" });
    } catch (e: any) {
      setToast({ show: true, msg: e?.message || "Gagal menyimpan perubahan", variant: "error" });
    }
  };

  const onCancel = () => router.back();

  const breadcrumbName = fullName || (loading ? "Loading…" : "Customer");

  return (
    <div className="min-h-full">
      {/* Breadcrumb */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center text-sm text-gray-500" aria-label="Breadcrumb">
          <Link href="/customers" className="hover:text-gray-700">Customers</Link>
          <span className="mx-2 text-gray-300">›</span>
          <span className="truncate text-gray-600" title={breadcrumbName}>{breadcrumbName}</span>
          <span className="mx-2 text-gray-300">›</span>
          <span className="text-gray-900">Edit</span>
        </div>
      </div>

      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-6">
        <h1 className="text-2xl font-semibold text-gray-900">Edit Customer</h1>
      </div>

      {/* Content */}
      <div className="bg-gray-50">
        <div className="px-6 py-8">
          <div className="mx-auto w-full max-w-xl rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="px-6 py-6">
              {loading ? (
                <div className="space-y-5" aria-busy="true" aria-label="Loading form">
                  <div className="space-y-2">
                    <div className="h-4 w-28 rounded bg-gray-200" />
                    <div className="h-10 w-full rounded-lg bg-gray-200" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-16 rounded bg-gray-200" />
                    <div className="h-10 w-full rounded-lg bg-gray-200" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-40 rounded bg-gray-200" />
                    <div className="h-10 w-full rounded-lg bg-gray-200" />
                  </div>
                </div>
              ) : error ? (
                <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : (
                <form className="grid grid-cols-1 gap-5">
                  {/* Full Name */}
                  <div>
                    <label htmlFor="fullName" className="mb-2 block text-sm font-medium text-gray-700">Full Name</label>
                    <input
                      id="fullName"
                      name="fullName"
                      aria-label="Full Name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      onBlur={() => setTouched((t) => ({ ...t, fullName: true }))}
                      placeholder="Full name"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black placeholder:text-gray-400 outline-none transition focus:border-transparent focus:ring-2 focus:ring-amber-500"
                    />
                    {!nameValid && touched.fullName && (
                      <p className="mt-1 text-xs text-red-600">Nama wajib diisi.</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">Email</label>
                    <input
                      id="email"
                      name="email"
                      aria-label="Email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                      placeholder="email@domain.com"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black placeholder:text-gray-400 outline-none transition focus:border-transparent focus:ring-2 focus:ring-amber-500"
                    />
                    {!emailValid && touched.email && (
                      <p className="mt-1 text-xs text-red-600">Email tidak valid.</p>
                    )}
                  </div>

                  {/* WhatsApp Number */}
                  <div>
                    <label htmlFor="whatsapp" className="mb-2 block text-sm font-medium text-gray-700">WhatsApp Number</label>
                    <input
                      id="whatsapp"
                      name="whatsapp"
                      aria-label="WhatsApp Number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={whatsApp}
                      onChange={(e) => setWhatsApp(e.target.value)}
                      onBlur={() => setTouched((t) => ({ ...t, whatsApp: true }))}
                      placeholder="6281234567891"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black placeholder:text-gray-400 outline-none transition focus:border-transparent focus:ring-2 focus:ring-amber-500"
                    />
                    {!phoneValid && touched.whatsApp && (
                      <p className="mt-1 text-xs text-red-600">Nomor hanya boleh angka.</p>
                    )}
                  </div>
                </form>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 border-t border-gray-200 px-6 py-5">
              <DraftButton onClick={onSave} aria-label="Save Changes" disabled={!formValid || loading}>
                Save Changes
              </DraftButton>
              <CancelButton onClick={onCancel} aria-label="Cancel">
                Cancel
              </CancelButton>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      <Toast show={toast.show} message={toast.msg} variant={toast.variant} onClose={() => setToast({ show: false, msg: "" })} />
    </div>
  );
}

