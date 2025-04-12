/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove all export and dist directory settings for development
  // These will be added back during production builds
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || '',
  images: {
    unoptimized: true
  },
  trailingSlash: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  experimental: {
    optimizePackageImports: ['@/components']
  }
}

export default nextConfig
