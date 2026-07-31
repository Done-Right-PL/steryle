import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@stryle/core'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'd29azk3rh443yy.cloudfront.net' },
      { protocol: 'https', hostname: 'loremflickr.com' },
    ],
  },
}

export default nextConfig
