/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  
  // Disable SWC compilation
  compiler: {
    removeConsole: false,
  },
  
  webpack(config, { dev, isServer }) {
    // SVG handling
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    // Tree shaking optimization
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
      };
    }

    // Bundle analyzer (uncomment for analysis)
    // if (process.env.ANALYZE === 'true') {
    //   const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
    //   config.plugins.push(new BundleAnalyzerPlugin());
    // }

    return config;
  },

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  // Experimental features for optimization
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      'lucide-react',
      '@tanstack/react-query',
      'date-fns',
      'apexcharts',
    ],
  },

  // Compression
  compress: true,

  // Headers for caching and optimization
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, stale-while-revalidate=600',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Redirects for optimization
  async redirects() {
    return [
      {
        source: '/superadmin',
        destination: '/superadmin/dashboard',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
