import 'server-only'

import { and, asc, count, desc, eq, ilike, or, sql, type SQL } from 'drizzle-orm'
import { customers, db, orders } from '@stryle/db'

export const CUSTOMER_PAGE_SIZE = 25

export type CustomerSort = 'recent' | 'spend' | 'orders' | 'name'

export type CustomerFilters = {
  query?: string
  status?: 'active' | 'blocked'
  sort?: CustomerSort
  page?: number
}

/**
 * Lifetime spend and order count are aggregated in the same query as the list
 * itself. Doing it per row in the page would fire one query per customer.
 */
export async function listCustomers(filters: CustomerFilters) {
  const page = Math.max(1, filters.page ?? 1)
  const conditions: (SQL | undefined)[] = []

  if (filters.query) {
    const term = `%${filters.query.trim()}%`
    conditions.push(
      or(
        ilike(customers.name, term),
        ilike(customers.phone, term),
        ilike(customers.email, term),
        ilike(customers.city, term),
      ),
    )
  }
  if (filters.status) conditions.push(eq(customers.status, filters.status))

  const where = conditions.length > 0 ? and(...conditions) : undefined

  // Revenue excludes voided orders; order count includes them, so a customer
  // with only cancellations still reads as having ordered.
  const spend = sql<number>`coalesce(sum(${orders.total}) filter (where ${orders.status} not in ('cancelled','refunded')), 0)`.mapWith(
    Number,
  )
  const orderCount = sql<number>`count(${orders.id})`.mapWith(Number)

  const orderBy = {
    recent: desc(customers.createdAt),
    spend: desc(spend),
    orders: desc(orderCount),
    name: asc(customers.name),
  }[filters.sort ?? 'recent']

  const [rows, [totals]] = await Promise.all([
    db
      .select({
        id: customers.id,
        name: customers.name,
        email: customers.email,
        phone: customers.phone,
        city: customers.city,
        state: customers.state,
        gstin: customers.gstin,
        status: customers.status,
        createdAt: customers.createdAt,
        lastSeenAt: customers.lastSeenAt,
        spend,
        orders: orderCount,
      })
      .from(customers)
      .leftJoin(orders, eq(orders.customerId, customers.id))
      .where(where)
      .groupBy(customers.id)
      .orderBy(orderBy)
      .limit(CUSTOMER_PAGE_SIZE)
      .offset((page - 1) * CUSTOMER_PAGE_SIZE),
    db.select({ n: count() }).from(customers).where(where),
  ])

  return { rows, total: totals?.n ?? 0, page }
}

export async function getCustomer(id: string) {
  return db.query.customers.findFirst({ where: eq(customers.id, id) })
}

export async function getCustomerOrders(customerId: string, limit = 50) {
  return db.query.orders.findMany({
    where: eq(orders.customerId, customerId),
    orderBy: desc(orders.placedAt),
    limit,
    with: { items: true },
  })
}
