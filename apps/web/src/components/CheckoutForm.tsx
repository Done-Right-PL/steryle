'use client'

import Link from 'next/link'
import { useState } from 'react'
import { formatINR } from '@steryle/core'
import { useCart } from '@/lib/cart-store'
import { Icon } from './Icons'

const PAYMENT_METHODS = ['UPI', 'Card', 'Net banking', 'Cash on delivery'] as const

export function CheckoutForm() {
  const { items, hydrated, subtotal, shipping, tax, total, clear } = useCart()
  const [orderId, setOrderId] = useState<string | null>(null)
  const [method, setMethod] = useState<(typeof PAYMENT_METHODS)[number]>('UPI')

  const placeOrder = (e: React.FormEvent) => {
    e.preventDefault()
    setOrderId(`STR-${Date.now().toString(36).toUpperCase()}`)
    clear()
  }

  if (orderId) {
    return (
      <div className="container-x py-28 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success-50 text-success-600"><Icon.check width={28} height={28} /></span>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-ink-900">
          Order confirmed
        </h1>
        <p className="mt-4 text-[13px] text-ink-400">
          Reference <span className="font-medium text-ink">{orderId}</span> — a GST invoice has been
          emailed to you.
        </p>
        <p className="mt-2 text-[11px] text-ink-300">
          This is a demo storefront, so no payment was taken and nothing will ship.
        </p>
        <Link href="/categories" className="btn-primary mt-9">
          Continue shopping
        </Link>
      </div>
    )
  }

  if (!hydrated) {
    return <div className="container-x py-24 text-[13px] text-ink-300">Loading checkout…</div>
  }

  if (items.length === 0) {
    return (
      <div className="container-x py-28 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">
          Nothing to check out
        </h1>
        <Link href="/categories" className="btn-primary mt-9">
          Browse catalogue
        </Link>
      </div>
    )
  }

  return (
    <div className="container-x py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">
        Checkout
      </h1>

      <form onSubmit={placeOrder} className="mt-12 grid gap-14 lg:grid-cols-[1fr_360px]">
        <div className="space-y-12">
          <fieldset>
            <legend className="label">Delivery address</legend>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Full name" name="name" autoComplete="name" />
              <Field label="Phone" name="phone" type="tel" autoComplete="tel" />
              <Field label="Email" name="email" type="email" autoComplete="email" />
              <Field label="Clinic / hospital (optional)" name="org" required={false} />
              <Field label="Address" name="address" className="sm:col-span-2" />
              <Field label="City" name="city" autoComplete="address-level2" />
              <Field label="PIN code" name="pin" inputMode="numeric" autoComplete="postal-code" />
              <Field label="GSTIN (optional)" name="gstin" required={false} />
            </div>
          </fieldset>

          <fieldset>
            <legend className="label">Payment method</legend>
            <div className="mt-5 divide-y divide-paper-200 border-y border-paper-200">
              {PAYMENT_METHODS.map((m) => (
                <label key={m} className="flex cursor-pointer items-center gap-3 py-3.5 text-[13px]">
                  <input
                    type="radio"
                    name="payment"
                    value={m}
                    checked={method === m}
                    onChange={() => setMethod(m)}
                    className="h-3.5 w-3.5 accent-brand-600"
                  />
                  <span className="text-ink-700">{m}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <aside className="lg:sticky lg:top-40 lg:self-start">
          <div className="card p-6">
            <p className="text-sm font-bold text-ink-900">Order summary</p>

            <ul className="mt-5 space-y-3 border-b border-paper-200 pb-5 text-[13px]">
              {items.map((line) => (
                <li key={line.sku} className="flex justify-between gap-4">
                  <span className="min-w-0 flex-1 truncate text-ink-500">
                    {line.qty} × {line.name}
                  </span>
                  <span className="font-medium text-ink-800">{formatINR(line.price * line.qty)}</span>
                </li>
              ))}
            </ul>

            <dl className="mt-5 space-y-3 text-[13px]">
              <div className="flex justify-between">
                <dt className="text-ink-400">Subtotal</dt>
                <dd className="font-medium text-ink-800">{formatINR(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-400">Shipping</dt>
                <dd className="font-medium text-ink-800">{shipping === 0 ? 'Free' : formatINR(shipping)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-400">GST (12%)</dt>
                <dd className="font-medium text-ink-800">{formatINR(tax)}</dd>
              </div>
            </dl>

            <div className="mt-5 flex items-baseline justify-between border-t border-paper-200 pt-5">
              <span className="text-[13px] text-ink-400">Total</span>
              <span className="text-xl font-extrabold tracking-tight text-ink-900">
                {formatINR(total)}
              </span>
            </div>

            <button type="submit" className="btn-primary mt-7 w-full">
              Place order
            </button>
            <p className="mt-3 text-[11px] leading-relaxed text-ink-300">
              Demo only — no payment is processed and no order is dispatched.
            </p>
          </div>
        </aside>
      </form>
    </div>
  )
}

function Field({
  label,
  name,
  type = 'text',
  required = true,
  className,
  ...rest
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  className?: string
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`block ${className ?? ''}`}>
      <span className="text-[11px] text-ink-400">{label}</span>
      <input name={name} type={type} required={required} className="field mt-1.5" {...rest} />
    </label>
  )
}
