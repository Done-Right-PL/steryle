/**
 * Display formatting. Dates are pinned to Asia/Kolkata so a server running in
 * UTC and an operator sitting in India never disagree about which day an order
 * was placed.
 */
const TZ = 'Asia/Kolkata'

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const compactInr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  notation: 'compact',
  maximumFractionDigits: 1,
})

const number = new Intl.NumberFormat('en-IN')

const dateFmt = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: TZ,
})

const dateTimeFmt = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: TZ,
})

export const formatINR = (n: number): string => inr.format(n)
/** Compact form for dashboard tiles, e.g. ₹12.4L. */
export const formatINRCompact = (n: number): string => compactInr.format(n)
export const formatCount = (n: number): string => number.format(n)
export const formatDate = (d: Date | string | null | undefined): string =>
  d ? dateFmt.format(new Date(d)) : '—'
export const formatDateTime = (d: Date | string | null | undefined): string =>
  d ? dateTimeFmt.format(new Date(d)) : '—'

export function formatRelative(d: Date | string | null | undefined): string {
  if (!d) return '—'
  const then = new Date(d).getTime()
  const diffDays = Math.floor((Date.now() - then) / (24 * 60 * 60 * 1000))
  if (diffDays <= 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 30) return `${diffDays} days ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} mo ago`
  return `${Math.floor(diffDays / 365)} yr ago`
}

/** `discountPct` is always derived from price and MRP, never stored. */
export function discountPct(price: number, mrp: number): number {
  if (mrp <= 0 || price >= mrp) return 0
  return Math.round(((mrp - price) / mrp) * 100)
}

export function formatSignedPct(pct: number | null): string {
  if (pct === null) return '—'
  return `${pct > 0 ? '+' : ''}${pct}%`
}
