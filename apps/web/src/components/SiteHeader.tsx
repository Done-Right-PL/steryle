'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { categories } from '@steryle/core'
import { useCart } from '@/lib/cart-store'
import { Icon, CategoryIcon } from './Icons'

const PRIMARY_NAV = categories.slice(0, 6)

export function SiteHeader() {
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [catOpen, setCatOpen] = useState(false)
  const { count, hydrated } = useCart()
  const router = useRouter()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  return (
    <header className="sticky top-0 z-50 border-b border-paper-200 bg-white/95 backdrop-blur">
      <div className="bg-gradient-to-r from-brand-600 to-accent-600 text-white">
        <div className="container-x flex h-9 items-center justify-between text-xs">
          <span className="hidden items-center gap-2 sm:flex">
            <Icon.truck width={15} height={15} /> Free shipping on orders over ₹999
          </span>
          <div className="flex items-center gap-4">
            <a href="tel:+917822058149" className="flex items-center gap-1.5 hover:underline">
              <Icon.phone width={14} height={14} /> 7822058149
            </a>
            <span className="hidden sm:inline">GST invoice on all orders</span>
          </div>
        </div>
      </div>

      <div className="container-x flex h-16 items-center gap-4">
        <button
          type="button"
          className="btn-quiet -ml-2 lg:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <Icon.close /> : <Icon.menu />}
        </button>

        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-white">
            <Icon.plus width={20} height={20} />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-ink-900">
            Ster<span className="text-brand-600">yle</span>
          </span>
        </Link>

        <form onSubmit={submit} className="relative hidden flex-1 md:block">
          <Icon.search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
            width={18}
            height={18}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search instruments, sutures, gloves, SKU…"
            aria-label="Search products"
            className="field pl-10"
          />
        </form>

        <nav className="ml-auto flex items-center gap-1">
          <Link href="/account" className="btn-quiet hidden sm:inline-flex">
            <Icon.user width={20} height={20} />
            <span className="hidden lg:inline">Account</span>
          </Link>
          <Link href="/cart" className="btn-quiet relative">
            <Icon.cart width={20} height={20} />
            <span className="hidden lg:inline">Cart</span>
            {hydrated && count > 0 && (
              <span
                className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center
                  rounded-full bg-danger-600 px-1 text-[11px] font-bold text-white"
              >
                {count}
              </span>
            )}
          </Link>
        </nav>
      </div>

      <nav className="hidden border-t border-paper-100 bg-white lg:block">
        <div className="container-x flex h-11 items-center gap-1 overflow-x-auto">
          <div
            className="relative"
            onMouseEnter={() => setCatOpen(true)}
            onMouseLeave={() => setCatOpen(false)}
          >
            <Link
              href="/categories"
              className="flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5
                text-sm font-semibold text-brand-700 hover:bg-brand-50"
            >
              <Icon.menu width={16} height={16} /> All Categories
            </Link>
            {catOpen && (
              <div
                className="absolute left-0 top-full z-50 grid w-[34rem] grid-cols-2 gap-1
                  rounded-xl border border-paper-200 bg-white p-2 shadow-hover"
              >
                {categories.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/category/${c.slug}`}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm
                      text-ink-700 hover:bg-paper-50"
                  >
                    <CategoryIcon
                      name={c.icon}
                      width={18}
                      height={18}
                      className="text-brand-600"
                    />
                    <span className="flex-1">{c.name}</span>
                    <span className="text-xs text-ink-400">{c.productCount}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
          {PRIMARY_NAV.map((c) => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-ink-600
                hover:bg-paper-50 hover:text-brand-700"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </nav>

      {menuOpen && (
        <div className="border-t border-paper-200 bg-white lg:hidden">
          <div className="container-x py-3">
            <form onSubmit={submit} className="relative mb-3">
              <Icon.search
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
                width={18}
                height={18}
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products…"
                aria-label="Search products"
                className="field pl-10"
              />
            </form>
            <div className="grid grid-cols-2 gap-1">
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/category/${c.slug}`}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm
                    text-ink-700 hover:bg-paper-50"
                >
                  <CategoryIcon name={c.icon} width={16} height={16} className="text-brand-600" />
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
