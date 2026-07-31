'use client'

import { Icon } from './Icons'

interface Props {
  value: number
  onChange: (next: number) => void
  disabled?: boolean
  min?: number
  max?: number
}

export function QtyStepper({ value, onChange, disabled, min = 1, max = 99 }: Props) {
  return (
    <div className="flex h-11 w-fit items-center rounded-lg border border-paper-200">
      <button
        type="button"
        disabled={disabled || value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="grid h-full w-11 place-items-center text-ink-500 hover:text-brand-700 disabled:opacity-30"
        aria-label="Decrease quantity"
      >
        <Icon.minus width={14} height={14} />
      </button>
      <span className="w-10 text-center text-sm font-semibold tabular-nums text-ink-900">
        {value}
      </span>
      <button
        type="button"
        disabled={disabled || value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="grid h-full w-11 place-items-center text-ink-500 hover:text-brand-700 disabled:opacity-30"
        aria-label="Increase quantity"
      >
        <Icon.plus width={14} height={14} />
      </button>
    </div>
  )
}
