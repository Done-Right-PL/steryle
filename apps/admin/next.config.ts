import type { NextConfig } from 'next'

const apiUrl = (
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8787'
).replace(/\/$/, '')

const nextConfig: NextConfig = {
  transpilePackages: ['@steryle/core', '@steryle/db'],
  serverExternalPackages: ['sst', '@aws-sdk/client-dynamodb', '@aws-sdk/lib-dynamodb'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'd29azk3rh443yy.cloudfront.net' },
      { protocol: 'https', hostname: 'loremflickr.com' },
      { protocol: 'https', hostname: 'steryle.in' },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'same-origin' },
        ],
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
