/**
 * Dashboard aggregates computed in-process over DynamoDB query results.
 * Fine for the seeded catalogue size (~800 SKUs, a few hundred orders).
 */
import { listAllProducts } from './catalogue'
import { listAllCustomers, listAllOrders, listOrderItems } from './customers'
import type { OrderRow, ProductRow } from './types'

const dayMs = 24 * 60 * 60 * 1000
const daysAgo = (days: number) => new Date(Date.now() - days * dayMs)
const VOID = new Set(['cancelled', 'refunded'])

export type Trend = {
  current: number
  previous: number
  changePct: number | null
}

function trend(current: number, previous: number): Trend {
  const changePct = previous === 0 ? null : Math.round(((current - previous) / previous) * 100)
  return { current, previous, changePct }
}

function inWindow(date: Date, from: Date, to?: Date) {
  if (date < from) return false
  if (to && date >= to) return false
  return true
}

export async function getOverview(windowDays = 30) {
  const windowStart = daysAgo(windowDays)
  const priorStart = daysAgo(windowDays * 2)
  const [orders, customers, products] = await Promise.all([
    listAllOrders(),
    listAllCustomers(),
    listAllProducts(),
  ])

  const revenueIn = (from: Date, to?: Date) => {
    const rows = orders.filter(
      (o) => !VOID.has(o.status) && inWindow(o.placedAt, from, to),
    )
    return {
      revenue: rows.reduce((s, o) => s + o.total, 0),
      orders: rows.length,
    }
  }

  const currentPeriod = revenueIn(windowStart)
  const priorPeriod = revenueIn(priorStart, windowStart)
  const newCustomers = customers.filter((c) => c.createdAt >= windowStart).length
  const priorCustomers = customers.filter((c) =>
    inWindow(c.createdAt, priorStart, windowStart),
  ).length

  const revenue = trend(currentPeriod.revenue, priorPeriod.revenue)
  const orderCount = trend(currentPeriod.orders, priorPeriod.orders)

  const archived = products.filter((p) => p.archivedAt).length
  const hidden = products.filter((p) => !p.archivedAt && p.isHidden).length
  const outOfStock = products.filter((p) => !p.inStock).length

  return {
    windowDays,
    revenue,
    orders: orderCount,
    newCustomers: trend(newCustomers, priorCustomers),
    averageOrderValue: trend(
      orderCount.current === 0 ? 0 : Math.round(revenue.current / orderCount.current),
      orderCount.previous === 0 ? 0 : Math.round(revenue.previous / orderCount.previous),
    ),
    totalCustomers: customers.length,
    blockedCustomers: customers.filter((c) => c.status === 'blocked').length,
    catalogue: {
      total: products.length,
      hidden,
      archived,
      outOfStock,
      live: products.length - hidden - archived,
    },
  }
}

export async function getRevenueSeries(days = 30) {
  const orders = await listAllOrders()
  const byDay = new Map<string, { revenue: number; orders: number }>()
  for (const o of orders) {
    if (VOID.has(o.status) || o.placedAt < daysAgo(days)) continue
    const key = o.placedAt.toISOString().slice(0, 10)
    const row = byDay.get(key) ?? { revenue: 0, orders: 0 }
    row.revenue += o.total
    row.orders += 1
    byDay.set(key, row)
  }
  return Array.from({ length: days }, (_, i) => {
    const date = daysAgo(days - 1 - i)
    const key = date.toISOString().slice(0, 10)
    const row = byDay.get(key)
    return { date: key, revenue: row?.revenue ?? 0, orders: row?.orders ?? 0 }
  })
}

export async function getOrdersByStatus() {
  const orders = await listAllOrders()
  const map = new Map<string, { status: OrderRow['status']; n: number; value: number }>()
  for (const o of orders) {
    const row = map.get(o.status) ?? { status: o.status, n: 0, value: 0 }
    row.n += 1
    row.value += o.total
    map.set(o.status, row)
  }
  return [...map.values()].sort((a, b) => b.n - a.n)
}

