"use client";

import React, { useState } from "react";
import { CreateButton, CancelButton } from "@/components/ui/ActionButton";

export default function CreateUserPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreate = () => {
    console.log("Creating user:", formData);
    // TODO: validation + API call
  };

  const handleCancel = () => {
    console.log("Cancelling user creation");
    window.location.href = "/users";
  };

  return (
    <div className="min-h-full">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <span>Users</span>
          <span className="text-gray-300">›</span>
          <span className="text-gray-600">Create</span>
        </nav>
      </div>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <h1 className="text-2xl font-semibold text-gray-900">New User</h1>
      </div>

      {/* Main */}
      <div className="bg-gray-50 min-h-screen">
        <div className="px-6 py-6">
          <div className="max-w-full">
            {/* Form Card */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {/* Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter full name"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Password (full width) */}
                <div className="md:col-span-2">
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter password"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center gap-3">
              <CreateButton onClick={handleCreate}>Create</CreateButton>
              <CancelButton onClick={handleCancel}>Cancel</CancelButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}