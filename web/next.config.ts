import path from 'path'
import type { NextConfig } from 'next'

// Determine backend base URL, default to local dev if not set

const nextConfig: NextConfig = {
  async rewrites() {
    // Proxy only specific backend endpoints to Render-hosted API
    // Default to local backend run via 'uvicorn ... --port 10000'
    const backend = process.env.BACKEND_URL || "http://localhost:10000";
    return [
      {
        source: '/agent-run',
        destination: `${backend}/agent-run`,
      },
      {
        source: '/task-types/:path*',
        destination: `${backend}/task-types/:path*`,
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
