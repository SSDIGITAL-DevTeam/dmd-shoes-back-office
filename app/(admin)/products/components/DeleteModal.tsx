"use client";
import React from 'react';

export function DeleteModal({ open, name, onConfirm, onCancel }: { open: boolean; name?: string; onConfirm: () => void; onCancel: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900">Delete Product</h3>
        <p className="mt-2 text-sm text-gray-600">Are you sure you want to delete {name ? <span className="font-medium">{name}</span> : 'this product'}? This action cannot be undone.</p>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onCancel} className="rounded-md border border-gray-200 px-3 py-2 text-sm">Cancel</button>
          <button onClick={onConfirm} className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700">Delete</button>
        </div>
      </div>
    </div>
  );
}

