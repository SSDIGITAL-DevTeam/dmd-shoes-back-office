"use client";

import React, { useState } from "react";
import { DraftButton, CancelButton, DeleteButton } from "@/components/ui/ActionButton";

export default function EditCategoryPage() {
    // Pre-filled form data (simulating existing category)
    const [formData, setFormData] = useState({
        name: "Outsole Potong",
        slug: "outsole-potong",
        parentCategory: "Outsole",
        cover: null as File | null,
    });

    const [dragActive, setDragActive] = useState(false);
    const [previewImage, setPreviewImage] = useState("/api/placeholder/400/200");
    const [parentCategories] = useState([
        { id: 1, name: "Outsole" },
        { id: 2, name: "Insole Sepatu" },
        { id: 3, name: "Upper Material" },
        { id: 4, name: "Accessories" },
    ]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                cover: file
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
            setFormData(prev => ({
                ...prev,
                cover: files[0]
            }));
            // Create preview URL
            const reader = new FileReader();
            reader.onload = (e) => {
                setPreviewImage(e.target?.result as string);
            };
            reader.readAsDataURL(files[0]);
        }
    };

    const handleSaveChanges = () => {
        console.log("Saving category changes:", formData);
        // Add validation and API call logic here
    };

    const handleCancel = () => {
        console.log("Cancelling category edit");
        // Navigate back to categories list
        window.location.href = '/product-category';
    };

    const handleDelete = () => {
        if (confirm("Are you sure you want to delete this category?")) {
            console.log("Deleting category");
            // Add delete API call logic here
        }
    };

    return (
        <div className="min-h-full">
            {/* Breadcrumb */}
            <div className="bg-white border-b border-gray-200 px-6 py-3">
                <nav className="flex items-center gap-2 text-sm text-gray-500">
                    <span>Categories</span>
                    <span className="text-gray-300">›</span>
                    <span className="text-gray-600">Edit</span>
                </nav>
            </div>

            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold text-gray-900">Edit Category</h1>
                    <DeleteButton onClick={handleDelete} />
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-gray-50 min-h-screen">
                <div className="px-6 py-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Left Column - Category Form */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-6">Category</h2>

                                {/* Name Field */}
                                <div className="mb-6">
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                        Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                                        placeholder="Outsole Potong"
                                    />
                                </div>

                                {/* Slug Field */}
                                <div className="mb-6">
                                    <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
                                        Slug <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="slug"
                                        name="slug"
                                        value={formData.slug}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                                        placeholder="outsole-potong"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        A slug is a short, descriptive URL part, like "top-10-travel-destinations" for "Top 10 Travel Destinations."
                                    </p>
                                </div>

                                {/* Parent Category Field */}
                                <div className="mb-6">
                                    <label htmlFor="parentCategory" className="block text-sm font-medium text-gray-700 mb-2">
                                        Parent Category
                                    </label>
                                    <div className="mb-2">
                                        <label htmlFor="selectParentCategory" className="block text-sm text-gray-600 mb-1">
                                            Select Parent Category <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            id="selectParentCategory"
                                            name="parentCategory"
                                            value={formData.parentCategory}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white text-black"
                                        >
                                            <option value="">Select Parent Category</option>
                                            {parentCategories.map((category) => (
                                                <option key={category.id} value={category.name}>
                                                    {category.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Cover */}
                        <div className="space-y-6">
                            {/* Cover Section */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Cover</h3>

                                <div className="mb-4">
                                    <label htmlFor="cover" className="block text-sm font-medium text-gray-700 mb-2">
                                        Cover <span className="text-red-500">*</span>
                                    </label>

                                    {/* Image Preview */}
                                    <div className="mb-4">
                                        <img
                                            src={previewImage}
                                            alt="Category cover"
                                            className="w-full h-40 object-cover rounded-lg border border-gray-200"
                                            onError={(e) => {
                                                e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiNGM0Y0RjYiLz48cGF0aCBkPSJNMjAgMzBDMjYuNjI3NCAzMCAzMCAyNi42Mjc0IDMwIDIwQzMwIDEzLjM3MjYgMjYuNjI3NCAxMCAyMCAxMEMxMy4zNzI2IDEwIDEwIDEzLjM3MjYgMTAgMjBDMTAgMjYuNjI3NiAxMy4zNzI2IDMwIDIwIDMwWiIgc3Ryb2tlPSIjOUNBM0FGIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNMjAgMjRDMjIuMjA5MSAyNCAyNCAyMi4yMDkxIDI0IDIwQzI0IDE3Ljc5MDkgMjIuMjA5MSAxNiAyMCAxNkMxNy43OTA5IDE2IDE2IDE3Ljc5MDkgMTYgMjBDMTYgMjIuMjA5MSAxNy43OTA5IDI0IDIwIDI0WiIgc3Ryb2tlPSIjOUNBM0FGIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=";
                                            }}
                                        />
                                        <p className="text-xs text-gray-500 mt-1">file_name.jpg</p>
                                    </div>

                                    {/* File Upload Area */}
                                    <div
                                        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${dragActive
                                                ? 'border-blue-400 bg-blue-50'
                                                : 'border-gray-300 hover:border-gray-400'
                                            }`}
                                        onDragEnter={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDragOver={handleDrag}
                                        onDrop={handleDrop}
                                    >
                                        <div className="space-y-2">
                                            <div className="w-12 h-12 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                </svg>
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                Drag & Drop your files or{" "}
                                                <label htmlFor="cover-input" className="text-blue-600 hover:text-blue-500 cursor-pointer underline">
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
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-8 flex items-center gap-4">
                        <DraftButton onClick={handleSaveChanges}>Save Changes</DraftButton>
                        <CancelButton onClick={handleCancel} />
                    </div>
                </div>
            </div>
        </div>
    );
}