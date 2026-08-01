'use client'

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
  const { add, setQty, items } = useCart()
  const count = items.find((line) => line.sku === product.sku)?.qty ?? 0

  if (!product.inStock) {
    return (
      <button type="button" disabled className={`btn-quiet w-full ${className ?? ''}`}>
        Out of stock
      </button>
    )
  }

  if (count > 0) {
    return (
      <div
        className={`flex h-10 w-full items-stretch overflow-hidden rounded-lg border border-brand-500 bg-brand-50 ${className ?? ''}`}
        role="group"
        aria-label={`Quantity of ${product.name} in cart`}
      >
        <button
          type="button"
          className="grid w-10 shrink-0 place-items-center text-brand-700 transition hover:bg-brand-100"
          aria-label={`Decrease quantity of ${product.name}`}
          onClick={() => setQty(product.sku, count - 1)}
        >
          <Icon.minus width={16} height={16} />
        </button>
        <span className="grid flex-1 place-items-center text-sm font-semibold tabular-nums text-ink-900">
          {count}
        </span>
        <button
          type="button"
          className="grid w-10 shrink-0 place-items-center text-brand-700 transition hover:bg-brand-100"
          aria-label={`Increase quantity of ${product.name}`}
          onClick={() => setQty(product.sku, count + 1)}
        >
          <Icon.plus width={16} height={16} />
        </button>
      </div>
    )
  }

  const cls =
    variant === 'primary' ? 'btn-primary' : variant === 'quiet' ? 'btn-quiet' : 'btn-outline'

  return (
    <button
      type="button"
      onClick={() => add(product, qty)}
      className={`${cls} w-full ${className ?? ''}`}
      aria-label={`Add ${product.name} to cart`}
    >
      <Icon.cart width={16} height={16} />
      {label ?? 'Add to cart'}
    </button>
  )
}
