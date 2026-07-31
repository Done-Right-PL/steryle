import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Badge, OrderStatusBadge } from '@/components/Badge'
import { EmptyState, PageHeader, SectionTitle } from '@/components/PageHeader'
import { can, requireUser } from '@/lib/auth'
import { getCustomer, getCustomerOrders } from '@/lib/customers'
import { formatCount, formatDate, formatDateTime, formatINR, formatRelative } from '@/lib/format'
import { getCustomerStats } from '@/lib/metrics'
import { setCustomerStatus, setMarketingOptIn } from '../actions'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const customer = await getCustomer(id)
  return { title: customer?.name ?? 'Customer' }
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireUser()
  const { id } = await params

  const customer = await getCustomer(id)
  if (!customer) notFound()

  const [stats, orders] = await Promise.all([getCustomerStats(id), getCustomerOrders(id)])
  const writable = can.write(user)

  return (
    <>
      <PageHeader
        title={customer.name}
        description={`Customer since ${formatDate(customer.createdAt)} · last seen ${formatRelative(customer.lastSeenAt)}`}
        backHref="/customers"
        backLabel="All customers"
        actions={
          writable ? (
            <form action={setCustomerStatus}>
              <input type="hidden" name="id" value={customer.id} />
              <input
                type="hidden"
                name="status"
                value={customer.status === 'blocked' ? 'active' : 'blocked'}
              />
              <button type="submit" className={customer.status === 'blocked' ? 'btn-outline' : 'btn-danger'}>
                {customer.status === 'blocked' ? 'Unblock customer' : 'Block customer'}
              </button>
            </form>
          ) : null
        }
      />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-4">
            <MiniStat label="Orders" value={formatCount(stats.orders)} />
            <MiniStat label="Lifetime spend" value={formatINR(stats.spend)} />
            <MiniStat label="Average order" value={formatINR(stats.averageOrderValue)} />
            <MiniStat label="Cancelled" value={formatCount(stats.cancelled)} />
          </div>

          <section>
            <SectionTitle aside={`${formatCount(orders.length)} shown`}>Order history</SectionTitle>
            <div className="card overflow-hidden">
              {orders.length === 0 ? (
                <EmptyState>This customer has not placed an order yet.</EmptyState>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px]">
                    <thead>
                      <tr>
                        <th className="th">Order</th>
                        <th className="th">Placed</th>
                        <th className="th text-right">Items</th>
                        <th className="th text-right">Total</th>
                        <th className="th">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => {
                        const units = order.items.reduce((sum, i) => sum + i.qty, 0)
                        return (
                          <tr key={order.id} className="align-top hover:bg-paper-50">
                            <td className="td">
                              <p className="font-medium text-ink">{order.reference}</p>
                              <ul className="mt-1 space-y-0.5">
                                {order.items.slice(0, 3).map((item) => (
                                  <li key={item.id} className="text-[11px] text-ink-400">
                                    {item.qty}× {item.name}
                                  </li>
                                ))}
                                {order.items.length > 3 && (
                                  <li className="text-[11px] text-ink-300">
                                    +{order.items.length - 3} more
                                  </li>
                                )}
                              </ul>
                            </td>
                            <td className="td whitespace-nowrap text-ink-500">
                              {formatDate(order.placedAt)}
                            </td>
                            <td className="td text-right">{formatCount(units)}</td>
                            <td className="td text-right font-medium text-ink">
                              {formatINR(order.total)}
                            </td>
                            <td className="td">
                              <OrderStatusBadge status={order.status} />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-8">
          <section>
            <SectionTitle>Details</SectionTitle>
            <dl className="card divide-y divide-paper-100">
              <Detail label="Status">
                {customer.status === 'blocked' ? (
                  <Badge tone="solid">Blocked</Badge>
                ) : (
                  <Badge tone="outline">Active</Badge>
                )}
              </Detail>
              <Detail label="Phone">{customer.phone}</Detail>
              <Detail label="Email">{customer.email ?? '—'}</Detail>
              <Detail label="Location">
                {customer.city ? `${customer.city}, ${customer.state ?? ''}`.replace(/,\s*$/, '') : '—'}
              </Detail>
              <Detail label="GSTIN">{customer.gstin ?? '—'}</Detail>
              <Detail label="First order">{formatDate(stats.firstOrderAt)}</Detail>
              <Detail label="Last order">{formatDate(stats.lastOrderAt)}</Detail>
              <Detail label="Joined">{formatDateTime(customer.createdAt)}</Detail>
            </dl>
          </section>

          <section>
            <SectionTitle>Marketing</SectionTitle>
            <div className="card p-4">
              <p className="text-[13px] text-ink-700">
                {customer.marketingOptIn
                  ? 'Receives campaign notifications.'
                  : 'Opted out of campaign notifications.'}
              </p>
              <p className="mt-1 text-[11px] text-ink-400">
                Notifications targeted at “Marketing opt-in” skip customers who opted out.
              </p>
              {writable && (
                <form action={setMarketingOptIn} className="mt-3">
                  <input type="hidden" name="id" value={customer.id} />
                  <input
                    type="hidden"
                    name="optIn"
                    value={customer.marketingOptIn ? 'false' : 'true'}
                  />
                  <button type="submit" className="btn-quiet w-full">
                    {customer.marketingOptIn ? 'Opt out' : 'Opt in'}
                  </button>
                </form>
              )}
            </div>
          </section>

          <Link href="/customers" className="block text-[12px] text-ink-400 hover:text-ink">
            ← Back to all customers
          </Link>
        </aside>
      </div>
    </>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <p className="label">{label}</p>
      <p className="mt-1.5 text-xl font-semibold tracking-tight text-ink">{value}</p>
    </div>
  )
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2.5">
      <dt className="text-[12px] text-ink-400">{label}</dt>
      <dd className="min-w-0 truncate text-right text-[13px] text-ink-700">{children}</dd>
    </div>
  )
}
