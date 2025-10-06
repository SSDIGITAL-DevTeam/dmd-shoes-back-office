"use client";

import React, { useState } from "react";
import { CreateButton, CreateAndContinueButton, CancelButton } from "@/components/ui/ActionButton";

export default function CreateCategoryPage() {
    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        parentCategory: "",
        cover: null as File | null,
    });

    const [dragActive, setDragActive] = useState(false);
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
        }
    };

    const handleCreate = () => {
        console.log("Creating category:", formData);
        // Add validation and API call logic here
    };

    const handleCreateAndContinue = () => {
        console.log("Creating category and continue:", formData);
        // Add validation, API call, and form reset logic here
    };

    const handleCancel = () => {
        console.log("Cancelling category creation");
        // Navigate back to categories list
        window.location.href = '/product-category';
    };

    return (
        <div className="min-h-full">
            {/* Breadcrumb */}
            <div className="bg-white border-b border-gray-200 px-6 py-3">
                <nav className="flex items-center gap-2 text-sm text-gray-500">
                    <span>Categories</span>
                    <span className="text-gray-300">›</span>
                    <span className="text-gray-600">List</span>
                </nav>
            </div>

            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-6">
                <h1 className="text-2xl font-semibold text-gray-900">New Category</h1>
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

                                    {/* File Upload Area */}
                                    <div
                                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive
                                                ? 'border-blue-400 bg-blue-50'
                                                : 'border-gray-300 hover:border-gray-400'
                                            }`}
                                        onDragEnter={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDragOver={handleDrag}
                                        onDrop={handleDrop}
                                    >
                                        {formData.cover ? (
                                            <div className="space-y-2">
                                                <div className="w-16 h-16 mx-auto bg-green-100 rounded-lg flex items-center justify-center">
                                                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </div>
                                                <p className="text-sm font-medium text-gray-900">{formData.cover.name}</p>
                                                <p className="text-xs text-gray-500">
                                                    {(formData.cover.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, cover: null }))}
                                                    className="text-sm text-red-600 hover:text-red-500"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-8 flex items-center gap-4">
                        <CreateButton onClick={handleCreate} />
                        <CancelButton onClick={handleCreateAndContinue}>Create & create another</CancelButton>
                        <CancelButton onClick={handleCancel} />
                    </div>
                </div>
            </div>
        </div>
    );
}