import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge } from '@/components/Badge'
import { EmptyState, PageHeader } from '@/components/PageHeader'
import { Pagination } from '@/components/Pagination'
import { QuoteStatusSelect } from '@/components/QuoteStatusSelect'
import { can, requireUser } from '@/lib/auth'
import { formatCount, formatDate, formatRelative } from '@/lib/format'
import { listQuotes, QUOTE_PAGE_SIZE, type QuoteStatus } from '@/lib/quotes'

export const metadata: Metadata = { title: 'Quote requests' }
export const dynamic = 'force-dynamic'

type SearchParams = {
  q?: string
  status?: string
  page?: string
}

const STATUSES: { value: QuoteStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'closed', label: 'Closed' },
]

function statusTone(status: QuoteStatus): 'solid' | 'outline' | 'muted' {
  if (status === 'new') return 'solid'
  if (status === 'contacted') return 'outline'
  return 'muted'
}

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const user = await requireUser()
  const sp = await searchParams
  const status = STATUSES.find((s) => s.value === sp.status)?.value
  const page = Number.parseInt(sp.page ?? '1', 10) || 1
  const { rows, total } = await listQuotes({ query: sp.q, status, page })

  const params = new URLSearchParams()
  if (sp.q) params.set('q', sp.q)
  if (status) params.set('status', status)

  return (
    <>
      <PageHeader
        title="Quote requests"
        description={`${formatCount(total)} bulk quote ${total === 1 ? 'request' : 'requests'} from the storefront.`}
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
            placeholder="Organisation, requirement, phone"
          />
        </div>
        <div>
          <label htmlFor="status" className="label mb-1.5 block">
            Status
          </label>
          <select id="status" name="status" defaultValue={status ?? ''} className="field pr-8">
            <option value="">All</option>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-outline">
          Apply
        </button>
        {(sp.q || status) && (
          <Link href="/quotes" className="btn-quiet">
            Clear
          </Link>
        )}
      </form>

      {rows.length === 0 ? (
        <EmptyState>
          No quote requests yet. When someone submits the bulk quote form on the
          storefront, it will show up here.
        </EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-paper-200">
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <thead className="border-b border-paper-200 bg-paper-50 text-[11px] uppercase tracking-wider text-ink-400">
              <tr>
                <th className="px-4 py-3 font-semibold">Organisation</th>
                <th className="px-4 py-3 font-semibold">Requirement</th>
                <th className="px-4 py-3 font-semibold">Contact</th>
                <th className="px-4 py-3 font-semibold">When</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-100">
              {rows.map((quote) => (
                <tr key={quote.id} className="align-top">
                  <td className="px-4 py-3 font-medium text-ink">{quote.organisation}</td>
                  <td className="max-w-sm px-4 py-3 text-ink-600">
                    <p className="whitespace-pre-wrap">{quote.requirement}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-600">
                    {quote.contactName || quote.contactPhone ? (
                      <>
                        {quote.contactName ? <p>{quote.contactName}</p> : null}
                        {quote.contactPhone ? (
                          <a
                            href={`tel:+91${quote.contactPhone}`}
                            className="text-brand-600 hover:underline"
                          >
                            {quote.contactPhone}
                          </a>
                        ) : null}
                      </>
                    ) : (
                      <span className="text-ink-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-500">
                    <p title={formatDate(quote.createdAt)}>{formatRelative(quote.createdAt)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone(quote.status)}>{quote.status}</Badge>
                    {can.write(user) ? (
                      <QuoteStatusSelect id={quote.id} status={quote.status} />
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} pageSize={QUOTE_PAGE_SIZE} total={total} params={params} />
        </div>
      )}
    </>
  )
}
