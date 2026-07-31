/**
 * Adapters between DynamoDB rows and the `@steryle/core` domain types the
 * storefront already renders.
 */
import type { Category, CategoryIconName, Product } from '@steryle/core/types'
import type { CategoryRow, ProductRow } from './types'

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
