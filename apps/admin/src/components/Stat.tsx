import { formatSignedPct } from '@/lib/format'
import type { Trend } from '@/lib/metrics'

/**
 * A headline number with its period-over-period movement.
 *
 * Direction is shown with an arrow glyph rather than colour, and the caption
 * always names the comparison window so "+18%" is never ambiguous.
 */
export function Stat({
  label,
  value,
  trend,
  caption,
  /** Set when a rise is bad — cancellations, blocked accounts. */
  invert = false,
}: {
  label: string
  value: string
  trend?: Trend
  caption?: string
  invert?: boolean
}) {
  const pct = trend?.changePct ?? null
  const isFlat = pct === null || pct === 0
  const isGood = pct !== null && (invert ? pct < 0 : pct > 0)

  return (
    <div className="card p-5">
      <p className="label">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-ink">{value}</p>
      <div className="mt-2 flex items-baseline gap-2 text-[12px]">
        {trend && (
          <span className={isFlat ? 'text-ink-300' : isGood ? 'text-ink' : 'text-ink-500'}>
            <span aria-hidden="true">{isFlat ? '→' : pct > 0 ? '↑' : '↓'}</span>{' '}
            <span className="font-medium">{formatSignedPct(pct)}</span>
          </span>
        )}
        {caption && <span className="text-ink-400">{caption}</span>}
      </div>
    </div>
  )
}
