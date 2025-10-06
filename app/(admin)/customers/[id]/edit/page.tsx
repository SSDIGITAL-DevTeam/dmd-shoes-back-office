"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CancelButton, DraftButton } from "@/components/ui/ActionButton";
import { Toast } from "@/components/ui/Toast";

type Status = "active" | "non-active";

type Customer = {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  status: Status;
};

// Temporary sample data (replace with API fetch)
const SAMPLE: Customer[] = [
  { id: 1, fullName: "Anakin Skywalker", email: "anakin@gmail.com", phone: "+62-836-2839-1293", address: "Tatooine", status: "active" },
  { id: 2, fullName: "Luke Skywalker", email: "luke@gmail.com", phone: "+62-836-2839-1294", address: "Ahch-To", status: "active" },
  { id: 3, fullName: "Leia Organa", email: "leia@gmail.com", phone: "+62-836-2839-1295", address: "Alderaan", status: "active" },
];

export default function EditCustomerPage() {
  const params = useParams();
  const router = useRouter();
  const idParam = Array.isArray(params?.id) ? params.id[0] : (params?.id as string | undefined);
  const current = useMemo(() => SAMPLE.find((c) => String(c.id) === String(idParam)), [idParam]);

  const [fullName, setFullName] = useState(current?.fullName ?? "");
  const [email, setEmail] = useState(current?.email ?? "");
  const [phone, setPhone] = useState(current?.phone ?? "");
  const [address, setAddress] = useState(current?.address ?? "");
  const [status, setStatus] = useState<Status>(current?.status ?? "active");
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [toast, setToast] = useState<{ show: boolean; msg: string; variant?: "success" | "error" }>({ show: false, msg: "" });

  useEffect(() => {
    // Prefill again when id changes
    if (!current) return;
    setFullName(current.fullName);
    setEmail(current.email);
    setPhone(current.phone);
    setAddress(current.address);
    setStatus(current.status);
  }, [current]);

  const emailValid = useMemo(() => /[^\s@]+@[^\s@]+\.[^\s@]+/.test(email), [email]);
  const phoneValid = useMemo(() => /^\d*$/.test(phone.replace(/[^0-9]/g, "")), [phone]);
  const nameValid = useMemo(() => fullName.trim().length > 0, [fullName]);
  const formValid = nameValid && emailValid && phoneValid;

  const onSave = () => {
    if (!formValid) {
      setTouched({ fullName: true, email: true, phone: true, address: true, status: true });
      setToast({ show: true, msg: "Validasi gagal. Mohon periksa input Anda.", variant: "error" });
      return;
    }
    // TODO: call API to update
    setToast({ show: true, msg: "Customer berhasil diperbarui", variant: "success" });
  };

  const onCancel = () => router.push("/customers");

  return (
    <div className="min-h-full">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center text-sm text-gray-500">
          <Link href="/dashboard" className="hover:text-gray-700">Dashboard</Link>
          <span className="mx-2 text-gray-300">›</span>
          <Link href="/customers" className="hover:text-gray-700">Customers</Link>
          <span className="mx-2 text-gray-300">›</span>
          <span className="text-gray-600">Edit Customer</span>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Edit Customer</h1>
        </div>
      </div>

      {/* Form container */}
      <div className="bg-gray-50">
        <div className="px-6 py-6">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            {/* Body */}
            <div className="px-6 py-6">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {/* Nama Lengkap */}
                <div>
                  <label htmlFor="fullName" className="mb-2 block text-sm font-medium text-gray-700">Nama Lengkap</label>
                  <input
                    id="fullName"
                    aria-label="Nama Lengkap"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, fullName: true }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    placeholder="Nama lengkap"
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
                    aria-label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    placeholder="email@domain.com"
                  />
                  {!emailValid && touched.email && (
                    <p className="mt-1 text-xs text-red-600">Email tidak valid.</p>
                  )}
                </div>

                {/* Nomor Telepon */}
                <div>
                  <label htmlFor="phone" className="mb-2 block text-sm font-medium text-gray-700">Nomor Telepon</label>
                  <input
                    id="phone"
                    aria-label="Nomor Telepon"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    placeholder="08123456789"
                  />
                  {!phoneValid && touched.phone && (
                    <p className="mt-1 text-xs text-red-600">Nomor telepon hanya angka.</p>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label htmlFor="status" className="mb-2 block text-sm font-medium text-gray-700">Status</label>
                  <select
                    id="status"
                    aria-label="Status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Status)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Aktif</option>
                    <option value="non-active">Nonaktif</option>
                  </select>
                </div>

                {/* Alamat */}
                <div className="md:col-span-2">
                  <label htmlFor="address" className="mb-2 block text-sm font-medium text-gray-700">Alamat</label>
                  <textarea
                    id="address"
                    aria-label="Alamat"
                    rows={3}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm text-black placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    placeholder="Alamat lengkap"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 border-t border-gray-200 px-6 py-5">
              <DraftButton onClick={onSave} aria-label="Save Changes" disabled={!formValid}>Save Changes</DraftButton>
              <CancelButton onClick={onCancel} aria-label="Cancel" />
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      <Toast show={toast.show} message={toast.msg} variant={toast.variant} onClose={() => setToast({ show: false, msg: "" })} />
    </div>
  );
}

