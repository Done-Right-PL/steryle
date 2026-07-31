import { Icon } from './Icons'

interface Props {
  value: number
  reviews: number
  size?: number
}

export function Rating({ value, reviews, size = 14 }: Props) {
  if (!reviews) {
    return <span className="text-xs text-ink-400">No reviews yet</span>
  }

  return (
    <span className="flex items-center gap-1.5 text-xs text-ink-400">
      <Icon.star width={size} height={size} className="fill-success-600 text-success-600" />
      <span className="font-semibold text-ink-800">{value.toFixed(1)}</span>
      <span>({reviews})</span>
    </span>
  )
}
