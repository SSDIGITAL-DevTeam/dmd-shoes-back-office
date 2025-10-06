"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function SetNewPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-sm p-8 sm:p-10">
        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-sm font-bold text-gray-700">DMD Shoes Admin</p>
          <h2 className="mt-2 text-xl font-semibold text-gray-900">
            Set a New Password
          </h2>
        </div>
        
        {/* Description */}
        <div className="mb-6">
          <p className="text-sm text-gray-900">
            Create a new password. Ensure it differs from previous ones for security
          </p>
        </div>

        {/* Form */}
        <form className="space-y-5">
          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                required
                placeholder="••••••••••••••••"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#003663] focus:outline-none focus:ring-2 focus:ring-[#003663]"
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((s) => !s)}
                className="absolute inset-y-0 right-2 my-auto inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-50"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                required
                placeholder="••••••••••••••••"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#003663] focus:outline-none focus:ring-2 focus:ring-[#003663]"
              />
              <button
                type="button"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                onClick={() => setShowConfirmPassword((s) => !s)}
                className="absolute inset-y-0 right-2 my-auto inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-50"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full rounded-md px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ backgroundColor: "#003663" }}
              onMouseOver={(e) => ((e.currentTarget.style.backgroundColor = "#002a4e"))}
              onMouseOut={(e) => ((e.currentTarget.style.backgroundColor = "#003663"))}
            >
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}