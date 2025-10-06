import React, { useState, useEffect, useCallback } from "react";
import { CreateButton, CancelButton, DraftButton } from "@/components/ui/ActionButton";

type MetaTagModalProps = {
  isOpen: boolean;
  onClose: () => void;
  mode: "add" | "edit";
  initialData?: {
    key: string;
    value: string;
    content: string;
  };
  onSubmit: (data: { key: string; value: string; content: string }) => void;
};

export const MetaTagModal: React.FC<MetaTagModalProps> = ({
  isOpen,
  onClose,
  mode,
  initialData,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({ key: "", value: "", content: "" });

  // Initialize
  useEffect(() => {
    if (mode === "edit" && initialData) {
      setFormData(initialData);
    } else {
      setFormData({ key: "", value: "", content: "" });
    }
  }, [mode, initialData, isOpen]);

  // Close on Esc
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    onSubmit(formData);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  const modalTitle = mode === "add" ? "Add Meta Tag" : "Edit Meta Tag";
  const submitButtonText = mode === "add" ? "Add Tag" : "Save Changes";

  const renderSubmitButton = () =>
    mode === "add" ? (
      <CreateButton onClick={handleSubmit}>{submitButtonText}</CreateButton>
    ) : (
      <DraftButton onClick={handleSubmit}>{submitButtonText}</DraftButton>
    );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="meta-tag-modal-title"
    >
      <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <h2 id="meta-tag-modal-title" className="text-xl font-semibold text-gray-900">
            {modalTitle}
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-5">
          {/* Key */}
          <div>
            <label htmlFor="key" className="mb-2 block text-sm font-medium text-gray-700">
              Key
            </label>
            <input
              type="text"
              id="key"
              name="key"
              value={formData.key}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              placeholder="Key..."
              autoFocus={mode === "add"}
            />
          </div>

          {/* Value */}
          <div>
            <label htmlFor="value" className="mb-2 block text-sm font-medium text-gray-700">
              Value
            </label>
            <input
              type="text"
              id="value"
              name="value"
              value={formData.value}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              placeholder="Value..."
            />
          </div>

          {/* Content (textarea, taller like screenshot) */}
          <div>
            <label htmlFor="content" className="mb-2 block text-sm font-medium text-gray-700">
              Content
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              rows={4}
              className="w-full min-h-[96px] resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm text-black placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              placeholder="Content..."
            />
          </div>
        </div>

        {/* Footer — left aligned buttons like the image */}
        <div className="flex items-center gap-3 px-6 py-5 border-t border-gray-200">
          {renderSubmitButton()}
          <CancelButton onClick={onClose} />
        </div>
      </div>
    </div>
  );
};