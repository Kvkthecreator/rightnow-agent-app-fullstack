import path from 'path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Set up your API proxy as before
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_BASE_URL}/:path*`,
      },
    ]
  },

  // Tell Webpack that `@` points at the project root (i.e. the `web/` folder)
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
    }
    return config
  },
}

export default nextConfig
