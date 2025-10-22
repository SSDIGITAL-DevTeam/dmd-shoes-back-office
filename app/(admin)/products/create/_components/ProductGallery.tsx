"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

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
  onGalleryChange: (id: number, field: string, value: any) => void; // <- penting: izinkan File
}

export default function ProductGallery({
  galleries,
  onAddGallery,
  onRemoveGallery,
  onGalleryChange,
}: ProductGalleryProps) {
  /** Map preview object URL per item.id  */
  const [previews, setPreviews] = useState<Record<number, string>>({});
  /** Simpan refs file input per item.id supaya bisa di-trigger klik */
  const fileInputs = useRef<Record<number, HTMLInputElement | null>>({});

  /** Set berisi id yang ada saat ini, untuk mendeteksi item yang dihapus */
  const currentIds = useMemo(() => new Set(galleries.map((g) => g.id)), [galleries]);

  /** Cleanup previews untuk item yang sudah tidak ada lagi */
  useEffect(() => {
    setPreviews((prev) => {
      const next = { ...prev };
      for (const id of Object.keys(prev).map(Number)) {
        if (!currentIds.has(id) && next[id]) {
          URL.revokeObjectURL(next[id]);
          delete next[id];
        }
      }
      return next;
    });
    // juga bersihkan ref input yang tak terpakai
    for (const id of Object.keys(fileInputs.current).map(Number)) {
      if (!currentIds.has(id)) delete fileInputs.current[id];
    }
  }, [currentIds]);

  /** Cleanup semua previews saat unmount komponen */
  useEffect(() => {
    return () => {
      setPreviews((prev) => {
        for (const url of Object.values(prev)) URL.revokeObjectURL(url);
        return {};
      });
    };
  }, []);

  /** Handle upload & preview */
  const handlePreviewUpload = (e: React.ChangeEvent<HTMLInputElement>, id: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Revoke preview lama untuk id ini (kalau ada)
    setPreviews((prev) => {
      const next = { ...prev };
      if (next[id]) URL.revokeObjectURL(next[id]);
      next[id] = URL.createObjectURL(file);
      return next;
    });

    // Beritahu parent: simpan file + fileName ke state parent
    onGalleryChange(id, "file", file);
    onGalleryChange(id, "fileName", file.name || "image.jpg");
  };

  /** Klik area preview = klik file input */
  const handleDivClick = (id: number) => {
    fileInputs.current[id]?.click();
  };

  /** Saat klik remove, pastikan revoke preview dan reset input */
  const handleRemove = (id: number) => {
    // Revoke object URL
    setPreviews((prev) => {
      if (prev[id]) {
        URL.revokeObjectURL(prev[id]);
        const { [id]: _removed, ...rest } = prev;
        return rest;
      }
      return prev;
    });
    // Reset input file (kalau masih ada)
    const inp = fileInputs.current[id];
    if (inp) inp.value = "";
    delete fileInputs.current[id];

    // Panggil callback parent untuk benar-benar menghapus item
    onRemoveGallery(id);
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

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {galleries.map((gallery) => {
          const previewSrc = previews[gallery.id];
          const imageSrc = previewSrc || gallery.image || "";

          return (
            <div key={gallery.id} className="space-y-3">
              <div className="relative group">
                <div
                  className="aspect-square border-2 border-gray-800 rounded-lg overflow-hidden bg-gray-100 p-2 flex items-center justify-center cursor-pointer"
                  onClick={() => handleDivClick(gallery.id)}
                >
                  {imageSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
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
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Upload Image</span>
                    </div>
                  )}

                  {/* Input file tersembunyi — kunci dengan key berbasis id agar re-mount */}
                  <input
                    key={gallery.id}
                    ref={(el) => {
                      fileInputs.current[gallery.id] = el;
                    }}
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                    onChange={(e) => handlePreviewUpload(e, gallery.id)}
                  />
                </div>

                {(imageSrc || gallery.fileName) && (
                  <div className="absolute top-1 left-1 right-1 flex items-center justify-between bg-black/60 text-white text-xs px-2 py-1 rounded">
                    <div>
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M3 4a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm5 3a2 2 0 11-4 0 2 2 0 014 0zm7.5 7.5l-3-3-1.5 1.5-3-3L3 13.5V16h14v-1.5z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>{gallery.fileName || "image.png"}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(gallery.id)}
                      className="text-white hover:text-red-300 ml-2"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={gallery.title}
                  onChange={(e) => onGalleryChange(gallery.id, "title", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                  placeholder="Sneakers"
                />
              </div>

              {/* Alt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alt Text</label>
                <input
                  type="text"
                  value={gallery.alt}
                  onChange={(e) => onGalleryChange(gallery.id, "alt", e.target.value)}
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