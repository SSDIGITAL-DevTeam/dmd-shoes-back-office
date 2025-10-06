"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Pagination } from "@/components/layout/Pagination";

type StatsCardProps = {
  title: string;
  value: string | number;
  subtitle: string;
  href?: string;
};

function StatsCard({ title, value, subtitle, href }: StatsCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm/0 hover:shadow-sm transition-shadow">
      <h3 className="mb-2 text-xs font-medium text-gray-600">{title}</h3>
      <p className="mb-1 text-3xl font-semibold text-gray-900">{value}</p>
      {href ? (
        <Link
          href={href}
          className="text-sm font-medium text-blue-700 hover:underline"
        >
          {subtitle}
        </Link>
      ) : (
        <p className="text-sm text-blue-700">{subtitle}</p>
      )}
    </div>
  );
}

export default function DashboardPage() {
  // Customers preview (mirroring Customers page style)
  const sampleCustomers = [
    { id: 1, fullName: "Anakin Skywalker", email: "anakin@gmail.com", whatsappNumber: "+62-836-2839-1293" },
    { id: 2, fullName: "Anakin Skywalker", email: "anakin@gmail.com", whatsappNumber: "+62-836-2839-1293" },
    { id: 3, fullName: "Anakin Skywalker", email: "anakin@gmail.com", whatsappNumber: "-" },
    { id: 4, fullName: "Luke Skywalker", email: "luke@gmail.com", whatsappNumber: "+62-836-2839-1294" },
    { id: 5, fullName: "Leia Organa", email: "leia@gmail.com", whatsappNumber: "+62-836-2839-1295" },
    { id: 6, fullName: "Han Solo", email: "han@gmail.com", whatsappNumber: "-" },
    { id: 7, fullName: "Obi-Wan Kenobi", email: "obiwan@gmail.com", whatsappNumber: "+62-836-2839-1296" },
  ];

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(3);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sampleCustomers;
    return sampleCustomers.filter(
      (c) => c.fullName.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    );
  }, [query]);

  const totalItems = filtered.length;
  const startIndex = (page - 1) * pageSize;
  const current = filtered.slice(startIndex, startIndex + pageSize);

  React.useEffect(() => setPage(1), [query, pageSize]);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="mb-1 text-2xl font-semibold text-gray-900">Dashboard</h1>
        {/* Opsional: hapus jika tidak perlu, di desain aslinya kosong */}
        {/* <p className="text-gray-600">Welcome to DMD Shoes Admin Dashboard</p> */}
      </div>

      {/* Cards (3 kolom seperti desain) */}
      <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-3">
        <StatsCard
          title="Products"
          value={56}
          subtitle="Total of all products"
          href="/products"
        />
        <StatsCard
          title="Articles"
          value={12}
          subtitle="Total of all articles"
          href="/articles"
        />
        <StatsCard
          title="Product Category"
          value={8}
          subtitle="Total of all product category"
          href="/product-category"
        />
      </div>

      {/* Customers (preview) */}
      <div className="grid grid-cols-1 gap-6">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          {/* Header row: title + actions */}
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <h2 className="text-base font-semibold text-gray-900">Customers</h2>
            <div className="flex items-center gap-2">
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
              <Link href="/customers" className="text-sm font-medium text-blue-700 hover:underline">
                View all
              </Link>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Email</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">WhatsApp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {current.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{c.fullName}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-900">{c.email}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-900">{c.whatsappNumber}</div>
                    </td>
                  </tr>
                ))}
                {current.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500">No customers found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer: pagination */}
          <div className="border-t border-gray-200 px-4 py-3">
            <Pagination
              totalItems={totalItems}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[3, 5, 10]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------- helpers -------- */
function Item({ label, sub, time }: { label: string; sub: string; time: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
      <div>
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-sm text-gray-500">{sub}</p>
      </div>
      <span className="text-xs text-gray-400">{time}</span>
    </div>
  );
}

function Action({ title, sub }: { title: string; sub: string }) {
  return (
    <button className="rounded-lg border border-gray-200 p-4 text-left transition-colors hover:bg-gray-50">
      <div className="mb-1 font-medium text-gray-900">{title}</div>
      <div className="text-sm text-gray-500">{sub}</div>
    </button>
  );
}
