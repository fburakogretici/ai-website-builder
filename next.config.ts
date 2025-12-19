import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

const nextConfig: NextConfig = {
  // Docker deployment - standalone output
  output: 'standalone',

  // Performance optimizations
  reactStrictMode: true,

  // Optimize bundle
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  // Allow images from Supabase
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fhwcguzotqwohfczxyqd.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },

  // Suppress the "message port closed" warning in development
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },

  // Disable x-powered-by header
  poweredByHeader: false,
};

export default withNextIntl(nextConfig);
