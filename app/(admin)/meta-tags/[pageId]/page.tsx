"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { EditButton } from "@/components/ui/EditIcon";
import { DeleteButton } from "@/components/ui/DeleteIcon";
import {
  createTag,
  deleteTag,
  getPageTags,
  updateTag,
  type MetaTagItem as MetaTagType,
} from "@/services/meta.service";
import { MetaTagModal } from "@/components/common/MetaTagModal";

type Locale = "id" | "en";
const LOCALES: Locale[] = ["id", "en"];
const ATTRS = ["name", "property", "http-equiv", "charset"] as const;

type ModalMode = "add" | "edit";

// Adapter untuk MetaTagModal lama
type LegacyModalData = { key: string; value: string; content: string };

export default function MetaTagDetailPage() {
  const params = useParams<{ pageId: string }>();
  const searchParams = useSearchParams();
  const pageId = Number(params.pageId); // ✅ valid kalau foldernya [pageId]
  const pageName = searchParams.get("name") || "Page";

  const [locale, setLocale] = useState<Locale>("id");
  const [tags, setTags] = useState<MetaTagType[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("add");
  const [editingTag, setEditingTag] = useState<MetaTagType | null>(null);

  const fetchTags = async () => {
    setLoading(true);
    try {
      // ✅ panggil dengan object params
      const res = await getPageTags(pageId, { locale });
      const items: MetaTagType[] = (res as any).data?.data ?? (res as any).data ?? [];
      const normalized = items.map((item) => ({
        ...item,
        attr: item.attr ?? (item.key as MetaTagType["attr"]) ?? "name",
        identifier: item.identifier ?? item.value ?? "",
      }));
      setTags(normalized);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!Number.isFinite(pageId)) return;
    fetchTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId, locale]);

  // Modal handlers
  const openAddModal = () => {
    setEditingTag(null);
    setModalMode("add");
    setIsModalOpen(true);
  };

  const openEditModal = (row: MetaTagType) => {
    setEditingTag(row);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTag(null);
  };

  const onSubmitModal = async (data: LegacyModalData) => {
    const attr = data.key as (typeof ATTRS)[number];
    if (!ATTRS.includes(attr)) {
      alert("Key harus salah satu dari: name, property, http-equiv, charset");
      return;
    }

    if (modalMode === "add") {
      await createTag(pageId, {
        locale,
        attr,
        identifier: data.value,
        content: data.content,
        is_active: true,
        sort_order: 0,
      } as any);
    } else if (modalMode === "edit" && editingTag) {
      await updateTag(pageId, editingTag.id, {
        attr,
        identifier: data.value,
        content: data.content,
      } as any);
    }
    closeModal();
    await fetchTags();
  };

  const toggleActive = async (row: MetaTagType) => {
    await updateTag(pageId, row.id, { is_active: !row.is_active });
    await fetchTags();
  };

  const bumpOrder = async (row: MetaTagType, delta = 1) => {
    await updateTag(pageId, row.id, { sort_order: (row.sort_order ?? 0) + delta });
    await fetchTags();
  };

  const remove = async (row: MetaTagType) => {
    if (!confirm("Hapus meta tag ini?")) return;
    await deleteTag(pageId, row.id);
    await fetchTags();
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
          <div className="flex items-center gap-3">
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as Locale)}
              className="rounded-full border px-3 py-2 text-sm"
            >
              {LOCALES.map((l) => (
                <option key={l} value={l}>
                  {l.toUpperCase()}
                </option>
              ))}
            </select>
            <button
              onClick={openAddModal}
              className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-[#003663] rounded-full hover:bg-[#002e55] transition-colors"
            >
              New Tag
            </button>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="bg-gray-50">
        <div className="px-6 py-6">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                {/* Sticky header biar enak scroll */}
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr className="text-left text-gray-600">
                    <th className="px-6 py-3 font-medium uppercase tracking-wide">Locale</th>
                    <th className="px-6 py-3 font-medium uppercase tracking-wide">Attr</th>
                    <th className="px-6 py-3 font-medium uppercase tracking-wide">Identifier</th>
                    <th className="px-6 py-3 font-medium uppercase tracking-wide w-[40%]">Content</th>
                    <th className="px-6 py-3 font-medium uppercase tracking-wide">Active</th>
                    <th className="px-6 py-3 font-medium uppercase tracking-wide">Order</th>
                    <th className="px-6 py-3 text-right font-medium uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {/* Loading state */}
                  {loading && (
                    <tr>
                      <td colSpan={7} className="px-6 py-6 text-gray-500">
                        Loading…
                      </td>
                    </tr>
                  )}

                  {/* Empty state */}
                  {!loading && tags.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center">
                        <div className="inline-flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-3 text-gray-500">
                          No tags for this locale. <button onClick={openAddModal} className="text-[#003663] font-medium hover:underline">Create one</button>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Rows */}
                  {!loading &&
                    tags.map((t, idx) => (
                      <tr
                        key={t.id}
                        className={idx % 2 ? "bg-gray-50/40 hover:bg-gray-50" : "hover:bg-gray-50"}
                      >
                        <td className="px-6 py-3 text-slate-900">{t.locale.toUpperCase()}</td>
                        <td className="px-6 py-3 text-slate-900 tabular-nums">{t.attr}</td>
                        <td className="px-6 py-3 text-slate-900">{t.identifier}</td>

                        <td className="px-6 py-3">
                          <div className="max-w-[48ch] truncate text-slate-900" title={t.content || ""}>
                            {t.content || <span className="text-gray-400">—</span>}
                          </div>
                        </td>

                        <td className="px-6 py-3">
                          <span
                            className={
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium " +
                              (t.is_active
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600")
                            }
                          >
                            <span
                              className={
                                "h-1.5 w-1.5 rounded-full " +
                                (t.is_active ? "bg-green-600" : "bg-gray-400")
                              }
                            />
                            {t.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td className="px-6 py-3 text-slate-900">{t.sort_order}</td>

                        <td className="px-6 py-3">
                          <div className="flex items-center justify-end gap-2">
                            {/* Edit */}
                            <button
                              onClick={() => openEditModal(t)}
                              className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-gray-50"
                              title="Edit"
                            >
                              ✏️ <span className="hidden sm:inline">Edit</span>
                            </button>

                            {/* Toggle */}
                            <button
                              onClick={() => toggleActive(t)}
                              className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-gray-50"
                              title={t.is_active ? "Deactivate" : "Activate"}
                            >
                              {t.is_active ? "⏸" : "▶️"}
                              <span className="hidden sm:inline">
                                {t.is_active ? "Deactivate" : "Activate"}
                              </span>
                            </button>

                            {/* Order +1 */}
                            <button
                              onClick={() => bumpOrder(t, +1)}
                              className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-gray-50"
                              title="Increase order"
                            >
                              ⬆️ <span className="hidden sm:inline">+Order</span>
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => remove(t)}
                              className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                              title="Delete"
                            >
                              🗑 <span className="hidden sm:inline">Delete</span>
                            </button>
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

      {/* Modal (adapter) */}
      <MetaTagModal
        isOpen={isModalOpen}
        onClose={closeModal}
        mode={modalMode}
        initialData={
          editingTag
            ? { key: editingTag.attr, value: editingTag.identifier, content: editingTag.content || "" }
            : undefined
        }
        onSubmit={(payload: LegacyModalData) => onSubmitModal(payload)}
      />
    </div>
  );
}
