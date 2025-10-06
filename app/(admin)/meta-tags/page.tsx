"use client";

import React, { useState } from "react";
import { EditButton } from "@/components/ui/EditIcon";

// Sample pages data
const samplePages = [
  { id: 1, name: "Beranda" },
  { id: 2, name: "Tentang Kami" },
  { id: 3, name: "Kontak Kami" },
];

export default function MetaTagsPage() {
  const [pages] = useState(samplePages);

  const handleEdit = (id: number, name: string) => {
    console.log("Edit meta tags for:", name);
    // Navigate to detail page with page name as query parameter
    window.location.href = `/meta-tags/detail?page=${encodeURIComponent(name)}`;
  };

  return (
    <div className="min-h-full">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center text-sm text-gray-500">
          <span>Meta tags</span>
          <span className="mx-2 text-gray-300">›</span>
          <span className="text-gray-600">Pages</span>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Pages</h1>
        </div>
      </div>

      {/* Main */}
      <div className="bg-gray-50">
        <div className="px-6 py-6">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Name
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {pages.map((page) => (
                    <tr key={page.id} className="hover:bg-gray-50">
                      {/* Name */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {page.name}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <EditButton 
                          onClick={() => handleEdit(page.id, page.name)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}