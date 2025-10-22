"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { MetaPage } from "@/services/meta.service";
import { getPages } from "@/services/meta.service";
import { EditButton } from "@/components/ui/EditIcon";

export default function MetaTagsPage() {
  const [pages, setPages] = useState<MetaPage[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const res = await getPages();
        setPages(res.data || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleEdit = (page: MetaPage) => {
    router.push(
      `/meta-tags/${page.id}?name=${encodeURIComponent(page.name)}&slug=${encodeURIComponent(
        page.slug
      )}`
    );
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
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Slug
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td className="px-6 py-8 text-sm" colSpan={3}>
                        Loading…
                      </td>
                    </tr>
                  ) : pages.length === 0 ? (
                    <tr>
                      <td className="px-6 py-8 text-sm" colSpan={3}>
                        No pages
                      </td>
                    </tr>
                  ) : (
                    pages.map((page) => (
                      <tr key={page.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{page.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{page.slug}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <EditButton onClick={() => handleEdit(page)} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
