import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Determine backend base URL, default to local dev if not set

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },

  // Validate environment variables at build time
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },

  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: '^yarnnn\\.com$' }],
        destination: 'https://www.yarnnn.com/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: '^(?:www\\.)?rgtnow\\.com$' }],
        destination: 'https://www.yarnnn.com/:path*',
        permanent: true,
      },
    ]
  },

  async rewrites() {
    return [
      {
        source: '/docs',
        destination: 'https://proxy.gitbook.site/sites/site_k5Zot',
      },
      {
        source: '/docs/:path*',
        destination: 'https://proxy.gitbook.site/sites/site_k5Zot/:path*',
      },
    ]
  },

  experimental: {
    externalDir: true,
  },

  webpack(config, { isServer, dev }) {
    // Add build-time validation for production builds
    if (!dev && !isServer) {
      // Production client build
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      
      if (supabaseUrl?.includes('localhost') || supabaseUrl?.includes('127.0.0.1')) {
        throw new Error('Build error: Localhost Supabase URL detected in production build!');
      }
      
      if (apiUrl?.includes('localhost') || apiUrl?.includes('127.0.0.1')) {
        console.warn('Warning: Localhost API URL detected in production build!');
      }
    }
    // Handle PDF.js and Tesseract.js dependencies
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
      // '@shared': path.resolve(__dirname, './shared'), // Using @/shared instead
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
