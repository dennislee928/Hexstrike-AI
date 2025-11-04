/** @type {import('next').NextConfig} */

const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_HEXSTRIKE_API_URL: process.env.NEXT_PUBLIC_HEXSTRIKE_API_URL || 'https://hexstrike-ai.dennisleehappy.org',
  },
  // Disable server-side features for static export
  typescript: {
    // Don't fail build on type errors during development
    ignoreBuildErrors: false,
  },
  eslint: {
    // Don't fail build on lint errors during development
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig
