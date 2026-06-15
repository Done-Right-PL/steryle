import { Icon } from './Icons'

export default function Rating({ value, reviews, size = 14 }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="inline-flex items-center gap-0.5 rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700">
        <Icon.star width={size} height={size} />
        <span className="text-xs font-semibold">{value.toFixed(1)}</span>
      </span>
      {reviews != null && (
        <span className="text-xs text-slate-400">({reviews})</span>
      )}
    </div>
  )
}
