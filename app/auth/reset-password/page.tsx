"use client";

import React, { useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/password/forgot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Failed to send reset link');
      setMessage(data?.message || 'Reset email sent. Please check your inbox.');
    } catch (e: any) {
      setError(e?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-sm p-8 sm:p-10">
        <div className="text-center mb-6">
          <p className="text-sm font-bold text-gray-700">DMD Shoes Admin</p>
          <h2 className="mt-2 text-xl font-semibold text-gray-900">Forgot Password</h2>
        </div>
        <div>
          <p className="text-sm text-gray-900 pb-6">Please enter your email to reset the password</p>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}
        {message && (
          <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{message}</div>
        )}

        <form className="space-y-5" onSubmit={onSubmit}>
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
              Email address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="dmdshoes@mail.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#003663] focus:outline-none focus:ring-2 focus:ring-[#003663]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60"
            style={{ backgroundColor: '#003663' }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#002a4e')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#003663')}
          >
            {loading ? 'Sending...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

