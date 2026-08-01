'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { Product } from '@steryle/core'
import { AddToCartButton } from './AddToCartButton'
import { useCart } from '@/lib/cart-store'
import { QtyStepper } from './QtyStepper'
import { WishlistButton } from './WishlistButton'

export function BuyPanel({ product }: { product: Product }) {
  const [qty, setQty] = useState(1)
  const { add } = useCart()
  const router = useRouter()

  const buyNow = () => {
    add(product, qty)
    router.push('/cart')
  }

  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
      <QtyStepper value={qty} onChange={setQty} disabled={!product.inStock} />
      <div className="flex flex-1 gap-3">
        <AddToCartButton product={product} qty={qty} variant="outline" />
        <button
          type="button"
          onClick={buyNow}
          disabled={!product.inStock}
          className="btn-primary flex-1"
        >
          Buy now
        </button>
        <WishlistButton product={product} />
      </div>
    </div>
  )
}
