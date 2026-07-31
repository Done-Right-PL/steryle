'use client'

import { useEffect, useState } from 'react'
import type { Product } from '@steryle/core'
import { useCart } from '@/lib/cart-store'
import { Icon } from './Icons'

interface Props {
  product: Product
  qty?: number
  variant?: 'primary' | 'outline' | 'quiet'
  label?: string
  className?: string
}

export function AddToCartButton({
  product,
  qty = 1,
  variant = 'outline',
  label,
  className,
}: Props) {
  const { add } = useCart()
  const [added, setAdded] = useState(false)

  useEffect(() => {
    if (!added) return
    const timer = setTimeout(() => setAdded(false), 1600)
    return () => clearTimeout(timer)
  }, [added])

  if (!product.inStock) {
    return (
      <button type="button" disabled className={`btn-quiet w-full ${className ?? ''}`}>
        Out of stock
      </button>
    )
  }

  const cls =
    variant === 'primary' ? 'btn-primary' : variant === 'quiet' ? 'btn-quiet' : 'btn-outline'

  return (
    <button
      type="button"
      onClick={() => {
        add(product, qty)
        setAdded(true)
      }}
      className={`${cls} w-full ${className ?? ''}`}
      aria-label={`Add ${product.name} to cart`}
    >
      {added ? (
        <>
          <Icon.check width={16} height={16} /> Added
        </>
      ) : (
        <>
          <Icon.cart width={16} height={16} />
          {label ?? 'Add to cart'}
        </>
      )}
    </button>
  )
}
