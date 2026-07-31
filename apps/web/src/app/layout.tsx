import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://steryle.in'),
  title: {
    default: 'Steryle — Surgical & medical supplies, sourced direct',
    template: '%s · Steryle',
  },
  description:
    'Over a thousand genuine surgical and medical supplies from 140+ trusted brands. Wholesale pricing, GST invoices, and delivery across India.',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="flex min-h-full flex-col font-sans">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  )
}
