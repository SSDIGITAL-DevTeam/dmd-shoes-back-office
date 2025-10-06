"use client";

import React, { useMemo, useState } from "react";
import { NewNounButton } from "@/components/ui/AddButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EditButton } from "@/components/ui/EditIcon";
import { DeleteButton } from "@/components/ui/DeleteIcon";
import { Pagination } from "@/components/layout/Pagination";

// Sample product data (cukup 3 baris untuk demo)
const sampleProducts = [
  { id: 1, cover: "/api/placeholder/50/50", name: "Slick formal sneaker shoes", category: "Sepatu", status: "active" as const },
  { id: 2, cover: "/api/placeholder/50/50", name: "Slick formal sneaker shoes", category: "Sepatu", status: "non-active" as const },
  { id: 3, cover: "/api/placeholder/50/50", name: "Slick formal sneaker shoes", category: "Sepatu", status: "active" as const },
];

export default function ProductsPage() {
  const [products] = useState(sampleProducts);
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(3);

  // search (nama/kategori)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [products, query]);

  const totalItems = filtered.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filtered.slice(startIndex, endIndex);

  // reset page saat query berubah
  React.useEffect(() => setCurrentPage(1), [query]);

  const handleEdit = (id: number) => {
    window.location.href = '/products/edit';
  };
  const handleDelete = (id: number) => console.log("Delete product:", id);
  const handleNewProduct = () => window.location.href = '/products/create';

  return (
    <div className="min-h-full">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center text-sm text-gray-500">
          <span>Products</span>
          <span className="mx-2 text-gray-300">›</span>
          <span className="text-gray-600">List</span>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
          <NewNounButton noun="product" onClick={handleNewProduct} />
        </div>
      </div>

      {/* Main */}
      <div className="bg-gray-50">
        <div className="px-6 py-6">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            {/* Toolbar kanan: search + bell + filter */}
            <div className="flex items-center justify-end gap-2 border-b border-gray-200 px-4 py-3">
              {/* Search */}
              <div className="relative">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search"
                  className="w-56 rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Bell dengan badge 0 */}
              <button className="relative inline-flex items-center justify-center rounded-md border border-gray-200 p-2 text-gray-500 hover:bg-gray-50">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .53-.21 1.05-.6 1.44L4 17h5m6 0v1a3 3 0 1 1-6 0v-1h6z"/>
                </svg>
                <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-semibold text-white">0</span>
              </button>

              {/* Filter icon (dummy agar mirip layout) */}
              <button className="inline-flex items-center justify-center rounded-md border border-gray-200 p-2 text-gray-500 hover:bg-gray-50">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 5h18M6 12h12M10 19h4" />
                </svg>
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-12 px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-6">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-6">Cover</th>
                    <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-6">
                      <div className="flex items-center gap-1">
                        <span>Name</span>
                        <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4M8 15l4 4 4-4" />
                        </svg>
                      </div>
                    </th>
                    <th className="hidden px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:table-cell sm:px-6">
                      <div className="flex items-center gap-1">
                        <span>Category</span>
                        <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4M8 15l4 4 4-4" />
                        </svg>
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-6">Status</th>
                    <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-6">Actions</th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {currentProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      {/* checkbox */}
                      <td className="whitespace-nowrap px-3 py-4 sm:px-6">
                        <input type="checkbox" className="rounded border-gray-300" />
                      </td>

                      {/* cover: 5 thumbnails kecil */}
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded overflow-hidden">
                          <img
                            src={product.cover}
                            alt="Product cover"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAzNkMzMC42Mjc0IDM2IDM2IDMwLjYyNzQgMzYgMjRDMzYgMTcuMzcyNiAzMC42Mjc0IDEyIDI0IDEyQzE3LjM3MjYgMTIgMTIgMTcuMzcyNiAxMiAyNEMxMiAzMC42Mjc0IDE3LjM3MjYgMzYgMjQgMzZaIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxwYXRoIGQ9Ik0yNCAyOEMyNi4yMDkxIDI4IDI4IDI2LjIwOTEgMjggMjRDMjggMjEuNzkwOSAyNi4yMDkxIDIwIDI0IDIwQzIxLjc5MDkgMjAgMjAgMjEuNzkwOSAyMCAyNEMyMCAyNi4yMDkxIDIxLjc5MDkgMjggMjQgMjhaIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=';
                            }}
                          />
                        </div>
                      </td>

                      {/* name */}
                      <td className="px-3 py-4 sm:px-6">
                        <div className="max-w-xs truncate text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                      </td>

                      {/* category */}
                      <td className="hidden whitespace-nowrap px-3 py-4 text-sm text-gray-900 sm:table-cell sm:px-6">
                        {product.category}
                      </td>

                      {/* status */}
                      <td className="whitespace-nowrap px-3 py-4 sm:px-6">
                        <StatusBadge status={product.status} />
                      </td>

                      {/* actions */}
                      <td className="whitespace-nowrap px-3 py-4 sm:px-6">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <EditButton onClick={() => handleEdit(product.id)} />
                          <DeleteButton onClick={() => handleDelete(product.id)} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer: divider + pagination di dalam card */}
            <div className="border-t border-gray-200 px-4 py-3">
              <Pagination
                totalItems={totalItems}
                page={currentPage}
                pageSize={itemsPerPage}
                onPageChange={setCurrentPage}
                onPageSizeChange={setItemsPerPage}
                pageSizeOptions={[3, 10, 25, 50]}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}