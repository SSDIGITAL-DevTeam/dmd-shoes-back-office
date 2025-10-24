/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Laravel local storage (dev)
      { protocol: 'http', hostname: '127.0.0.1', port: '8000', pathname: '/storage/**' },
      { protocol: 'http', hostname: 'localhost', port: '8000', pathname: '/storage/**' },

      // Production storage (env kamu mengarah ke https://api.dmdshoeparts.com/storage/)
      { protocol: 'https', hostname: 'api.dmdshoeparts.com', pathname: '/storage/**' },

      // Sumber gambar lain yang sudah dipakai
      { protocol: 'https', hostname: 'images.pexels.com', pathname: '/photos/**' },
      { protocol: 'https', hostname: 'picsum.photos', pathname: '/**' },
    ],
    // unoptimized: true, // <= Opsi sementara kalau masih ingin bypass optimizer Next
  },
};

module.exports = nextConfig;