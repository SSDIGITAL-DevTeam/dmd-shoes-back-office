"use client";

import React, { useState } from "react";
import { PublishButton, DraftButton, CancelButton, DeleteButton } from "@/components/ui/ActionButton";

export default function EditArticlePage() {
  // Pre-filled form data (simulating existing article)
  const [formData, setFormData] = useState({
    title: "Cara Memilih Sepatu Yang Cocok Dengan Vibes Kamu",
    slug: "cara-memilih-sepatu-yang-cocok-dengan-vibes-kamu",
    description: "Memilih sepatu yang tepat adalah investasi penting untuk kesehatan kaki dan penampilan. Sepatu yang baik bisa memberikan dukungan kaki yang tepat, juga, biasakan masalah postur. Ikatan menjaga seelum pentng untuk mempempertimbangkan fungsi, kenyamanan, dan kualitas sebelum memilih.",
    cover: null as File | null,
    tags: ["Tips Memilih Sepatu", "Cara memilih Sepatu"],
    seoTitle: "Cara Memilih Sepatu Yang Cocok Dengan Vibes Kamu",
    seoKeyword: "Cara Memilih Sepatu",
    seoDescription: "Memilih sepatu yang tepat adalah investasi penting untuk kesehatan kaki dan penampilan. Sepatu yang baik bisa memberikan dukungan kaki yang tepat, juga, biasakan masalah postur untuk menyehatkan kaki sangat penting untuk mempempertimbangkan fungsi, kenyamanan.",
  });

  const [dragActive, setDragActive] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [previewImage, setPreviewImage] = useState("/api/placeholder/400/200");

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        cover: file,
      }));
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      setFormData((prev) => ({
        ...prev,
        cover: files[0],
      }));
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string);
      };
      reader.readAsDataURL(files[0]);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handlePublish = () => {
    console.log("Publishing article:", formData);
  };

  const handleDraft = () => {
    console.log("Saving as draft:", formData);
  };

  const handleCancel = () => {
    console.log("Cancelling article edit");
    window.history.back();
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this article?")) {
      console.log("Deleting article");
    }
  };

  const formatDescription = (format: string) => {
    console.log("Formatting text:", format);
  };

  const insertElement = (element: string) => {
    console.log("Inserting element:", element);
  };

  return (
    <div className="min-h-full">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <span>Articles</span>
          <span className="text-gray-300">›</span>
          <span className="text-gray-600">Edit</span>
        </nav>
      </div>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Edit Article</h1>
          <DeleteButton onClick={handleDelete} />
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-gray-50 min-h-screen">
        <div className="px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Post Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">
                  Post
                </h2>

                {/* Title Field */}
                <div className="mb-6">
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                    placeholder="Enter article title"
                  />
                </div>

                {/* Slug Field */}
                <div className="mb-6">
                  <label
                    htmlFor="slug"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Slug <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="slug"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                    placeholder="article-slug"
                  />
                </div>

                {/* Description */}
                <div className="mb-6">
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Description <span className="text-red-500">*</span>
                  </label>

                  {/* Rich Text Toolbar */}
                  <div className="border border-gray-300 rounded-t-lg bg-gray-50 px-3 py-2 flex items-center gap-2">
                    {/* Toolbar buttons */}
                    <button
                      type="button"
                      onClick={() => formatDescription("bold")}
                      className="p-1.5 hover:bg-gray-200 rounded font-bold text-sm"
                    >
                      B
                    </button>
                    <button
                      type="button"
                      onClick={() => formatDescription("italic")}
                      className="p-1.5 hover:bg-gray-200 rounded italic text-sm"
                    >
                      I
                    </button>
                    <button
                      type="button"
                      onClick={() => formatDescription("underline")}
                      className="p-1.5 hover:bg-gray-200 rounded underline text-sm"
                    >
                      U
                    </button>
                    <div className="w-px h-4 bg-gray-300 mx-1"></div>
                    <button
                      type="button"
                      onClick={() => insertElement("link")}
                      className="p-1.5 hover:bg-gray-200 rounded text-sm"
                    >
                      🔗
                    </button>
                    <button
                      type="button"
                      onClick={() => insertElement("unordered-list")}
                      className="p-1.5 hover:bg-gray-200 rounded text-sm"
                    >
                      •
                    </button>
                    <button
                      type="button"
                      onClick={() => insertElement("ordered-list")}
                      className="p-1.5 hover:bg-gray-200 rounded text-sm"
                    >
                      1.
                    </button>
                    <button
                      type="button"
                      onClick={() => insertElement("quote")}
                      className="p-1.5 hover:bg-gray-200 rounded text-sm"
                    >
                      "
                    </button>
                    <button
                      type="button"
                      onClick={() => insertElement("image")}
                      className="p-1.5 hover:bg-gray-200 rounded text-sm"
                    >
                      📷
                    </button>
                  </div>

                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 border-t-0 rounded-b-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black resize-none"
                    placeholder="Write your article content here..."
                  />
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Cover */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Cover
                </h3>

                <div className="mb-4">
                  <label
                    htmlFor="cover"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Cover <span className="text-red-500">*</span>
                  </label>

                  {/* Image Preview */}
                  <div className="mb-4">
                    <img
                      src={previewImage}
                      alt="Article cover"
                      className="w-full h-40 object-cover rounded-lg border border-gray-200"
                      onError={(e) => {
                        e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiNGM0Y0RjYiLz48cGF0aCBkPSJNMjAgMzBDMjYuNjI3NCAzMCAzMCAyNi42Mjc0IDMwIDIwQzMwIDEzLjM3MjYgMjYuNjI3NCAxMCAyMCAxMEMxMy4zNzI2IDEwIDEwIDEzLjM3MjYgMTAgMjBDMTAgMjYuNjI3NiAxMy4zNzI2IDMwIDIwIDMwWiIgc3Ryb2tlPSIjOUNBM0FGIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNMjAgMjRDMjIuMjA5MSAyNCAyNCAyMi4yMDkxIDI0IDIwQzI0IDE3Ljc5MDkgMjIuMjA5MSAxNiAyMCAxNkMxNy43OTA5IDE2IDE2IDE3Ljc5MDkgMTYgMjBDMTYgMjIuMjA5MSAxNy43OTA5IDI0IDIwIDI0WiIgc3Ryb2tlPSIjOUNBM0FGIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=";
                      }}
                    />
                  </div>

                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      dragActive
                        ? "border-blue-400 bg-blue-50"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <div className="space-y-2">
                      <div className="w-12 h-12 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-600">
                        Drag & Drop your files or{" "}
                        <label
                          htmlFor="cover-input"
                          className="text-blue-600 hover:text-blue-500 cursor-pointer underline"
                        >
                          Browse
                        </label>
                      </p>
                      <input
                        id="cover-input"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className="mb-4">
                  <label
                    htmlFor="tags"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Tags
                  </label>
                  
                  {/* Existing Tags */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="text-blue-600 hover:text-blue-800 ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  
                  {/* Add New Tag */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                      placeholder="Add new tag..."
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* SEO */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  SEO
                </h3>

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="seoTitle"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Title
                    </label>
                    <input
                      type="text"
                      id="seoTitle"
                      name="seoTitle"
                      value={formData.seoTitle}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                      placeholder="SEO title"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="seoKeyword"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Keyword
                    </label>
                    <input
                      type="text"
                      id="seoKeyword"
                      name="seoKeyword"
                      value={formData.seoKeyword}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                      placeholder="SEO keywords"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="seoDescription"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Description
                    </label>
                    <textarea
                      id="seoDescription"
                      name="seoDescription"
                      value={formData.seoDescription}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black resize-none"
                      placeholder="SEO description"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex items-center gap-4">
            <PublishButton onClick={handlePublish} />
            <DraftButton onClick={handleDraft} />
            <CancelButton onClick={handleCancel} />
          </div>
        </div>
      </div>
    </div>
  );
}