'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/', label: 'Overview', exact: true },
  { href: '/customers', label: 'Customers' },
  { href: '/products', label: 'Catalogue' },
  { href: '/quotes', label: 'Quotes' },
  { href: '/notifications', label: 'Notifications' },
  { href: '/activity', label: 'Activity' },
] as const

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="space-y-0.5" aria-label="Sections">
      {LINKS.map((link) => {
        const isActive = link.exact
          ? pathname === link.href
          : pathname === link.href || pathname.startsWith(`${link.href}/`)

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? 'page' : undefined}
            className={`block border-l-2 py-2 pl-3 pr-2 text-[13px] transition-colors ${
              isActive
                ? 'border-ink font-medium text-ink'
                : 'border-transparent text-ink-400 hover:border-paper-300 hover:text-ink'
            }`}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
