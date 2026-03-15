/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  compress: true,

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    unoptimized: false,
  },
}

export default nextConfig
