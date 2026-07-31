import 'server-only'

/**
 * Aggregate queries behind the dashboard.
 *
 * Everything is computed in Postgres rather than by pulling rows into Node —
 * the orders table grows without bound and the dashboard is the most-visited
 * page in the portal.
 *
 * Cancelled and refunded orders are excluded from every revenue figure but
 * still counted in order volume, so revenue reflects money actually kept.
 */
import { and, asc, count, countDistinct, desc, eq, gte, isNull, lt, notInArray, sql, sum } from 'drizzle-orm'
import { customers, orderItems, orders, products } from '@stryle/db'
import { db } from '@stryle/db'

const dayMs = 24 * 60 * 60 * 1000
const daysAgo = (days: number) => new Date(Date.now() - days * dayMs)

/** Statuses that never represent captured revenue. */
const VOID_STATUSES = ['cancelled', 'refunded'] as const

export type Trend = {
  current: number
  previous: number
  /** Percentage change, or null when there is no baseline to compare against. */
  changePct: number | null
}

function trend(current: number, previous: number): Trend {
  const changePct = previous === 0 ? null : Math.round(((current - previous) / previous) * 100)
  return { current, previous, changePct }
}

/**
 * Headline counters, each compared against the immediately preceding window of
 * the same length.
 */
export async function getOverview(windowDays = 30) {
  const windowStart = daysAgo(windowDays)
  const priorStart = daysAgo(windowDays * 2)

  const revenueExpr = sum(orders.total).mapWith(Number)
  const revenueWindow = (from: Date, to?: Date) =>
    db
      .select({ revenue: revenueExpr, orders: count() })
      .from(orders)
      .where(
        and(
          gte(orders.placedAt, from),
          to ? lt(orders.placedAt, to) : undefined,
          notInArray(orders.status, VOID_STATUSES),
        ),
      )

  const [
    [currentPeriod],
    [priorPeriod],
    [newCustomers],
    [priorCustomers],
    [totals],
    [catalogue],
  ] = await Promise.all([
    revenueWindow(windowStart),
    revenueWindow(priorStart, windowStart),
    db.select({ n: count() }).from(customers).where(gte(customers.createdAt, windowStart)),
    db
      .select({ n: count() })
      .from(customers)
      .where(and(gte(customers.createdAt, priorStart), lt(customers.createdAt, windowStart))),
    db
      .select({
        customers: count(),
        blocked: sql<number>`count(*) filter (where ${customers.status} = 'blocked')`.mapWith(
          Number,
        ),
      })
      .from(customers),
    db
      .select({
        total: count(),
        hidden: sql<number>`count(*) filter (where ${products.isHidden})`.mapWith(Number),
        archived: sql<number>`count(*) filter (where ${products.archivedAt} is not null)`.mapWith(
          Number,
        ),
        outOfStock: sql<number>`count(*) filter (where not ${products.inStock})`.mapWith(Number),
      })
      .from(products),
  ])

  const revenue = trend(currentPeriod?.revenue ?? 0, priorPeriod?.revenue ?? 0)
  const orderCount = trend(currentPeriod?.orders ?? 0, priorPeriod?.orders ?? 0)

  return {
    windowDays,
    revenue,
    orders: orderCount,
    newCustomers: trend(newCustomers?.n ?? 0, priorCustomers?.n ?? 0),
    averageOrderValue: trend(
      orderCount.current === 0 ? 0 : Math.round(revenue.current / orderCount.current),
      orderCount.previous === 0 ? 0 : Math.round(revenue.previous / orderCount.previous),
    ),
    totalCustomers: totals?.customers ?? 0,
    blockedCustomers: totals?.blocked ?? 0,
    catalogue: {
      total: catalogue?.total ?? 0,
      hidden: catalogue?.hidden ?? 0,
      archived: catalogue?.archived ?? 0,
      outOfStock: catalogue?.outOfStock ?? 0,
      live:
        (catalogue?.total ?? 0) - (catalogue?.hidden ?? 0) - (catalogue?.archived ?? 0),
    },
  }
}

/** Daily revenue for the sparkline, zero-filled so gaps render as gaps. */
export async function getRevenueSeries(days = 30) {
  const rows = await db
    .select({
      day: sql<string>`to_char(date_trunc('day', ${orders.placedAt}), 'YYYY-MM-DD')`,
      revenue: sum(orders.total).mapWith(Number),
      orders: count(),
    })
    .from(orders)
    .where(and(gte(orders.placedAt, daysAgo(days)), notInArray(orders.status, VOID_STATUSES)))
    .groupBy(sql`date_trunc('day', ${orders.placedAt})`)
    .orderBy(asc(sql`date_trunc('day', ${orders.placedAt})`))

  const byDay = new Map(rows.map((r) => [r.day, r]))

  return Array.from({ length: days }, (_, i) => {
    const date = daysAgo(days - 1 - i)
    const key = date.toISOString().slice(0, 10)
    const row = byDay.get(key)
    return { date: key, revenue: row?.revenue ?? 0, orders: row?.orders ?? 0 }
  })
}