export async function getTopProducts(limit = 8, days = 30) {
  const [orders, products] = await Promise.all([listAllOrders(), listAllProducts()])
  const productBySku = new Map(products.map((p) => [p.sku, p]))
  const since = daysAgo(days)
  const agg = new Map<string, { sku: string; name: string; units: number; revenue: number }>()

  for (const order of orders) {
    if (VOID.has(order.status) || order.placedAt < since) continue
    const items = await listOrderItems(order.id)
    for (const item of items) {
      const row = agg.get(item.sku) ?? {
        sku: item.sku,
        name: item.name,
        units: 0,
        revenue: 0,
      }
      row.units += item.qty
      row.revenue += item.unitPrice * item.qty
      agg.set(item.sku, row)
    }
  }

  return [...agg.values()]
    .sort((a, b) => b.units - a.units)
    .slice(0, limit)
    .map((row) => {
      const product = productBySku.get(row.sku)
      return {
        ...row,
        isHidden: product?.isHidden ?? false,
        price: product?.price ?? 0,
      }
    })
}

export async function getTopCustomers(limit = 8) {
  const [customers, orders] = await Promise.all([listAllCustomers(), listAllOrders()])
  const byCustomer = new Map<string, { orders: number; spend: number }>()
  for (const o of orders) {
    if (VOID.has(o.status)) continue
    const row = byCustomer.get(o.customerId) ?? { orders: 0, spend: 0 }
    row.orders += 1
    row.spend += o.total
    byCustomer.set(o.customerId, row)
  }
  return customers
    .map((c) => {
      const stats = byCustomer.get(c.id) ?? { orders: 0, spend: 0 }
      return {
        id: c.id,
        name: c.name,
        city: c.city,
        orders: stats.orders,
        spend: stats.spend,
      }
    })
    .filter((c) => c.orders > 0)
    .sort((a, b) => b.spend - a.spend)
    .slice(0, limit)
}

export async function getCategoryMix(limit = 10) {
  const [orders, products] = await Promise.all([listAllOrders(), listAllProducts()])
  const productBySku = new Map(products.map((p) => [p.sku, p]))
  const agg = new Map<
    string,
    { category: string; categorySlug: string; units: number; revenue: number }
  >()

  for (const order of orders) {
    if (VOID.has(order.status)) continue
    const items = await listOrderItems(order.id)
    for (const item of items) {
      const product = productBySku.get(item.sku)
      if (!product) continue
      const row = agg.get(product.categorySlug) ?? {
        category: product.category,
        categorySlug: product.categorySlug,
        units: 0,
        revenue: 0,
      }
      row.units += item.qty
      row.revenue += item.unitPrice * item.qty
      agg.set(product.categorySlug, row)
    }
  }

  return [...agg.values()].sort((a, b) => b.revenue - a.revenue).slice(0, limit)
}

export async function getCustomerStats(customerId: string) {
  const orders = (await listAllOrders()).filter((o) => o.customerId === customerId)
  const spend = orders.filter((o) => !VOID.has(o.status)).reduce((s, o) => s + o.total, 0)
  const cancelled = orders.filter((o) => VOID.has(o.status)).length
  const placed = orders.map((o) => o.placedAt.getTime())
  return {
    orders: orders.length,
    spend,
    cancelled,
    averageOrderValue: orders.length === 0 ? 0 : Math.round(spend / Math.max(1, orders.length - cancelled)),
    firstOrderAt: placed.length ? new Date(Math.min(...placed)) : null,
    lastOrderAt: placed.length ? new Date(Math.max(...placed)) : null,
  }
}

export async function getCatalogueAlerts(limit = 6) {
  const products = await listAllProducts()
  return products
    .filter((p) => !p.archivedAt && (p.price >= p.mrp || p.price <= 0))
    .sort((a, b) => a.sku.localeCompare(b.sku))
    .slice(0, limit)
    .map((p: ProductRow) => ({
      sku: p.sku,
      name: p.name,
      price: p.price,
      mrp: p.mrp,
      inStock: p.inStock,
      isHidden: p.isHidden,
    }))
}
