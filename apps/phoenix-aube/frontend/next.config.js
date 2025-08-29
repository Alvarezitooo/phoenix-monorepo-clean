/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // API Routes configuration
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NODE_ENV === 'production' 
          ? '/api/:path*'  // In production, API is served by FastAPI
          : 'http://localhost:8001/aube/:path*', // In dev, proxy to FastAPI
      },
    ]
  },

  // Static export for production (served by FastAPI)
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NODE_ENV === 'production' 
      ? '' // Same origin in production
      : 'http://localhost:8001',
  },

  // Build configuration
  distDir: '.next',
  
  // Disable server-side features for static export
  experimental: {
    esmExternals: 'loose',
  }
}

module.exports = nextConfig