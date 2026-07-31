import Link from 'next/link'

/**
 * Link-based pagination so the list pages stay server-rendered and every page
 * is a shareable URL. Existing filters are carried across by cloning the
 * current query string.
 */
export function Pagination({
  page,
  pageSize,
  total,
  params,
}: {
  page: number
  pageSize: number
  total: number
  /** Current query string, minus `page`. */
  params: URLSearchParams
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (total === 0) return null

  const href = (p: number) => {
    const next = new URLSearchParams(params)
    if (p <= 1) next.delete('page')
    else next.set('page', String(p))
    const qs = next.toString()
    return qs ? `?${qs}` : '?'
  }

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-paper-200 px-4 py-3">
      <p className="text-[12px] text-ink-400">
        {from.toLocaleString('en-IN')}–{to.toLocaleString('en-IN')} of{' '}
        {total.toLocaleString('en-IN')}
      </p>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link href={href(page - 1)} className="btn-quiet">
            Previous
          </Link>
        ) : (
          <span className="btn-quiet pointer-events-none opacity-40">Previous</span>
        )}
        <span className="text-[12px] text-ink-400">
          Page {page} of {totalPages}
        </span>
        {page < totalPages ? (
          <Link href={href(page + 1)} className="btn-quiet">
            Next
          </Link>
        ) : (
          <span className="btn-quiet pointer-events-none opacity-40">Next</span>
        )}
      </div>
    </div>
  )
}
