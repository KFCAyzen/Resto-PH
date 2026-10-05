/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'firebasestorage.googleapis.com' }],
    formats: ['image/webp', 'image/avif'],
  },
};

module.exports = nextConfig;
