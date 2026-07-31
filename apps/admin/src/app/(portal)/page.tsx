import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge } from '@/components/Badge'
import { EmptyState, PageHeader, SectionTitle } from '@/components/PageHeader'
import { Sparkline } from '@/components/Sparkline'
import { Stat } from '@/components/Stat'
import { requireUser } from '@/lib/auth'
import { formatCount, formatINR, formatINRCompact } from '@/lib/format'
import {
  getCatalogueAlerts,
  getCategoryMix,
  getOrdersByStatus,
  getOverview,
  getRevenueSeries,
  getTopCustomers,
  getTopProducts,
} from '@/lib/metrics'

export const metadata: Metadata = { title: 'Overview' }

// Metrics are always read live; a cached dashboard would show stale numbers
// moments after an admin changes a price.
export const dynamic = 'force-dynamic'

export default async function OverviewPage() {
  const user = await requireUser()

  const [overview, series, statuses, topProducts, topCustomers, mix, alerts] = await Promise.all([
    getOverview(30),
    getRevenueSeries(30),
    getOrdersByStatus(),
    getTopProducts(8, 30),
    getTopCustomers(6),
    getCategoryMix(6),
    getCatalogueAlerts(5),
  ])

  const firstName = user.name.split(' ')[0] ?? user.name
  const maxCategoryRevenue = Math.max(...mix.map((m) => m.revenue), 1)

  return (
    <>
      <PageHeader
        title={`Good to see you, ${firstName}`}
        description="Trading performance across the last 30 days, compared with the 30 before that."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Revenue"
          value={formatINR(overview.revenue.current)}
          trend={overview.revenue}
          caption="vs prior 30 days"
        />
        <Stat
          label="Orders"
          value={formatCount(overview.orders.current)}
          trend={overview.orders}
          caption="vs prior 30 days"
        />
        <Stat
          label="New customers"
          value={formatCount(overview.newCustomers.current)}
          trend={overview.newCustomers}
          caption="vs prior 30 days"
        />
        <Stat
          label="Average order"
          value={formatINR(overview.averageOrderValue.current)}
          trend={overview.averageOrderValue}
          caption="vs prior 30 days"
        />
      </div>

      <section className="mt-8 card p-5">
        <SectionTitle aside={`Peak ${formatINRCompact(Math.max(...series.map((s) => s.revenue), 0))}`}>
          Daily revenue
        </SectionTitle>
        <Sparkline data={series} height={96} />
      </section>

      <div className="mt-8 grid gap-8 xl:grid-cols-3">
        <section className="xl:col-span-2">
          <SectionTitle aside="Last 30 days">Best sellers</SectionTitle>
          <div className="card overflow-hidden">
            {topProducts.length === 0 ? (
              <EmptyState>No orders in this window yet.</EmptyState>
            ) : (
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="th">Product</th>
                    <th className="th text-right">Units</th>
                    <th className="th text-right">Revenue</th>
                    <th className="th text-right">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p) => (
                    <tr key={p.sku} className="hover:bg-paper-50">
                      <td className="td">
                        <Link
                          href={`/products/${p.sku}`}
                          className="font-medium text-ink hover:underline"
                        >
                          {p.name}
                        </Link>
                        <div className="mt-0.5 flex items-center gap-2">
                          <span className="text-[11px] text-ink-300">{p.sku}</span>
                          {p.isHidden && <Badge tone="solid">Hidden</Badge>}
                        </div>
                      </td>
                      <td className="td text-right">{formatCount(p.units)}</td>
                      <td className="td text-right">{formatINR(p.revenue)}</td>
                      <td className="td text-right text-ink-400">{formatINR(p.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <div className="space-y-8">
          <section>
            <SectionTitle>Catalogue health</SectionTitle>
            <div className="card divide-y divide-paper-100">
              <HealthRow label="Live on storefront" value={formatCount(overview.catalogue.live)} />
              <HealthRow
                label="Hidden"
                value={formatCount(overview.catalogue.hidden)}
                href="/products?visibility=hidden"
              />
              <HealthRow
                label="Out of stock"
                value={formatCount(overview.catalogue.outOfStock)}
                href="/products?stock=out"
              />
              <HealthRow
                label="Removed"
                value={formatCount(overview.catalogue.archived)}
                href="/products?visibility=archived"
              />
            </div>
          </section>

          <section>
            <SectionTitle>Orders by status</SectionTitle>
            <div className="card divide-y divide-paper-100">
              {statuses.map((s) => (
                <div key={s.status} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-[13px] capitalize text-ink-700">{s.status}</span>
                  <span className="text-[13px] font-medium text-ink">{formatCount(s.n)}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {alerts.length > 0 && (
        <section className="mt-8">
          <SectionTitle aside="Price is at or above MRP, or set to zero">
            Needs a look
          </SectionTitle>
          <div className="card divide-y divide-paper-100">
            {alerts.map((a) => (
              <div key={a.sku} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <Link
                    href={`/products/${a.sku}`}
                    className="text-[13px] font-medium text-ink hover:underline"
                  >
                    {a.name}
                  </Link>
                  <p className="text-[11px] text-ink-300">{a.sku}</p>
                </div>
                <p className="text-[12px] text-ink-500">
                  Price {formatINR(a.price)} · MRP {formatINR(a.mrp)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section>
          <SectionTitle aside="All time">Top customers</SectionTitle>
          <div className="card divide-y divide-paper-100">
            {topCustomers.length === 0 ? (
              <EmptyState>No customer orders yet.</EmptyState>
            ) : (
              topCustomers.map((c) => (
                <Link
                  key={c.id}
                  href={`/customers/${c.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-paper-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-ink">{c.name}</p>
                    <p className="text-[11px] text-ink-400">
                      {c.city ?? '—'} · {formatCount(c.orders)} orders
                    </p>
                  </div>
                  <span className="shrink-0 text-[13px] font-medium text-ink">
                    {formatINR(c.spend)}
                  </span>
                </Link>
              ))
            )}
          </div>
        </section>

        <section>
          <SectionTitle aside="All time">Revenue by category</SectionTitle>
          <div className="card divide-y divide-paper-100">
            {mix.length === 0 ? (
              <EmptyState>No sales recorded yet.</EmptyState>
            ) : (
              mix.map((m) => (
                <div key={m.categorySlug} className="px-4 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-[13px] text-ink-700">{m.category}</span>
                    <span className="shrink-0 text-[13px] font-medium text-ink">
                      {formatINR(m.revenue)}
                    </span>
                  </div>
                  {/* Bar length is relative to the top category, not to total. */}
                  <div className="mt-1.5 h-1 w-full bg-paper-100">
                    <div
                      className="h-full bg-ink-300"
                      style={{ width: `${(m.revenue / maxCategoryRevenue) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </>
  )
}

function HealthRow({ label, value, href }: { label: string; value: string; href?: string }) {
  const body = (
    <>
      <span className="text-[13px] text-ink-700">{label}</span>
      <span className="text-[13px] font-medium text-ink">{value}</span>
    </>
  )

  return href ? (
    <Link href={href} className="flex items-center justify-between px-4 py-2.5 hover:bg-paper-50">
      {body}
    </Link>
  ) : (
    <div className="flex items-center justify-between px-4 py-2.5">{body}</div>
  )
}
