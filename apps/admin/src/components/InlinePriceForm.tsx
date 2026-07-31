'use client'

import { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { updatePrice, type ActionState } from '@/app/(portal)/products/actions'
import { discountPct, formatINR } from '@/lib/format'

function SaveButton({ dirty }: { dirty: boolean }) {
  const { pending } = useFormStatus()

  // The button only appears once something actually changed, so a dense table
  // of 30 rows is not 30 competing call-to-actions.
  if (!dirty && !pending) return null

  return (
    <button type="submit" className="btn-primary h-8 px-3" disabled={pending}>
      {pending ? 'Saving…' : 'Save'}
    </button>
  )
}

/**
 * Edit price and MRP directly in the catalogue table.
 *
 * Discount is recomputed as you type so the effect of a change is visible
 * before saving — it is derived, never stored, so it cannot drift from the
 * numbers in these two inputs.
 */
export function InlinePriceForm({
  sku,
  price,
  mrp,
  disabled,
}: {
  sku: string
  price: number
  mrp: number
  disabled?: boolean
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(updatePrice, {})
  const [draftPrice, setDraftPrice] = useState(String(price))
  const [draftMrp, setDraftMrp] = useState(String(mrp))

  // Re-sync when the server sends new values (after a save, or on pagination).
  useEffect(() => {
    setDraftPrice(String(price))
    setDraftMrp(String(mrp))
  }, [price, mrp])

  const dirty = draftPrice !== String(price) || draftMrp !== String(mrp)
  const nextPrice = Number(draftPrice)
  const nextMrp = Number(draftMrp)
  const valid = Number.isFinite(nextPrice) && Number.isFinite(nextMrp)
  const exceedsMrp = valid && nextPrice > nextMrp

  if (disabled) {
    return (
      <div className="text-right">
        <p className="text-[13px] font-medium text-ink">{formatINR(price)}</p>
        <p className="text-[11px] text-ink-300">
          MRP {formatINR(mrp)} · {discountPct(price, mrp)}% off
        </p>
      </div>
    )
  }

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="sku" value={sku} />

      <div className="flex items-center gap-1.5">
        <label className="sr-only" htmlFor={`price-${sku}`}>
          Selling price for {sku}
        </label>
        <span className="text-[11px] text-ink-300">₹</span>
        <input
          id={`price-${sku}`}
          name="price"
          type="number"
          min={0}
          step={1}
          value={draftPrice}
          onChange={(e) => setDraftPrice(e.target.value)}
          className="h-8 w-20 border border-paper-200 bg-paper px-2 text-right text-[13px] text-ink focus:border-ink focus:outline-none"
        />
        <SaveButton dirty={dirty && !exceedsMrp} />
      </div>

      <div className="flex items-center gap-1.5">
        <label className="sr-only" htmlFor={`mrp-${sku}`}>
          MRP for {sku}
        </label>
        <span className="text-[10px] uppercase tracking-wide text-ink-300">MRP</span>
        <input
          id={`mrp-${sku}`}
          name="mrp"
          type="number"
          min={0}
          step={1}
          value={draftMrp}
          onChange={(e) => setDraftMrp(e.target.value)}
          className="h-7 w-20 border border-paper-200 bg-paper px-2 text-right text-[12px] text-ink-500 focus:border-ink focus:outline-none"
        />
      </div>

      <p
        className={`text-[11px] ${exceedsMrp ? 'font-medium text-ink' : 'text-ink-300'}`}
        role={exceedsMrp ? 'alert' : undefined}
      >
        {exceedsMrp
          ? 'Price is above MRP'
          : valid
            ? `${discountPct(nextPrice, nextMrp)}% off`
            : 'Enter whole rupees'}
      </p>

      {state.error && (
        <p role="alert" className="text-[11px] font-medium text-ink">
          {state.error}
        </p>
      )}
      {state.ok && !dirty && <p className="text-[11px] text-ink-400">{state.ok}</p>}
    </form>
  )
}
