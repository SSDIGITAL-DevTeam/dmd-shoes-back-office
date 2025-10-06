"use client";

import React, { useMemo, useState } from "react";
import { Pagination } from "@/components/layout/Pagination";
import { NewNounButton } from "@/components/ui/AddButton";
import { CustomerModal, CustomerFormData } from "@/components/common/CustomerModal";
import { Toast } from "@/components/ui/Toast";
import Link from "next/link";
import { Pencil } from "lucide-react";

// Sample customer data
const sampleCustomers = [
  { id: 1, fullName: "Anakin Skywalker", email: "anakin@gmail.com", whatsappNumber: "+62-836-2839-1293" },
  { id: 2, fullName: "Anakin Skywalker", email: "anakin@gmail.com", whatsappNumber: "+62-836-2839-1293" },
  { id: 3, fullName: "Anakin Skywalker", email: "anakin@gmail.com", whatsappNumber: "-" },
  // Add more sample data for pagination testing
  { id: 4, fullName: "Luke Skywalker", email: "luke@gmail.com", whatsappNumber: "+62-836-2839-1294" },
  { id: 5, fullName: "Leia Organa", email: "leia@gmail.com", whatsappNumber: "+62-836-2839-1295" },
  { id: 6, fullName: "Han Solo", email: "han@gmail.com", whatsappNumber: "-" },
  { id: 7, fullName: "Obi-Wan Kenobi", email: "obiwan@gmail.com", whatsappNumber: "+62-836-2839-1296" },
  { id: 8, fullName: "Yoda Master", email: "yoda@gmail.com", whatsappNumber: "+62-836-2839-1297" },
  { id: 9, fullName: "Darth Vader", email: "vader@gmail.com", whatsappNumber: "-" },
  { id: 10, fullName: "Padme Amidala", email: "padme@gmail.com", whatsappNumber: "+62-836-2839-1298" },
  { id: 11, fullName: "Mace Windu", email: "mace@gmail.com", whatsappNumber: "+62-836-2839-1299" },
  { id: 12, fullName: "Qui-Gon Jinn", email: "quigon@gmail.com", whatsappNumber: "+62-836-2839-1300" },
];

type Customer = {
  id: number;
  fullName: string;
  email: string;
  whatsappNumber: string;
  address?: string;
  status?: "active" | "non-active";
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>(sampleCustomers);
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(3);

  // Modal & toast state
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; msg: string; variant?: "success" | "error" }>({ show: false, msg: "" });

  const openAdd = () => {
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);

  const handleSubmit = (data: CustomerFormData) => {
    const newItem: Customer = {
      id: Math.max(0, ...customers.map((c) => c.id)) + 1,
      fullName: data.fullName,
      email: data.email,
      whatsappNumber: data.phone,
      address: data.address,
      status: data.status,
    };
    setCustomers((prev) => [newItem, ...prev]);
    setToast({ show: true, msg: "Customer berhasil ditambahkan", variant: "success" });
  };

  // Search filter (name/email)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
    );
  }, [customers, query]);

  const totalItems = filtered.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCustomers = filtered.slice(startIndex, endIndex);

  // Reset page when query changes
  React.useEffect(() => setCurrentPage(1), [query]);

  return (
    <>
    <div className="min-h-full">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center text-sm text-gray-500">
          <span>Customers</span>
          <span className="mx-2 text-gray-300">›</span>
          <span className="text-gray-600">List</span>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
        </div>
      </div>

      {/* Main */}
      <div className="bg-gray-50">
        <div className="px-6 py-6">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            {/* Toolbar: add + search */}
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <div>
                <NewNounButton noun="customer" onClick={openAdd} />
              </div>
              
              <div className="flex items-center gap-2">
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

                {/* Bell with badge 0 */}
                <button className="relative inline-flex items-center justify-center rounded-md border border-gray-200 p-2 text-gray-500 hover:bg-gray-50">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .53-.21 1.05-.6 1.44L4 17h5m6 0v1a3 3 0 1 1-6 0v-1h6z"/>
                  </svg>
                  <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-semibold text-white">0</span>
                </button>

                {/* Filter icon */}
                <button className="inline-flex items-center justify-center rounded-md border border-gray-200 p-2 text-gray-500 hover:bg-gray-50">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 5h18M6 12h12M10 19h4" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Full Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      WhatsApp Number
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {currentCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      {/* Full Name */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {customer.fullName}
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {customer.email}
                        </div>
                      </td>

                      {/* WhatsApp Number */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {customer.whatsappNumber}
                        </div>
                      </td>
                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Link
                          href={`/customers/edit/${customer.id}`}
                          aria-label={`Edit ${customer.fullName}`}
                          className="inline-flex items-center gap-2 text-sm font-medium text-[#D97706] hover:text-[#b46305] transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer: divider + pagination inside card */}
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

    {/* Modal */}
    <CustomerModal isOpen={modalOpen} mode="add" onClose={closeModal} onSubmit={handleSubmit} />

    {/* Toast */}
    <Toast show={toast.show} message={toast.msg} variant={toast.variant} onClose={() => setToast({ show: false, msg: "" })} />
  </>
  );
}
