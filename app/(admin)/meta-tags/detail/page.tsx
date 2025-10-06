"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { EditButton } from "@/components/ui/EditIcon";
import { DeleteButton } from "@/components/ui/DeleteIcon";
import { MetaTagModal } from "@/components/common/MetaTagModal";

// Sample meta tags data
const sampleMetaTags = [
  { id: 1, key: "name", value: "title", content: "Footwear Terlengkap" },
  { id: 2, key: "name", value: "description", content: "Footwear Terlengkap" },
  { id: 3, key: "name", value: "keyword", content: "Footwear Terlengkap" },
];

export default function MetaTagDetailPage() {
  const searchParams = useSearchParams();
  const pageName = searchParams.get('page') || 'Page';
  const [metaTags] = useState(sampleMetaTags);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingTag, setEditingTag] = useState<any>(null);

  const handleEdit = (id: number) => {
    const tag = metaTags.find(t => t.id === id);
    if (tag) {
      setEditingTag(tag);
      setModalMode("edit");
      setIsModalOpen(true);
    }
  };

  const handleDelete = (id: number) => {
    console.log("Delete meta tag:", id);
  };

  const handleNewTag = () => {
    setEditingTag(null);
    setModalMode("add");
    setIsModalOpen(true);
  };

  const handleModalSubmit = (data: { key: string; value: string; content: string }) => {
    if (modalMode === "add") {
      console.log("Adding new meta tag:", data);
    } else {
      console.log("Updating meta tag:", editingTag?.id, data);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingTag(null);
  };

  return (
    <div className="min-h-full">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center text-sm text-gray-500">
          <span>Meta tags</span>
          <span className="mx-2 text-gray-300">›</span>
          <span>Pages</span>
          <span className="mx-2 text-gray-300">›</span>
          <span className="text-gray-600">Edit Page : {pageName}</span>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Edit Page : {pageName}</h1>
          <button
            onClick={handleNewTag}
            className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-[#003663] rounded-full hover:bg-[#002e55] transition-colors"
          >
            New Tag
          </button>
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
                      Key
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Content
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {metaTags.map((tag) => (
                    <tr key={tag.id} className="hover:bg-gray-50">
                      {/* Key */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {tag.key}
                        </div>
                      </td>

                      {/* Value */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {tag.value}
                        </div>
                      </td>

                      {/* Content */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {tag.content}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-4">
                          <EditButton 
                            onClick={() => handleEdit(tag.id)}
                          />
                          <DeleteButton 
                            onClick={() => handleDelete(tag.id)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <MetaTagModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        mode={modalMode}
        initialData={editingTag ? {
          key: editingTag.key,
          value: editingTag.value,
          content: editingTag.content
        } : undefined}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
}