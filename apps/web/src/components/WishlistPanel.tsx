'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatINR } from '@steryle/core'
import { apiFetch, useCustomer } from '@/lib/auth-store'

type WishItem = {
  sku: string
  name: string
  slug: string
  brand: string
  price: number
}

export function WishlistPanel() {
  const { customer, hydrated } = useCustomer()
  const [items, setItems] = useState<WishItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!customer) {
      setItems([])
      return
    }
    setLoading(true)
    void apiFetch('/api/account/wishlist')
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((data: { items?: WishItem[] }) => setItems(data.items ?? []))
      .finally(() => setLoading(false))
  }, [customer])

  if (!hydrated || !customer) return null

  return (
    <section className="mt-10">
      <h3 className="text-sm font-semibold text-ink-900">Wishlist</h3>
      {loading ? (
        <p className="mt-2 text-[13px] text-ink-400">Loading…</p>
      ) : items.length === 0 ? (
        <p className="mt-2 text-[13px] text-ink-400">
          Save products with the heart icon — they&apos;ll show up here.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-paper-200 rounded-xl border border-paper-200">
          {items.map((item) => (
            <li key={item.sku} className="flex items-center justify-between gap-3 px-4 py-3 text-[13px]">
              <div className="min-w-0">
                <Link href={`/product/${item.slug}`} className="font-medium text-ink hover:text-brand-700">
                  {item.name}
                </Link>
                <p className="text-ink-400">{item.brand}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="font-semibold">{formatINR(item.price)}</span>
                <button
                  type="button"
                  className="btn-quiet text-[12px]"
                  onClick={async () => {
                    await apiFetch(`/api/account/wishlist/${encodeURIComponent(item.sku)}`, {
                      method: 'DELETE',
                    })
                    setItems((prev) => prev.filter((i) => i.sku !== item.sku))
                  }}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
