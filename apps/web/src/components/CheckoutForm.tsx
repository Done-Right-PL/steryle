'use client'

import Link from 'next/link'
import { useState } from 'react'
import { formatINR } from '@steryle/core'
import { apiFetch, useCustomer } from '@/lib/auth-store'
import { useCart } from '@/lib/cart-store'
import { mockPaymentProof, openRazorpayCheckout } from '@/lib/razorpay'
import { Icon } from './Icons'

const PAYMENT_METHODS = ['UPI', 'Card', 'Net banking', 'Cash on delivery'] as const

type PaymentIntent = {
  mock: boolean
  keyId: string
  razorpayOrderId: string
  amount: number
  currency: string
  name: string
  description: string
  prefill: { name: string; email?: string; contact: string }
}

type OrderPayload = {
  id: string
  reference: string
}

export function CheckoutForm() {
  const { customer, hydrated: authHydrated } = useCustomer()
  const { items, hydrated, subtotal, shipping, tax, total, clear } = useCart()
  const [orderId, setOrderId] = useState<string | null>(null)
  const [method, setMethod] = useState<(typeof PAYMENT_METHODS)[number]>('UPI')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const verifyAndFinish = async (order: OrderPayload, proof: {
    razorpay_order_id: string
    razorpay_payment_id: string
    razorpay_signature: string
  }) => {
    const res = await apiFetch('/api/orders/verify', {
      method: 'POST',
      body: JSON.stringify({
        orderId: order.id,
        ...proof,
      }),
    })
    const data = (await res.json()) as { error?: string; order?: OrderPayload }
    if (!res.ok || !data.order) {
      throw new Error(data.error || 'Payment verification failed.')
    }
    clear()
    setOrderId(data.order.reference)
  }

  const placeOrder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (!customer) {
      setError('Please sign in before placing an order.')
      return
    }

    const form = new FormData(e.currentTarget)
    setBusy(true)
    try {
      const res = await apiFetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          name: String(form.get('name') || ''),
          phone: String(form.get('phone') || ''),
          email: String(form.get('email') || ''),
          address: String(form.get('address') || ''),
          city: String(form.get('city') || ''),
          pin: String(form.get('pin') || ''),
          gstin: String(form.get('gstin') || ''),
          paymentMethod: method,
        }),
      })
      const data = (await res.json()) as {
        error?: string
        order?: OrderPayload
        payment?: PaymentIntent | null
      }
      if (!res.ok || !data.order) {
        setError(data.error || 'Could not place order.')
        return
      }

      // COD — already confirmed server-side.
      if (!data.payment) {
        clear()
        setOrderId(data.order.reference)
        return
      }

      if (data.payment.mock) {
        await verifyAndFinish(data.order, mockPaymentProof(data.payment.razorpayOrderId))
        return
      }

      await new Promise<void>((resolve, reject) => {
        openRazorpayCheckout({
          key: data.payment!.keyId,
          amount: data.payment!.amount,
          currency: data.payment!.currency,
          name: data.payment!.name,
          description: data.payment!.description,
          order_id: data.payment!.razorpayOrderId,
          prefill: data.payment!.prefill,
          onSuccess: (proof) => {
            verifyAndFinish(data.order!, proof)
              .then(() => resolve())
              .catch((err: unknown) =>
                reject(err instanceof Error ? err : new Error('Payment verification failed.')),
              )
          },
          onDismiss: () => reject(new Error('Payment cancelled.')),
        }).catch(reject)
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error — try again.')
    } finally {
      setBusy(false)
    }
  }

  if (orderId) {
    return (
      <div className="container-x py-16 text-center sm:py-28">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success-50 text-success-600">
          <Icon.check width={28} height={28} />
        </span>
        <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
          Order confirmed
        </h1>
        <p className="mt-4 text-[13px] text-ink-400">
          Reference <span className="font-medium text-ink">{orderId}</span> — we&apos;ll email
          the GST invoice once payment clears.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link href="/account" className="btn-primary">
            View account
          </Link>
          <Link href="/categories" className="btn-outline">
            Continue shopping
          </Link>
        </div>
      </div>
    )
  }

  if (!hydrated || !authHydrated) {
    return <div className="container-x py-24 text-[13px] text-ink-300">Loading checkout…</div>
  }

  if (!customer) {
    return (
      <div className="container-x py-16 text-center sm:py-28">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
          Sign in to checkout
        </h1>
        <p className="mt-3 text-[13px] text-ink-400">
          Your cart is saved — sign in with your mobile to place the order.
        </p>
        <Link href="/account" className="btn-primary mt-9">
          Sign in
        </Link>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="container-x py-16 text-center sm:py-28">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
          Nothing to check out
        </h1>
        <Link href="/categories" className="btn-primary mt-9">
          Browse catalogue
        </Link>
      </div>
    )
  }

  return (
    <div className="container-x py-6 sm:py-10">
      <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">Checkout</h1>

      <form onSubmit={placeOrder} className="mt-8 grid gap-10 sm:mt-12 lg:grid-cols-[1fr_360px] lg:gap-14">
        <div className="min-w-0 space-y-10 sm:space-y-12">
          <fieldset>
            <legend className="label">Delivery address</legend>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Full name" name="name" autoComplete="name" defaultValue={customer.name} />
              <Field
                label="Phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                defaultValue={customer.phone}
              />
              <Field
                label="Email"
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={customer.email ?? ''}
                required={false}
              />
              <Field label="Clinic / hospital (optional)" name="org" required={false} />
              <Field label="Address" name="address" className="sm:col-span-2" />
              <Field label="City" name="city" autoComplete="address-level2" />
              <Field label="PIN code" name="pin" inputMode="numeric" autoComplete="postal-code" />
              <Field
                label="GSTIN (optional)"
                name="gstin"
                required={false}
                defaultValue={customer.gstin ?? ''}
              />
            </div>
          </fieldset>

          <fieldset>
            <legend className="label">Payment</legend>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {PAYMENT_METHODS.map((m) => (
                <label
                  key={m}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm ${
                    method === m ? 'border-brand-500 bg-brand-50' : 'border-paper-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    className="accent-brand-600"
                    checked={method === m}
                    onChange={() => setMethod(m)}
                  />
                  {m}
                </label>
              ))}
            </div>
          </fieldset>

          {error ? (
            <p role="alert" className="text-[13px] text-danger-600">
              {error}
            </p>
          ) : null}
        </div>

        <aside className="h-fit rounded-xl border border-paper-200 p-5">
          <h2 className="text-sm font-semibold text-ink-900">Order summary</h2>
          <ul className="mt-4 space-y-3 text-[13px]">
            {items.map((line) => (
              <li key={line.sku} className="flex justify-between gap-3">
                <span className="min-w-0 text-ink-600">
                  {line.name} × {line.qty}
                </span>
                <span className="shrink-0 font-medium">{formatINR(line.price * line.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-5 space-y-2 border-t border-paper-200 pt-4 text-[13px]">
            <div className="flex justify-between">
              <dt className="text-ink-400">Subtotal</dt>
              <dd>{formatINR(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-400">Shipping</dt>
              <dd>{shipping === 0 ? 'Free' : formatINR(shipping)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-400">GST</dt>
              <dd>{formatINR(tax)}</dd>
            </div>
            <div className="flex justify-between text-base font-semibold">
              <dt>Total</dt>
              <dd>{formatINR(total)}</dd>
            </div>
          </dl>
          <button type="submit" className="btn-primary mt-6 w-full" disabled={busy}>
            {busy
              ? method === 'Cash on delivery'
                ? 'Placing order…'
                : 'Opening payment…'
              : method === 'Cash on delivery'
                ? 'Place order'
                : 'Pay & place order'}
          </button>
        </aside>
      </form>
    </div>
  )
}

function Field({
  label,
  name,
  className = '',
  required = true,
  defaultValue,
  ...rest
}: {
  label: string
  name: string
  className?: string
  required?: boolean
  defaultValue?: string
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[12px] font-medium text-ink-600">{label}</span>
      <input
        name={name}
        required={required}
        defaultValue={defaultValue}
        className="field"
        {...rest}
      />
    </label>
  )
}
