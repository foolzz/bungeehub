/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  env: {
    API_URL: process.env.API_URL || 'http://localhost:8080/api/v1',
  },
  // Disable caching during development to prevent stale JavaScript issues
  generateBuildId: async () => {
    // Use timestamp to ensure cache busting on every build
    return `build-${Date.now()}`
  },
  // Add headers to prevent aggressive browser caching
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
