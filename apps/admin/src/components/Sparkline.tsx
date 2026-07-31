/**
 * Inline SVG bar chart for the daily revenue series.
 *
 * Hand-rolled rather than pulled from a charting library: it is ~40 lines,
 * renders on the server with no client JS, and keeps the monochrome palette
 * that a themed chart library would fight.
 */
import { formatDate, formatINRCompact } from '@/lib/format'

export function Sparkline({
  data,
  height = 72,
}: {
  data: { date: string; revenue: number }[]
  height?: number
}) {
  const max = Math.max(...data.map((d) => d.revenue), 1)
  const gap = 2

  return (
    <div>
      <div
        className="flex items-end gap-[2px]"
        style={{ height }}
        role="img"
        aria-label={`Daily revenue for the last ${data.length} days, peaking at ${formatINRCompact(max)}`}
      >
        {data.map((d) => {
          // Zero-revenue days keep a 1px stub so gaps read as gaps, not absence.
          const pct = d.revenue === 0 ? 0 : Math.max(4, (d.revenue / max) * 100)
          return (
            <div
              key={d.date}
              className="group relative flex-1"
              style={{ height: '100%', marginInline: gap / 2 }}
            >
              <div
                className={`absolute bottom-0 w-full ${d.revenue === 0 ? 'bg-paper-200' : 'bg-ink-300 group-hover:bg-ink'} transition-colors`}
                style={{ height: d.revenue === 0 ? 1 : `${pct}%` }}
              />
              <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap border border-ink bg-ink px-2 py-1 text-[11px] text-paper group-hover:block">
                {formatDate(d.date)} · {formatINRCompact(d.revenue)}
              </span>
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-ink-300">
        <span>{formatDate(data[0]?.date)}</span>
        <span>{formatDate(data[data.length - 1]?.date)}</span>
      </div>
    </div>
  )
}
