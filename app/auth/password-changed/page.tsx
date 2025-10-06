"use client";

export default function PasswordChangedPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-sm p-8 sm:p-10">
        {/* Header */}
        <div className="text-center">
          <p className="text-sm font-bold text-gray-900">DMD Shoes Admin</p>
          <h2 className="mt-2 text-xl font-semibold text-gray-900">
            Password Has Been Changed
          </h2>
        </div>
        <div>
          <p className="mt-3 text-xs text-gray-900">
            Please return to the login page
          </p>
        </div>

        {/* Action */}
        <div className="mt-6">
          <a
            href="/auth/login"
            className="block w-full rounded-md px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{ backgroundColor: "#003663" }}
            onMouseOver={(e) =>
              (e.currentTarget.style.backgroundColor = "#002a4e")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.backgroundColor = "#003663")
            }
          >
            Back To Login Page
          </a>
        </div>
      </div>
    </div>
  );
}