import 'server-only'

import {
  getCustomerById,
  getCustomerStats as dbCustomerStats,
  getOrdersForCustomer,
  listAllCustomers,
  listAllOrders,
  type CustomerRow,
} from '@steryle/db'

export const CUSTOMER_PAGE_SIZE = 25

export type CustomerSort = 'recent' | 'spend' | 'orders' | 'name'

export type CustomerFilters = {
  query?: string
  status?: 'active' | 'blocked'
  sort?: CustomerSort
  page?: number
}

const VOID = new Set(['cancelled', 'refunded'])

export async function listCustomers(filters: CustomerFilters) {
  const page = Math.max(1, filters.page ?? 1)
  const [customers, orders] = await Promise.all([listAllCustomers(), listAllOrders()])

  const spendByCustomer = new Map<string, { spend: number; orders: number }>()
  for (const o of orders) {
    const row = spendByCustomer.get(o.customerId) ?? { spend: 0, orders: 0 }
    row.orders += 1
    if (!VOID.has(o.status)) row.spend += o.total
    spendByCustomer.set(o.customerId, row)
  }

  let rows = customers.map((c) => {
    const stats = spendByCustomer.get(c.id) ?? { spend: 0, orders: 0 }
    return { ...c, spend: stats.spend, orders: stats.orders }
  })

  if (filters.query) {
    const term = filters.query.trim().toLowerCase()
    rows = rows.filter((c) =>
      `${c.name} ${c.phone} ${c.email ?? ''} ${c.city ?? ''}`.toLowerCase().includes(term),
    )
  }
  if (filters.status) rows = rows.filter((c) => c.status === filters.status)

  rows.sort((a, b) => {
    switch (filters.sort) {
      case 'spend':
        return b.spend - a.spend
      case 'orders':
        return b.orders - a.orders
      case 'name':
        return a.name.localeCompare(b.name)
      case 'recent':
      default:
        return b.createdAt.getTime() - a.createdAt.getTime()
    }
  })

  const start = (page - 1) * CUSTOMER_PAGE_SIZE
  return { rows: rows.slice(start, start + CUSTOMER_PAGE_SIZE), total: rows.length, page }
}

export async function getCustomer(id: string): Promise<CustomerRow | null> {
  return getCustomerById(id)
}

export async function getCustomerOrders(customerId: string, limit = 50) {
  return getOrdersForCustomer(customerId, limit)
}

export { dbCustomerStats as getCustomerStats }
