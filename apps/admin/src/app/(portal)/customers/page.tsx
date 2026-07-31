import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge } from '@/components/Badge'
import { EmptyState, PageHeader } from '@/components/PageHeader'
import { Pagination } from '@/components/Pagination'
import { requireUser } from '@/lib/auth'
import { CUSTOMER_PAGE_SIZE, listCustomers, type CustomerSort } from '@/lib/customers'
import { formatCount, formatDate, formatINR, formatRelative } from '@/lib/format'

export const metadata: Metadata = { title: 'Customers' }
export const dynamic = 'force-dynamic'

type SearchParams = {
  q?: string
  status?: string
  sort?: string
  page?: string
}

const SORTS: { value: CustomerSort; label: string }[] = [
  { value: 'recent', label: 'Newest' },
  { value: 'spend', label: 'Lifetime spend' },
  { value: 'orders', label: 'Order count' },
  { value: 'name', label: 'Name A–Z' },
]

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireUser()
  const sp = await searchParams

  const status = sp.status === 'active' || sp.status === 'blocked' ? sp.status : undefined
  const sort = (SORTS.find((s) => s.value === sp.sort)?.value ?? 'recent') as CustomerSort
  const page = Number.parseInt(sp.page ?? '1', 10) || 1

  const { rows, total } = await listCustomers({ query: sp.q, status, sort, page })

  // Carried into pagination links so filters survive paging.
  const params = new URLSearchParams()
  if (sp.q) params.set('q', sp.q)
  if (status) params.set('status', status)
  if (sp.sort) params.set('sort', sort)

  return (
    <>
      <PageHeader
        title="Customers"
        description={`${formatCount(total)} ${total === 1 ? 'account' : 'accounts'} matching the current filters.`}
      />

      <form method="get" className="mb-5 flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1">
          <label htmlFor="q" className="label mb-1.5 block">
            Search
          </label>
          <input
            id="q"
            name="q"
            defaultValue={sp.q ?? ''}
            className="field"
            placeholder="Name, phone, email or city"
          />
        </div>

        <div>
          <label htmlFor="status" className="label mb-1.5 block">
            Status
          </label>
          <select id="status" name="status" defaultValue={status ?? ''} className="field pr-8">
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>

        <div>
          <label htmlFor="sort" className="label mb-1.5 block">
            Sort
          </label>
          <select id="sort" name="sort" defaultValue={sort} className="field pr-8">
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className="btn-outline">
          Apply
        </button>
        {(sp.q || status || sp.sort) && (
          <Link href="/customers" className="btn-quiet">
            Clear
          </Link>
        )}
      </form>

      <div className="card overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState>No customers match those filters.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead>
                <tr>
                  <th className="th">Customer</th>
                  <th className="th">Location</th>
                  <th className="th text-right">Orders</th>
                  <th className="th text-right">Lifetime spend</th>
                  <th className="th">Joined</th>
                  <th className="th">Last seen</th>
                  <th className="th">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} className="hover:bg-paper-50">
                    <td className="td">
                      <Link
                        href={`/customers/${c.id}`}
                        className="font-medium text-ink hover:underline"
                      >
                        {c.name}
                      </Link>
                      <div className="mt-0.5 text-[11px] text-ink-400">
                        {c.phone}
                        {c.gstin && <span className="ml-2 text-ink-300">GST {c.gstin}</span>}
                      </div>
                    </td>
                    <td className="td text-ink-500">
                      {c.city ? `${c.city}, ${c.state ?? ''}`.replace(/,\s*$/, '') : '—'}
                    </td>
                    <td className="td text-right">{formatCount(c.orders)}</td>
                    <td className="td text-right font-medium text-ink">{formatINR(c.spend)}</td>
                    <td className="td text-ink-500">{formatDate(c.createdAt)}</td>
                    <td className="td text-ink-500">{formatRelative(c.lastSeenAt)}</td>
                    <td className="td">
                      {c.status === 'blocked' ? (
                        <Badge tone="solid">Blocked</Badge>
                      ) : (
                        <Badge tone="outline">Active</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination page={page} pageSize={CUSTOMER_PAGE_SIZE} total={total} params={params} />
      </div>
    </>
  )
}
