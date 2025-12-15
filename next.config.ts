import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'olcjmlvjtykcariimjbz.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Exclude ai-doc-review-main from compilation
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/ai-doc-review-main/**', '**/node_modules/**'],
    };
    return config;
  },
  // Generate unique build ID to prevent chunk mismatch
  generateBuildId: async () => {
    // Use timestamp to ensure unique build ID
    return `build-${Date.now()}`;
  },
  // Headers for better caching strategy
  async headers() {
    return [
      {
        // Apply to all static chunks
        source: '/_next/static/chunks/:path*',
        headers: [
          {
            key: 'Cache-Control',
            // Long cache but with revalidation - helps with chunk issues
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
