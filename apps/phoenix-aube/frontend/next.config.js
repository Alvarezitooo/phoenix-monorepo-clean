/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🌅 SSR Mode pour interactivité React (pas d'export statique)
  // output: 'export',  // SUPPRIMÉ pour garder l'interactivité
  // distDir: 'out',    // SUPPRIMÉ 
  trailingSlash: true,
  
  // Build optimization
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { 
    unoptimized: true,
    domains: ['localhost', 'railway.app'] 
  },
  
  // Production build optimizations
  swcMinify: true,
  
  // Webpack configuration for better module resolution
  webpack: (config, { isServer }) => {
    // Ensure proper path resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, '.'),
    };
    return config;
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
  
  // Experimental features for better builds
  experimental: {
    forceSwcTransforms: true,
  },
};

module.exports = nextConfig;
