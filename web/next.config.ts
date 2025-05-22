import path from 'path'
import type { NextConfig } from 'next'

// Determine backend base URL, default to local dev if not set

const nextConfig: NextConfig = {
  async rewrites() {
    const backend =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
    return [
      {
        source: '/api/:path*',
        destination: `${backend}/:path*`,
      },
    ];
  },

  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
    }
    return config
  },
}

export default nextConfig
