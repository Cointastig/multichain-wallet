// next.config.js
const isProd = process.env.NODE_ENV === 'production';
const isVercel = process.env.VERCEL === '1';

// Conditional PWA loading only for non-Vercel production builds
const withPWA = !isVercel && isProd ? require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: false,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/api\.coingecko\.com\/.*/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'coingecko-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 5,
        },
      },
    },
  ],
}) : (config) => config;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Force static generation for Vercel
  output: isVercel ? 'standalone' : undefined,
  images: {
    domains: [
      'assets.coingecko.com',
      'logos.covalenthq.com', 
      'raw.githubusercontent.com',
      'cryptologos.cc',
    ],
    // Add unoptimized for crypto logos that might fail
    unoptimized: isVercel,
  },
  experimental: {
    // Remove serverActions for better Vercel compatibility
    serverComponentsExternalPackages: ['bitcoinjs-lib', 'tiny-secp256k1'],
  },
  webpack: (config, { isServer, dev }) => {
    // Vercel-specific webpack configuration
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        util: false,
        buffer: false,
        path: false,
      };
      
      // Add buffer polyfill for crypto libraries
      config.resolve.alias = {
        ...config.resolve.alias,
        buffer: 'buffer',
      };
    }

    // Reduce bundle size in production
    if (!dev && isProd) {
      config.optimization = {
        ...config.optimization,
        sideEffects: false,
      };
    }

    return config;
  },
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
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
      // Ensure manifest.json is properly served
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/coingecko/:path*',
        destination: '/api/coingecko/:path*',
      },
    ];
  },
};

module.exports = withPWA(nextConfig);
