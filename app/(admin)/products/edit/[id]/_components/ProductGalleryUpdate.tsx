"use client";

import React, { useState, useRef } from "react";

interface Gallery {
  id: number;
  image: string;
  title: string;
  alt: string;
  fileName: string;
  uploading?: boolean;
}

interface ProductGalleryProps {
  galleries: Gallery[];
  onAddGallery: () => void;
  onRemoveGallery: (id: number) => void;
  onGalleryChange: (id: number, field: string, value: string) => void;
  // onImageUpload: (e: React.ChangeEvent<HTMLInputElement>, id: number) => void;
}

export default function ProductGallery({
  galleries,
  onAddGallery,
  onRemoveGallery,
  onGalleryChange,
  // onImageUpload,
}: ProductGalleryProps) {
  const [previews, setPreviews] = useState<Record<number, string>>({});
  const fileInputs = useRef<Record<number, HTMLInputElement | null>>({});

  const handlePreviewUpload = (e: React.ChangeEvent<HTMLInputElement>, id: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
  
    const previewUrl = URL.createObjectURL(file);
    setPreviews((prev) => ({ ...prev, [id]: previewUrl }));
  
    // panggil onGalleryChange khusus untuk file
    onGalleryChange(id, "file", file as any); // kita pakai type any agar fleksibel
  };

  const handleDivClick = (id: number) => {
    fileInputs.current[id]?.click();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Galleries</h2>
        <button
          type="button"
          onClick={onAddGallery}
          className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
        >
          Add Gallery
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {galleries.map((gallery) => {
          const imageSrc = previews[gallery.id] || gallery.image;

          return (
            <div key={gallery.id} className="space-y-3">
              <div className="relative group">
                <div
                  className="aspect-square border-2 border-gray-800 rounded-lg overflow-hidden bg-gray-100 p-2 flex items-center justify-center cursor-pointer"
                  onClick={() => handleDivClick(gallery.id)}
                >
                  {imageSrc ? (
                    <img
                      src={imageSrc}
                      alt={gallery.alt || "Preview"}
                      className="w-full h-full object-cover rounded"
                      onError={(e) => {
                        e.currentTarget.src =
                          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiNGM0Y0RjYiLz48cGF0aCBkPSJNMjAgMzBDMjYuNjI3NCAzMCAzMCAyNi42Mjc0IDMwIDIwQzMwIDEzLjM3MjYgMjYuNjI3NCAxMCAyMCAxMEMxMy4zNzI2IDEwIDEwIDEzLjM3MjYgMTAgMjBDMTAgMjYuNjI3NiAxMy4zNzI2IDMwIDIwIDMwWiIgc3Ryb2tlPSIjOUNBM0FGIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNMjAgMjRDMjIuMjA5MSAyNCAyNCAyMi4yMDkxIDI0IDIwQzI0IDE3Ljc5MDkgMjIuMjA5MSAxNiAyMCAxNkMxNy43OTA5IDE2IDE2IDE3Ljc5MDkgMTYgMjBDMTYgMjIuMjA5MSAxNy43OTA5IDI0IDIwIDI0WiIgc3Ryb2tlPSIjOUNBM0FGIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=";
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-500 text-sm hover:text-blue-500 transition">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-8 h-8 mb-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      <span>Upload Image</span>
                </div>
                  )}

                  {/* Input file tersembunyi */}
                  <input
                    ref={(el) => { fileInputs.current[gallery.id] = el; }}
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                    onChange={(e) => handlePreviewUpload(e, gallery.id)}
                  />
                </div>

                {imageSrc && (
                  <div className="absolute top-1 left-1 right-1 flex items-center justify-between bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                    <div>
                      <div className="flex items-center gap-1">
                        <svg
                          className="w-3 h-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M3 4a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm5 3a2 2 0 11-4 0 2 2 0 014 0zm7.5 7.5l-3-3-1.5 1.5-3-3L3 13.5V16h14v-1.5z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>{gallery.fileName || "image.png"}</span>
                      </div>
                      <div className="text-gray-300 text-xs">316 KB</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveGallery(gallery.id)}
                      className="text-white hover:text-red-300 ml-2"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              {/* Input Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={gallery.title}
                  onChange={(e) =>
                    onGalleryChange(gallery.id, "title", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                  placeholder="Sneakers"
                />
              </div>

              {/* Input Alt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alt Text
                </label>
                <input
                  type="text"
                  value={gallery.alt}
                  onChange={(e) =>
                    onGalleryChange(gallery.id, "alt", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                  placeholder="Slick formal sneaker shoes"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
