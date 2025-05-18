import path from 'path'
import type { NextConfig } from 'next'

// Fail-safe: Throw error if env is missing
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
if (!apiBaseUrl) {
  throw new Error('NEXT_PUBLIC_API_BASE_URL is not set! Please add it to your .env file and Vercel project settings.')
}

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiBaseUrl}/:path*`,
      },
    ]
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
