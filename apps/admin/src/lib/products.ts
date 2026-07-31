import 'server-only'

import {
  listAllProducts,
  listCategories,
  getProductBySku,
  listPriceHistory,
  type ProductRow,
} from '@steryle/db'

export const PRODUCT_PAGE_SIZE = 30

export type ProductSort = 'sku' | 'name' | 'price-asc' | 'price-desc' | 'discount' | 'updated'
export type VisibilityFilter = 'live' | 'hidden' | 'archived'
export type StockFilter = 'in' | 'out'

export type ProductFilters = {
  query?: string
  category?: string
  brand?: string
  visibility?: VisibilityFilter
  stock?: StockFilter
  sort?: ProductSort
  page?: number
}

function matches(filters: ProductFilters, product: ProductRow): boolean {
  if (filters.query) {
    const term = filters.query.trim().toLowerCase()
    const hay = `${product.name} ${product.sku} ${product.brand}`.toLowerCase()
    if (!hay.includes(term)) return false
  }
  if (filters.category && product.categorySlug !== filters.category) return false
  if (filters.brand && product.brand !== filters.brand) return false
  if (filters.stock === 'in' && !product.inStock) return false
  if (filters.stock === 'out' && product.inStock) return false

  if (filters.visibility === 'archived') {
    if (!product.archivedAt) return false
  } else {
    if (product.archivedAt) return false
    if (filters.visibility === 'hidden' && !product.isHidden) return false
    if (filters.visibility === 'live' && product.isHidden) return false
  }
  return true
}

function sortProducts(rows: ProductRow[], sort: ProductSort): ProductRow[] {
  const copy = [...rows]
  copy.sort((a, b) => {
    switch (sort) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'price-asc':
        return a.price - b.price
      case 'price-desc':
        return b.price - a.price
      case 'discount': {
        const da = a.mrp > 0 ? (a.mrp - a.price) / a.mrp : 0
        const db = b.mrp > 0 ? (b.mrp - b.price) / b.mrp : 0
        return db - da
      }
      case 'updated':
        return b.updatedAt.getTime() - a.updatedAt.getTime()
      case 'sku':
      default:
        return a.sku.localeCompare(b.sku)
    }
  })
  return copy
}

export async function listProducts(filters: ProductFilters) {
  const page = Math.max(1, filters.page ?? 1)
  const all = await listAllProducts()
  const filtered = sortProducts(
    all.filter((p) => matches(filters, p)),
    filters.sort ?? 'sku',
  )
  const start = (page - 1) * PRODUCT_PAGE_SIZE
  return {
    rows: filtered.slice(start, start + PRODUCT_PAGE_SIZE),
    total: filtered.length,
    page,
  }
}

export async function getProduct(sku: string) {
  return getProductBySku(sku)
}

export async function getPriceHistory(sku: string, limit = 20) {
  return listPriceHistory(sku, limit)
}

export async function getFilterOptions() {
  const [categories, products] = await Promise.all([listCategories(), listAllProducts()])
  const brands = [...new Set(products.filter((p) => !p.archivedAt).map((p) => p.brand))].sort()
  return {
    categories: categories.map((c) => ({ slug: c.slug, name: c.name })),
    brands,
  }
}
