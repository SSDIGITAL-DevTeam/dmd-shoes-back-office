"use client";

import React, { useMemo, useState, useEffect } from "react";
import { NewNounButton } from "@/components/ui/AddButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EditButton } from "@/components/ui/EditIcon";
import { DeleteButton } from "@/components/ui/DeleteIcon";
import { Pagination } from "@/components/layout/Pagination";

// Sample data
const sampleUsers = [
  { id: 1, name: "admin", email: "admin@dmd.co.id", status: "active" as const },
  { id: 2, name: "admindmd", email: "admindmd@dmd.co.id", status: "non-active" as const },
  { id: 3, name: "john.doe", email: "john@dmd.co.id", status: "active" as const },
  { id: 4, name: "jane.smith", email: "jane@dmd.co.id", status: "non-active" as const },
  { id: 5, name: "user1", email: "user1@dmd.co.id", status: "active" as const },
  { id: 6, name: "user2", email: "user2@dmd.co.id", status: "active" as const },
  { id: 7, name: "user3", email: "user3@dmd.co.id", status: "non-active" as const },
  { id: 8, name: "user4", email: "user4@dmd.co.id", status: "active" as const },
  { id: 9, name: "user5", email: "user5@dmd.co.id", status: "non-active" as const },
  { id: 10, name: "user6", email: "user6@dmd.co.id", status: "active" as const },
  { id: 11, name: "user7", email: "user7@dmd.co.id", status: "active" as const },
  { id: 12, name: "user8", email: "user8@dmd.co.id", status: "non-active" as const },
];

export default function UsersPage() {
  const [users] = useState(sampleUsers);
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(3);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "non-active">("all");

  const filtered = useMemo(() => {
    let result = users;
    if (statusFilter !== "all") result = result.filter(u => u.status === statusFilter);
    const q = query.trim().toLowerCase();
    if (q) result = result.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    return result;
  }, [users, query, statusFilter]);

  const totalItems = filtered.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filtered.slice(startIndex, endIndex);

  useEffect(() => setCurrentPage(1), [query, statusFilter]);

  const handleEdit = (id: number) => {
    console.log("Edit user:", id);
    window.location.href = `/users/edit?id=${id}`;
  };
  const handleDelete = (id: number) => console.log("Delete user:", id);
  const handleNewUser = () => window.location.href = '/users/create';

  const allCount = users.length;
  const activeCount = users.filter(u => u.status === "active").length;
  const nonActiveCount = users.filter(u => u.status === "non-active").length;

  return (
    <div className="min-h-full">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center text-sm text-gray-500">
          <span>Users</span>
          <span className="mx-2 text-gray-300">›</span>
          <span className="text-gray-600">List</span>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
          <NewNounButton noun="User" onClick={handleNewUser} />
        </div>
      </div>

      {/* Main */}
      <div className="bg-gray-50">
        <div className="px-6 py-6">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            {/* Tabs */}
            <div className="border-b border-gray-200 px-4 py-3">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    statusFilter === "all"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  All ({allCount})
                </button>
                <button
                  onClick={() => setStatusFilter("active")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    statusFilter === "active"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Active ({activeCount})
                </button>
                <button
                  onClick={() => setStatusFilter("non-active")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    statusFilter === "non-active"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Non Active ({nonActiveCount})
                </button>
              </nav>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-end gap-2 border-b border-gray-200 px-4 py-3">
              <div className="relative">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search"
                  className="w-56 rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm text-black placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <button className="relative inline-flex items-center justify-center rounded-md border border-gray-200 p-2 text-gray-500 hover:bg-gray-50">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .53-.21 1.05-.6 1.44L4 17h5m6 0v1a3 3 0 1 1-6 0v-1h6z"/>
                </svg>
                <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-semibold text-white">0</span>
              </button>

              <button className="inline-flex items-center justify-center rounded-md border border-gray-200 p-2 text-gray-500 hover:bg-gray-50">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 5h18M6 12h12M10 19h4" />
                </svg>
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full table-fixed divide-y divide-gray-200">
                {/* Fixed column widths to prevent shifting */}
                <colgroup>
                  <col className="w-[32%]" />
                  <col className="w-[38%]" />
                  <col className="w-[15%]" />
                  <col className="w-[15%]" />
                </colgroup>

                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Email
                    </th>
                    {/* right-aligned header for Status */}
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    {/* right-aligned header for Actions */}
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {currentUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      {/* Name (truncate so it can't push columns) */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="max-w-[280px] truncate text-sm font-medium text-gray-900">
                          {user.name}
                        </div>
                      </td>

                      {/* Email (truncate) */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="max-w-[360px] truncate text-sm text-gray-900">
                          {user.email}
                        </div>
                      </td>

                      {/* Status — flush right */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end">
                          <StatusBadge status={user.status} />
                        </div>
                      </td>

                      {/* Actions — flush right */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-4">
                          <EditButton onClick={() => handleEdit(user.id)} />
                          <DeleteButton onClick={() => handleDelete(user.id)} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
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