/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { 
    unoptimized: true,
    domains: ['localhost'] 
  },
  
  // API Proxy pour development et production
  async rewrites() {
    return process.env.NODE_ENV === 'development' ? [
      // En dev, proxy vers backend local
      {
        source: '/aube/:path*',
        destination: 'http://localhost:8001/aube/:path*',
      },
      {
        source: '/health',
        destination: 'http://localhost:8001/health',
      }
    ] : [
      // En prod, nginx gère déjà le proxy
    ];
  },
};

module.exports = nextConfig;
