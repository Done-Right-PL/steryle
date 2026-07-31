/**
 * Adapters between database rows and the `@stryle/core` domain types the
 * storefront already renders. Keeping the translation here means the web and
 * mobile apps can move off static JSON without touching their components.
 */
import type { Category, CategoryIconName, Product } from '@stryle/core/types'
import type { CategoryRow, ProductRow } from './schema'

/**
 * `discountPct` is derived rather than stored so it can never contradict the
 * price and MRP an admin just edited.
 */
export function discountPct(price: number, mrp: number): number {
  if (mrp <= 0 || price >= mrp) return 0
  return Math.round(((mrp - price) / mrp) * 100)
}

export function toProduct(row: ProductRow): Product {
  return {
    sku: row.sku,
    name: row.name,
    brand: row.brand,
    category: row.category,
    categorySlug: row.categorySlug,
    slug: row.slug,
    variant: row.variant,
    unit: row.unit,
    price: row.price,
    mrp: row.mrp,
    discountPct: discountPct(row.price, row.mrp),
    currency: row.currency,
    rating: row.rating,
    reviews: row.reviews,
    inStock: row.inStock,
    hsn: row.hsn ?? 0,
    description: row.description,
    highlights: row.highlights,
    images: row.images,
  }
}

export function toCategory(row: CategoryRow, productCount: number): Category {
  return {
    name: row.name,
    slug: row.slug,
    code: row.code,
    icon: row.icon as CategoryIconName,
    blurb: row.blurb,
    productCount,
  }
}
