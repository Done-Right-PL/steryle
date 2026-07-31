import categoriesJson from './data/categories.json'
import productsJson from './data/products.json'
import type { Category, Product, SortKey } from './types'

export const categories = categoriesJson as Category[]
export const products = productsJson as Product[]

const productsBySlug = new Map(products.map((p) => [p.slug, p]))
const categoriesBySlug = new Map(categories.map((c) => [c.slug, c]))

export const getProductBySlug = (slug: string): Product | undefined => productsBySlug.get(slug)

export const getCategoryBySlug = (slug: string): Category | undefined =>
  categoriesBySlug.get(slug)

export const getProductsByCategory = (slug: string): Product[] =>
  products.filter((p) => p.categorySlug === slug)

export const getRelatedProducts = (product: Product, limit = 6): Product[] =>
  products
    .filter((p) => p.categorySlug === product.categorySlug && p.sku !== product.sku)
    .slice(0, limit)

export const allBrands: string[] = [...new Set(products.map((p) => p.brand))].sort((a, b) =>
  a.localeCompare(b),
)

export function getBrandsForCategory(slug: string): string[] {
  return [...new Set(getProductsByCategory(slug).map((p) => p.brand))].sort((a, b) =>
    a.localeCompare(b),
  )
}

export function searchProducts(query: string, limit = 60): Product[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const terms = q.split(/\s+/)
  return products
    .filter((p) => {
      const haystack = `${p.name} ${p.brand} ${p.category} ${p.sku} ${p.variant}`.toLowerCase()
      return terms.every((t) => haystack.includes(t))
    })
    .slice(0, limit)
}

export function sortProducts(list: Product[], key: SortKey): Product[] {
  const next = [...list]
  switch (key) {
    case 'price-asc':
      return next.sort((a, b) => a.price - b.price)
    case 'price-desc':
      return next.sort((a, b) => b.price - a.price)
    case 'rating':
      return next.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews)
    case 'discount':
      return next.sort((a, b) => b.discountPct - a.discountPct)
    default:
      return next
  }
}

/** Highest-discount in-stock products, used for the "Deals" rails. */
export const featuredProducts: Product[] = [...products]
  .filter((p) => p.inStock && p.discountPct >= 20 && p.images.length > 0)
  .sort((a, b) => b.discountPct - a.discountPct)
  .slice(0, 12)

/** Most-reviewed products, used for the "Best sellers" rails. */
export const bestSellers: Product[] = [...products]
  .filter((p) => p.images.length > 0)
  .sort((a, b) => b.reviews - a.reviews)
  .slice(0, 12)

/** Brands with the widest catalogue presence, for the brand strip. */
export const topBrands: string[] = Object.entries(
  products.reduce<Record<string, number>>((acc, p) => {
    acc[p.brand] = (acc[p.brand] ?? 0) + 1
    return acc
  }, {}),
)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 12)
  .map(([brand]) => brand)
