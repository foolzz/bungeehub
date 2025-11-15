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
}

module.exports = nextConfig
