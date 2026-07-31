'use client'

import Image from 'next/image'
import Link from 'next/link'
import { formatINR, FREE_SHIPPING_THRESHOLD } from '@steryle/core'
import { useCart } from '@/lib/cart-store'
import { Icon } from './Icons'
import { QtyStepper } from './QtyStepper'

export function CartView() {
  const { items, hydrated, subtotal, shipping, tax, total, setQty, remove } = useCart()

  if (!hydrated) {
    return <div className="container-x py-24 text-[13px] text-ink-300">Loading your cart…</div>
  }

  if (items.length === 0) {
    return (
      <div className="container-x py-28 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">
          Your cart is empty
        </h1>
        <p className="mt-4 text-[13px] text-ink-400">
          Browse the catalogue and add the supplies you need.
        </p>
        <Link href="/categories" className="btn-primary mt-9">
          Browse catalogue <Icon.arrow width={16} height={16} />
        </Link>
      </div>
    )
  }

  const toFreeShipping = FREE_SHIPPING_THRESHOLD - subtotal

  return (
    <div className="container-x py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">
        Cart
      </h1>
      <p className="mt-3 text-[13px] text-ink-400">
        {items.length} {items.length === 1 ? 'item' : 'items'}
      </p>

      <div className="mt-12 grid gap-14 lg:grid-cols-[1fr_360px]">
        <ul className="divide-y divide-paper-200 border-y border-paper-200">
          {items.map((line) => (
            <li key={line.sku} className="flex gap-5 py-6">
              <Link
                href={`/product/${line.slug}`}
                className="photo-plate h-24 w-24 shrink-0 sm:h-28 sm:w-28"
              >
                {line.image ? (
                  <Image
                    src={line.image}
                    alt={line.name}
                    fill
                    sizes="112px"
                    className="object-contain p-2.5 mix-blend-multiply"
                  />
                ) : null}
              </Link>

              <div className="flex min-w-0 flex-1 flex-col">
                <p className="label">{line.brand}</p>
                <Link
                  href={`/product/${line.slug}`}
                  className="mt-1 line-clamp-2 text-[13px] leading-snug text-ink-700 hover:text-brand-700"
                >
                  {line.name}
                </Link>
                <p className="mt-1 text-[11px] text-ink-300">{line.sku}</p>

                <div className="mt-auto flex flex-wrap items-center gap-4 pt-4">
                  <QtyStepper value={line.qty} onChange={(q) => setQty(line.sku, q)} />
                  <button
                    type="button"
                    onClick={() => remove(line.sku)}
                    className="flex items-center gap-1.5 text-[11px] text-ink-400 hover:text-brand-700"
                  >
                    <Icon.trash width={13} height={13} /> Remove
                  </button>
                </div>
              </div>

              <div className="text-right">
                <p className="text-[15px] font-semibold tracking-tight text-ink">
                  {formatINR(line.price * line.qty)}
                </p>
                {line.qty > 1 && (
                  <p className="mt-1 text-[11px] text-ink-300">{formatINR(line.price)} each</p>
                )}
              </div>
            </li>
          ))}
        </ul>

        <aside className="lg:sticky lg:top-40 lg:self-start">
          <div className="card p-6">
            <p className="text-sm font-bold text-ink-900">Order summary</p>

            <dl className="mt-6 space-y-3 text-[13px]">
              <Row label="Subtotal" value={formatINR(subtotal)} />
              <Row label="Shipping" value={shipping === 0 ? 'Free' : formatINR(shipping)} />
              <Row label="GST (12%)" value={formatINR(tax)} />
            </dl>

            <div className="mt-5 flex items-baseline justify-between border-t border-paper-200 pt-5">
              <span className="text-[13px] text-ink-400">Total</span>
              <span className="text-xl font-extrabold tracking-tight text-ink-900">
                {formatINR(total)}
              </span>
            </div>

            {toFreeShipping > 0 && (
              <p className="mt-4 rounded-lg bg-brand-50 px-3 py-2 text-[11px] text-brand-700">
                Add {formatINR(toFreeShipping)} more for free delivery.
              </p>
            )}

            <Link href="/checkout" className="btn-primary mt-7 w-full">
              Checkout
            </Link>
            <Link href="/categories" className="btn-quiet mt-3 w-full">
              Continue shopping
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-ink-400">{label}</dt>
      <dd className="font-medium text-ink-800">{value}</dd>
    </div>
  )
}
