import 'server-only'

import {
  listQuoteRequests,
  updateQuoteStatus,
  type QuoteRequestRow,
  type QuoteStatus,
} from '@steryle/db'

export const QUOTE_PAGE_SIZE = 30

export type QuoteFilters = {
  status?: QuoteStatus
  query?: string
  page?: number
}

export async function listQuotes(filters: QuoteFilters = {}) {
  const page = Math.max(1, filters.page ?? 1)
  let rows = await listQuoteRequests()

  if (filters.status) {
    rows = rows.filter((q) => q.status === filters.status)
  }
  if (filters.query) {
    const term = filters.query.trim().toLowerCase()
    rows = rows.filter((q) =>
      `${q.organisation} ${q.requirement} ${q.contactName ?? ''} ${q.contactPhone ?? ''}`
        .toLowerCase()
        .includes(term),
    )
  }

  const start = (page - 1) * QUOTE_PAGE_SIZE
  return {
    rows: rows.slice(start, start + QUOTE_PAGE_SIZE),
    total: rows.length,
    page,
  }
}

export async function setQuoteStatus(id: string, status: QuoteStatus) {
  return updateQuoteStatus(id, status)
}

export type { QuoteRequestRow, QuoteStatus }
