import 'server-only'

import { and, asc, count, desc, eq, ilike, isNotNull, isNull, or, sql, type SQL } from 'drizzle-orm'
import { categories, db, priceHistory, products } from '@stryle/db'

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

export async function listProducts(filters: ProductFilters) {
  const page = Math.max(1, filters.page ?? 1)
  const conditions: (SQL | undefined)[] = []

  if (filters.query) {
    const term = `%${filters.query.trim()}%`
    conditions.push(
      or(ilike(products.name, term), ilike(products.sku, term), ilike(products.brand, term)),
    )
  }
  if (filters.category) conditions.push(eq(products.categorySlug, filters.category))
  if (filters.brand) conditions.push(eq(products.brand, filters.brand))
  if (filters.stock) conditions.push(eq(products.inStock, filters.stock === 'in'))

  /*
   * Archived products are excluded unless explicitly asked for — "removed"
   * rows should not clutter the default view, but they must stay reachable so
   * a removal can be undone.
   */
  if (filters.visibility === 'archived') {
    conditions.push(isNotNull(products.archivedAt))
  } else {
    conditions.push(isNull(products.archivedAt))
    if (filters.visibility === 'hidden') conditions.push(eq(products.isHidden, true))
    if (filters.visibility === 'live') conditions.push(eq(products.isHidden, false))
  }

  const where = and(...conditions)

  const orderBy = {
    sku: asc(products.sku),
    name: asc(products.name),
    'price-asc': asc(products.price),
    'price-desc': desc(products.price),
    discount: desc(sql`case when ${products.mrp} > 0 then (${products.mrp} - ${products.price})::float / ${products.mrp} else 0 end`),
    updated: desc(products.updatedAt),
  }[filters.sort ?? 'sku']

  const [rows, [totals]] = await Promise.all([
    db
      .select()
      .from(products)
      .where(where)
      .orderBy(orderBy)
      .limit(PRODUCT_PAGE_SIZE)
      .offset((page - 1) * PRODUCT_PAGE_SIZE),
    db.select({ n: count() }).from(products).where(where),
  ])

  return { rows, total: totals?.n ?? 0, page }
}

export async function getProduct(sku: string) {
  return db.query.products.findFirst({ where: eq(products.sku, sku) })
}

export async function getPriceHistory(sku: string, limit = 20) {
  return db.query.priceHistory.findMany({
    where: eq(priceHistory.sku, sku),
    orderBy: desc(priceHistory.createdAt),
    limit,
  })
}

/** Filter dropdown options, ordered the way the storefront orders them. */
export async function getFilterOptions() {
  const [categoryRows, brandRows] = await Promise.all([
    db
      .select({ slug: categories.slug, name: categories.name })
      .from(categories)
      .orderBy(asc(categories.sortOrder)),
    db
      .selectDistinct({ brand: products.brand })
      .from(products)
      .where(isNull(products.archivedAt))
      .orderBy(asc(products.brand)),
  ])

  return {
    categories: categoryRows,
    brands: brandRows.map((b) => b.brand),
  }
}
