import type { CartLine, CartTotals, Product } from './types'

export const FREE_SHIPPING_THRESHOLD = 999
export const SHIPPING_FEE = 79
export const GST_RATE = 0.12

export type CartState = Record<string, CartLine>

export const toCartLine = (product: Product, qty: number): CartLine => ({
  sku: product.sku,
  name: product.name,
  slug: product.slug,
  brand: product.brand,
  price: product.price,
  image: product.images[0],
  qty,
})

export function addToCart(state: CartState, product: Product, qty = 1): CartState {
  const existing = state[product.sku]
  return { ...state, [product.sku]: toCartLine(product, (existing?.qty ?? 0) + qty) }
}

export function setCartQty(state: CartState, sku: string, qty: number): CartState {
  const line = state[sku]
  if (!line) return state
  if (qty <= 0) return removeFromCart(state, sku)
  return { ...state, [sku]: { ...line, qty } }
}

export function removeFromCart(state: CartState, sku: string): CartState {
  const next = { ...state }
  delete next[sku]
  return next
}

/**
 * Shipping is only charged on non-empty carts below the free-shipping
 * threshold, so an empty cart always totals zero.
 */
export function cartTotals(lines: CartLine[]): CartTotals {
  const count = lines.reduce((sum, l) => sum + l.qty, 0)
  const subtotal = lines.reduce((sum, l) => sum + l.qty * l.price, 0)
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE
  const tax = Math.round(subtotal * GST_RATE)
  return { count, subtotal, shipping, tax, total: subtotal + shipping + tax }
}

export const cartLines = (state: CartState): CartLine[] => Object.values(state)
