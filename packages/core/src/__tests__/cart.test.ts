import { describe, expect, it } from 'vitest'
import {
  addToCart,
  cartLines,
  cartTotals,
  removeFromCart,
  setCartQty,
  SHIPPING_FEE,
  type CartState,
} from '../cart'
import { categories, getProductsByCategory, products } from '../catalog'
import type { Product } from '../types'

const product = (over: Partial<Product> = {}): Product => ({
  sku: 'STR-T-1',
  name: 'Test Item',
  brand: 'Romsons',
  category: 'Wound Care',
  categorySlug: 'wound-care',
  slug: 'test-item',
  variant: 'Standard',
  unit: 'Pack of 1',
  price: 100,
  mrp: 200,
  discountPct: 50,
  currency: 'INR',
  rating: 4.5,
  reviews: 10,
  inStock: true,
  hsn: 9018,
  description: 'desc',
  highlights: [],
  images: ['https://example.test/a.webp'],
  ...over,
})

describe('cart mutations', () => {
  it('adds a product and accumulates quantity on repeat adds', () => {
    let state: CartState = {}
    state = addToCart(state, product(), 2)
    state = addToCart(state, product(), 3)
    expect(state['STR-T-1']?.qty).toBe(5)
  })

  it('captures the first image as the line thumbnail', () => {
    const state = addToCart({}, product(), 1)
    expect(state['STR-T-1']?.image).toBe('https://example.test/a.webp')
  })

  it('removes the line when quantity drops to zero', () => {
    const state = setCartQty(addToCart({}, product(), 1), 'STR-T-1', 0)
    expect(cartLines(state)).toHaveLength(0)
  })

  it('ignores quantity updates for unknown skus', () => {
    const state = setCartQty({}, 'nope', 4)
    expect(cartLines(state)).toHaveLength(0)
  })

  it('removes a line by sku', () => {
    const state = removeFromCart(addToCart({}, product(), 1), 'STR-T-1')
    expect(state['STR-T-1']).toBeUndefined()
  })
})

describe('cartTotals', () => {
  it('returns all zeroes for an empty cart', () => {
    expect(cartTotals([])).toEqual({ count: 0, subtotal: 0, shipping: 0, tax: 0, total: 0 })
  })

  it('charges shipping below the free-shipping threshold', () => {
    const totals = cartTotals(cartLines(addToCart({}, product({ price: 500 }), 1)))
    expect(totals.subtotal).toBe(500)
    expect(totals.shipping).toBe(SHIPPING_FEE)
    expect(totals.tax).toBe(60)
    expect(totals.total).toBe(639)
  })

  it('waives shipping at or above the threshold', () => {
    const totals = cartTotals(cartLines(addToCart({}, product({ price: 999 }), 1)))
    expect(totals.shipping).toBe(0)
    expect(totals.total).toBe(999 + Math.round(999 * 0.12))
  })
})

describe('catalogue data', () => {
  it('ships a non-empty catalogue with unique slugs', () => {
    expect(products.length).toBeGreaterThan(0)
    expect(new Set(products.map((p) => p.slug)).size).toBe(products.length)
  })

  it('ships unique skus', () => {
    expect(new Set(products.map((p) => p.sku)).size).toBe(products.length)
  })

  it('lists no pharmaceuticals or medicines', () => {
    const pharma = products.filter((p) => p.categorySlug === 'pharmaceuticals-medications')
    expect(pharma).toHaveLength(0)
    expect(categories.map((c) => c.slug)).not.toContain('pharmaceuticals-medications')
  })

  it('lists no beds, mattresses or mobility seating', () => {
    const bulky =
      /\b(icu bed|hospital bed|fowler|bedstead|air ?bed|mattress|wheel ?chair|commode|shower chair|stretcher|examination table|operating table|bed railing|railing for)\b/i
    expect(products.filter((p) => bulky.test(p.name))).toHaveLength(0)
  })

  it('lists no hospital soft furnishings', () => {
    const linen = /\b(bed ?sheet|linen|mackintosh|trolley sheet)\b/i
    const furnishings = products.filter(
      (p) => p.categorySlug === 'hospital-furniture-accessories' && linen.test(p.name),
    )
    expect(furnishings).toHaveLength(0)
  })

  it('keeps every category populated and counted correctly', () => {
    for (const category of categories) {
      expect(getProductsByCategory(category.slug)).toHaveLength(category.productCount)
      expect(category.productCount).toBeGreaterThan(0)
    }
  })
})
