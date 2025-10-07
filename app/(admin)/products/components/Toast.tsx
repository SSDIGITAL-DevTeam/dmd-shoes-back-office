"use client";
import React, { useEffect } from 'react';

export function Toast({ message, type = 'success', onClose }: { message: string; type?: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const id = setTimeout(onClose, 2500);
    return () => clearTimeout(id);
  }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 rounded-md px-4 py-2 text-sm shadow ${type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
      {message}
    </div>
  );
}