export async function getOrdersByStatus() {
  return db
    .select({ status: orders.status, n: count(), value: sum(orders.total).mapWith(Number) })
    .from(orders)
    .groupBy(orders.status)
    .orderBy(desc(count()))
}

/** Best-selling SKUs by units moved, used for the dashboard leaderboard. */
export async function getTopProducts(limit = 8, days = 30) {
  return db
    .select({
      sku: orderItems.sku,
      name: orderItems.name,
      units: sum(orderItems.qty).mapWith(Number),
      revenue: sql<number>`sum(${orderItems.unitPrice} * ${orderItems.qty})`.mapWith(Number),
      isHidden: products.isHidden,
      price: products.price,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .innerJoin(products, eq(products.sku, orderItems.sku))
    .where(and(gte(orders.placedAt, daysAgo(days)), notInArray(orders.status, VOID_STATUSES)))
    .groupBy(orderItems.sku, orderItems.name, products.isHidden, products.price)
    .orderBy(desc(sum(orderItems.qty)))
    .limit(limit)
}

/** Highest-value customers over all time, for the dashboard leaderboard. */
export async function getTopCustomers(limit = 8) {
  return db
    .select({
      id: customers.id,
      name: customers.name,
      city: customers.city,
      orders: countDistinct(orders.id),
      spend: sum(orders.total).mapWith(Number),
    })
    .from(customers)
    .innerJoin(orders, eq(orders.customerId, customers.id))
    .where(notInArray(orders.status, VOID_STATUSES))
    .groupBy(customers.id, customers.name, customers.city)
    .orderBy(desc(sum(orders.total)))
    .limit(limit)
}

/** Category mix by revenue, so merchandising can see where sales concentrate. */
export async function getCategoryMix(limit = 10) {
  return db
    .select({
      category: products.category,
      categorySlug: products.categorySlug,
      units: sum(orderItems.qty).mapWith(Number),
      revenue: sql<number>`sum(${orderItems.unitPrice} * ${orderItems.qty})`.mapWith(Number),
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .innerJoin(products, eq(products.sku, orderItems.sku))
    .where(notInArray(orders.status, VOID_STATUSES))
    .groupBy(products.category, products.categorySlug)
    .orderBy(desc(sql`sum(${orderItems.unitPrice} * ${orderItems.qty})`))
    .limit(limit)
}

/**
 * Per-customer rollup shown on the customer detail page and in the list.
 */
export async function getCustomerStats(customerId: string) {
  const [row] = await db
    .select({
      orders: count(),
      spend: sql<number>`coalesce(sum(${orders.total}) filter (where ${orders.status} not in ('cancelled','refunded')), 0)`.mapWith(
        Number,
      ),
      cancelled: sql<number>`count(*) filter (where ${orders.status} in ('cancelled','refunded'))`.mapWith(
        Number,
      ),
      firstOrderAt: sql<Date | null>`min(${orders.placedAt})`,
      lastOrderAt: sql<Date | null>`max(${orders.placedAt})`,
    })
    .from(orders)
    .where(eq(orders.customerId, customerId))

  const spend = row?.spend ?? 0
  const orderCount = row?.orders ?? 0

  return {
    orders: orderCount,
    spend,
    cancelled: row?.cancelled ?? 0,
    averageOrderValue: orderCount === 0 ? 0 : Math.round(spend / orderCount),
    firstOrderAt: row?.firstOrderAt ?? null,
    lastOrderAt: row?.lastOrderAt ?? null,
  }
}

/** Catalogue rows that likely need attention, surfaced on the dashboard. */
export async function getCatalogueAlerts(limit = 6) {
  return db
    .select({
      sku: products.sku,
      name: products.name,
      price: products.price,
      mrp: products.mrp,
      inStock: products.inStock,
      isHidden: products.isHidden,
    })
    .from(products)
    .where(
      and(
        isNull(products.archivedAt),
        // Priced at or above MRP, or listed at zero — both are data errors.
        sql`(${products.price} >= ${products.mrp} or ${products.price} <= 0)`,
      ),
    )
    .orderBy(asc(products.sku))
    .limit(limit)
}
