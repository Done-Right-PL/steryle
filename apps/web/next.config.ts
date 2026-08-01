import type { NextConfig } from 'next'

const apiUrl = (
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8787'
).replace(/\/$/, '')

const nextConfig: NextConfig = {
  transpilePackages: ['@steryle/core'],
  serverExternalPackages: ['sst'],
  // Phone / other devices on the LAN opening http://<this-machine-ip>:4173
  allowedDevOrigins: ['192.168.68.101', '127.0.0.1', 'localhost'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'd29azk3rh443yy.cloudfront.net' },
      { protocol: 'https', hostname: 'loremflickr.com' },
    ],
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
