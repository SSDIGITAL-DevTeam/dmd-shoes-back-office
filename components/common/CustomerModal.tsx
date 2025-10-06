import React, { useEffect, useMemo, useState } from "react";
import { CreateButton, CancelButton, DraftButton } from "@/components/ui/ActionButton";

export type CustomerStatus = "active" | "non-active";

export type CustomerFormData = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  status: CustomerStatus;
};

type Props = {
  isOpen: boolean;
  mode: "add" | "edit";
  initialData?: Partial<CustomerFormData>;
  onClose: () => void;
  onSubmit: (data: CustomerFormData) => void;
};

const defaultData: CustomerFormData = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  status: "active",
};

export const CustomerModal: React.FC<Props> = ({ isOpen, mode, initialData, onClose, onSubmit }) => {
  const [data, setData] = useState<CustomerFormData>(defaultData);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isOpen) return;
    setData({ ...defaultData, ...initialData });
    setTouched({});
  }, [isOpen, initialData]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const setField = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setData((s) => ({ ...s, [name]: value } as CustomerFormData));
  };

  const markTouched = (name: string) => setTouched((t) => ({ ...t, [name]: true }));

  const emailValid = useMemo(() => /[^\s@]+@[^\s@]+\.[^\s@]+/.test(data.email), [data.email]);
  const phoneValid = useMemo(() => /^\d*$/.test(data.phone), [data.phone]);
  const nameValid = useMemo(() => data.fullName.trim().length > 0, [data.fullName]);

  const isValid = nameValid && emailValid && phoneValid;

  const handleSubmit = () => {
    if (!isValid) return;
    onSubmit({ ...data });
    onClose();
  };

  const title = mode === "add" ? "Add Customer" : "Edit Customer";
  const submitButton = mode === "add" ? (
    <CreateButton onClick={handleSubmit} aria-label="Add customer" disabled={!isValid}>Save</CreateButton>
  ) : (
    <DraftButton onClick={handleSubmit} aria-label="Save customer" disabled={!isValid}>Save</DraftButton>
  );

  if (!isOpen) return null;

  const onBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="customer-modal-title"
      onClick={onBackdropClick}
    >
      <div className="w-full max-w-3xl rounded-2xl border border-gray-200 bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
          <h2 id="customer-modal-title" className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="mb-2 block text-sm font-medium text-gray-700">Nama Lengkap</label>
              <input
                id="fullName"
                name="fullName"
                aria-label="Nama Lengkap"
                value={data.fullName}
                onChange={setField}
                onBlur={() => markTouched("fullName")}
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
                name="email"
                aria-label="Email"
                type="email"
                value={data.email}
                onChange={setField}
                onBlur={() => markTouched("email")}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                placeholder="email@domain.com"
              />
              {!emailValid && touched.email && (
                <p className="mt-1 text-xs text-red-600">Email tidak valid.</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="mb-2 block text-sm font-medium text-gray-700">Nomor Telepon</label>
              <input
                id="phone"
                name="phone"
                aria-label="Nomor Telepon"
                inputMode="numeric"
                pattern="[0-9]*"
                value={data.phone}
                onChange={setField}
                onBlur={() => markTouched("phone")}
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
                name="status"
                aria-label="Status"
                value={data.status}
                onChange={setField}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black focus:border-transparent focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Aktif</option>
                <option value="non-active">Nonaktif</option>
              </select>
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label htmlFor="address" className="mb-2 block text-sm font-medium text-gray-700">Alamat</label>
              <textarea
                id="address"
                name="address"
                aria-label="Alamat"
                rows={3}
                value={data.address}
                onChange={setField}
                className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm text-black placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                placeholder="Alamat lengkap"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 border-t border-gray-200 px-6 py-5">
          {submitButton}
          <CancelButton onClick={onClose} aria-label="Cancel" />
        </div>
      </div>
    </div>
  );
};

