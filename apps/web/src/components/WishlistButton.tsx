'use client'

import { useEffect, useState } from 'react'
import type { Product } from '@steryle/core'
import { apiFetch, useCustomer } from '@/lib/auth-store'
import { Icon } from './Icons'

export function WishlistButton({ product }: { product: Product }) {
  const { customer, hydrated } = useCustomer()
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!customer) {
      setSaved(false)
      return
    }
    void apiFetch('/api/account/wishlist')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { items?: Array<{ sku: string }> } | null) => {
        setSaved(Boolean(data?.items?.some((i) => i.sku === product.sku)))
      })
      .catch(() => null)
  }, [customer, product.sku])

  if (!hydrated) return null

  return (
    <button
      type="button"
      className={`btn-quiet h-9 w-9 !px-0 ${saved ? 'text-danger-600' : 'text-ink-400'}`}
      aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
      title={customer ? (saved ? 'Saved' : 'Save') : 'Sign in to save'}
      disabled={busy}
      onClick={async () => {
        if (!customer) {
          window.location.href = '/account'
          return
        }
        setBusy(true)
        try {
          if (saved) {
            const res = await apiFetch(`/api/account/wishlist/${encodeURIComponent(product.sku)}`, {
              method: 'DELETE',
            })
            if (res.ok) setSaved(false)
          } else {
            const res = await apiFetch('/api/account/wishlist', {
              method: 'POST',
              body: JSON.stringify({ sku: product.sku }),
            })
            if (res.ok) setSaved(true)
          }
        } finally {
          setBusy(false)
        }
      }}
    >
      <Icon.heart width={18} height={18} filled={saved} />
    </button>
  )
}
