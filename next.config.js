/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Laravel local storage
      { protocol: 'http', hostname: '127.0.0.1', port: '8000', pathname: '/storage/**' },
      { protocol: 'http', hostname: 'localhost', port: '8000', pathname: '/storage/**' },

      // kalau kamu juga pakai pexels (sesuai data contoh)
      { protocol: 'https', hostname: 'images.pexels.com', pathname: '/photos/**' },
      { protocol: 'https', hostname: 'picsum.photos', pathname: '/**' },
    ],
    // atau sementara bisa pakai:
    // unoptimized: true, // (bypass optimizer Next — cepat buat ngetes)
  },
};

module.exports = nextConfig;