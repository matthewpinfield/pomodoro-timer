import { PHASE_PRODUCTION_BUILD } from 'next/constants.js'

/** @type {import('next').NextConfig} */
const baseConfig = {
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

export default (phase) => {
  // output: 'export' + a custom distDir only make sense for the static
  // production build (GitHub Pages deploy). Applying them in `next dev`
  // makes the dev server watch its own build output as source changes,
  // causing an infinite recompile loop.
  if (phase === PHASE_PRODUCTION_BUILD) {
    return {
      ...baseConfig,
      output: 'export',
      distDir: 'dist',
    }
  }
  return baseConfig
}
