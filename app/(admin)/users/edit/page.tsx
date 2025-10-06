"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DraftButton, CancelButton } from "@/components/ui/ActionButton";
import ToggleSwitch from "@/components/ui/ToggleSwitch";

// Sample user data - in real app this would come from API
const sampleUsers = [
  { id: 1, name: "admin", email: "admin@dmd.co.id", status: "active" },
  { id: 2, name: "admindmd", email: "admindmd@dmd.co.id", status: "non-active" },
];

export default function EditUserPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const userId = searchParams.get('id');
    
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        status: true // true for active, false for non-active
    });

    // Load user data based on ID
    useEffect(() => {
        if (userId) {
            const user = sampleUsers.find(u => u.id === parseInt(userId));
            if (user) {
                setFormData({
                    name: user.name,
                    email: user.email,
                    status: user.status === "active"
                });
            } else {
                // Default data for demo (admindmd)
                setFormData({
                    name: "admindmd",
                    email: "admindmd@dmd.co.id",
                    status: false
                });
            }
        }
    }, [userId]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleStatusChange = (value: boolean) => {
        setFormData(prev => ({
            ...prev,
            status: value
        }));
    };

    const handleSaveChanges = () => {
        console.log("Saving user changes:", formData);
        // Add validation and API call logic here
        // After successful save, redirect back to users page
        router.back();
    };

    const handleCancel = () => {
        console.log("Cancelling user edit");
        // Navigate back to previous page
        router.back();
    };

    return (
        <div className="min-h-full">
            {/* Breadcrumb */}
            <div className="bg-white border-b border-gray-200 px-6 py-3">
                <nav className="flex items-center gap-2 text-sm text-gray-500">
                    <span>Users</span>
                    <span className="text-gray-300">›</span>
                    <span className="text-gray-600">Edit</span>
                </nav>
            </div>

            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-6">
                <h1 className="text-2xl font-semibold text-gray-900">Edit User</h1>
            </div>

            {/* Main Content */}
            <div className="bg-gray-50 min-h-screen">
                <div className="px-6 py-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-full">
                        
                        {/* Form Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            
                            {/* Name Field */}
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                                />
                            </div>

                            {/* Email Field */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                                />
                            </div>
                        </div>

                        {/* Status Field */}
                        <div className="mb-8">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Status
                            </label>
                            <ToggleSwitch
                                checked={formData.status}
                                onChange={handleStatusChange}
                                size="md"
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-4">
                            <DraftButton onClick={handleSaveChanges}>
                                Save Changes
                            </DraftButton>
                            <CancelButton onClick={handleCancel} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}