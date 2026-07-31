import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@stryle/core', '@stryle/db'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'd29azk3rh443yy.cloudfront.net' },
      { protocol: 'https', hostname: 'loremflickr.com' },
      // Catalogue photography committed to the storefront's public folder is
      // served from the main site, not from the admin origin.
      { protocol: 'https', hostname: 'stryle.in' },
    ],
  },
  // The admin portal is never public; keep it out of search indexes entirely.
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
}

export default nextConfig
