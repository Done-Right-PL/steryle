'use client'

import { useTransition } from 'react'
import { updateQuoteStatusAction } from '@/app/(portal)/quotes/actions'
import type { QuoteStatus } from '@/lib/quotes'

const STATUSES: { value: QuoteStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'closed', label: 'Closed' },
]

export function QuoteStatusSelect({
  id,
  status,
}: {
  id: string
  status: QuoteStatus
}) {
  const [pending, startTransition] = useTransition()

  return (
    <form
      action={updateQuoteStatusAction}
      className="mt-2"
      onChange={(e) => {
        const form = e.currentTarget
        startTransition(() => {
          form.requestSubmit()
        })
      }}
    >
      <input type="hidden" name="id" value={id} />
      <select
        name="status"
        defaultValue={status}
        disabled={pending}
        className="field h-9 pr-8 text-[12px]"
        aria-label="Update quote status"
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </form>
  )
}
