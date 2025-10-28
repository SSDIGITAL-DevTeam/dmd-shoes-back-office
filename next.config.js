/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // ⛑️ Bypass Image Optimizer Next (aman untuk hosting statik & hilangkan /_next/image)
    unoptimized: true,

    // 🧯 Matikan AVIF, tetap dukung WebP bila device bisa; selain itu browser fallback ke JPEG/PNG asli
    formats: ["image/webp"],

    remotePatterns: [
      // Dev: Laravel local storage
      { protocol: "http", hostname: "127.0.0.1", port: "8000", pathname: "/storage/**" },
      { protocol: "http", hostname: "localhost", port: "8000", pathname: "/storage/**" },

      // Prod: API storage
      { protocol: "https", hostname: "api.dmdshoeparts.com", pathname: "/storage/**" },
      // Tambahkan root & www domain kalau suatu saat gambar diserve dari sana
      { protocol: "https", hostname: "dmdshoeparts.com", pathname: "/storage/**" },
      { protocol: "https", hostname: "www.dmdshoeparts.com", pathname: "/storage/**" },

      // Sumber lain yang dipakai
      { protocol: "https", hostname: "images.pexels.com", pathname: "/**" },
      { protocol: "https", hostname: "picsum.photos", pathname: "/**" },
    ],

    minimumCacheTTL: 60,
  },

  // kalau mau: biarkan build dev toleran
  typescript: { ignoreBuildErrors: process.env.NODE_ENV !== "production" },
};

module.exports = nextConfig;
