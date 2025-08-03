import path from 'path'
import type { NextConfig } from 'next'

// Determine backend base URL, default to local dev if not set

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },

  webpack(config) {
    // Handle PDF.js and Tesseract.js dependencies
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
      // PDF.js server-side compatibility
      canvas: false,
    }

    // Externalize problematic dependencies for server-side rendering
    config.externals = config.externals || {}
    if (config.externals && !Array.isArray(config.externals)) {
      config.externals['canvas'] = 'canvas'
    }

    // Handle web workers for Tesseract.js
    config.module = config.module || {}
    config.module.rules = config.module.rules || []
    config.module.rules.push({
      test: /\.worker\.js$/,
      use: { loader: 'worker-loader' }
    })

    return config
  },
}

export default nextConfig
