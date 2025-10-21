// app/users/create/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createUser } from "@/services/users.service";
import { CreateButton, CancelButton } from "@/components/ui/ActionButton";
import ToggleSwitch from "@/components/ui/ToggleSwitch";

type FieldErrors = Record<string, string[]>;

export default function CreateUserPage() {
  const router = useRouter();

  // form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<boolean>(true);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  // ui state
  const [submitting, setSubmitting] = useState(false);
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});

  const normalizeErrors = (e: Record<string, string[] | string>): Record<string, string[]> => {
    const out: Record<string, string[]> = {};
    for (const k of Object.keys(e || {})) {
      const v = e[k];
      out[k] = Array.isArray(v) ? v : [String(v)];
    }
    return out;
  };

  const FieldError = ({ name }: { name: string }) => {
    const msgs = errors?.[name];
    if (!msgs || msgs.length === 0) return null;
    return <p className="mt-1 text-xs text-red-600">{msgs.join(", ")}</p>;
  };

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setServerMessage(null);
    setErrors({});
    try {
      const res = await createUser({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
        status,
      });

      if ((res as any)?.errors) {
        setErrors(normalizeErrors((res as any).errors));
        setServerMessage((res as any).message ?? "Validation error.");
        setSubmitting(false);
        return;
      }

      router.push("/users");
      router.refresh();
    } catch (err: any) {
      if (err?.errors) {
        setErrors(normalizeErrors(err.errors));
        setServerMessage(err?.message || "Validation error.");
      } else {
        setServerMessage(err?.message || "Failed to create user.");
      }
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-black">Create User</h1>
        <div className="flex items-center gap-3">
          <CancelButton onClick={() => router.push("/users")} />
          <CreateButton type="submit" form="create-user-form" />
        </div>
      </div>

      {serverMessage && <div className="mb-4 text-sm text-red-600">{serverMessage}</div>}

      <form id="create-user-form" onSubmit={onSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className="w-full rounded-lg border border-gray-300 text-black px-3 py-2"
            placeholder="Admin Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <FieldError name="name" />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            className="w-full rounded-lg border border-gray-300 text-black px-3 py-2"
            placeholder="admin@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <FieldError name="email" />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <div className="flex items-center gap-3">
            <ToggleSwitch checked={status} onChange={setStatus} />
            <span className="text-sm text-gray-500">{status ? "Active" : "Inactive"}</span>
          </div>
          <FieldError name="status" />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700  mb-2">
            Password <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            className="w-full rounded-lg border border-gray-300 text-black px-3 py-2"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <FieldError name="password" />
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confirm Password <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            className="w-full rounded-lg border border-gray-300 text-black px-3 py-2"
            placeholder="••••••••"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
          />
          <FieldError name="password_confirmation" />
        </div>
      </form>
    </div>
  );
}