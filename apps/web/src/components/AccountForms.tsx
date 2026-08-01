'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { formatINR } from '@steryle/core'
import { apiFetch, useCustomer, setCustomer } from '@/lib/auth-store'
import { cartStore, useCart } from '@/lib/cart-store'

function normalizePhone(raw: string) {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2)
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1)
  return digits
}

export function AccountSignIn() {
  const { customer, hydrated, logout, refresh } = useCustomer()
  const { replace } = useCart()
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [orders, setOrders] = useState<
    Array<{ id: string; reference: string; total: number; status: string; placedAt: string }>
  >([])
  const otpRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (step === 'otp') otpRef.current?.focus()
  }, [step])

  useEffect(() => {
    cartStore.setAuthed(Boolean(customer))
    if (!customer) return
    void (async () => {
      const [cartRes, ordersRes] = await Promise.all([
        apiFetch('/api/account/cart'),
        apiFetch('/api/account/orders'),
      ])
      if (cartRes.ok) {
        const data = (await cartRes.json()) as { items: Parameters<typeof replace>[0] }
        replace(data.items ?? [])
      }
      if (ordersRes.ok) {
        const data = (await ordersRes.json()) as {
          orders: Array<{
            id: string
            reference: string
            total: number
            status: string
            placedAt: string | Date
          }>
        }
        setOrders(
          (data.orders ?? []).map((o) => ({
            ...o,
            placedAt: typeof o.placedAt === 'string' ? o.placedAt : new Date(o.placedAt).toISOString(),
          })),
        )
      }
    })()
  }, [customer, replace])

  if (!hydrated) {
    return <div className="mt-6 h-24 animate-pulse rounded-lg bg-paper-100" />
  }

  if (customer) {
    return (
      <div className="mt-6 space-y-6">
        <div className="rounded-xl border border-paper-200 bg-paper-50/60 p-5 sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">
            Signed in
          </p>
          <p className="mt-2 text-lg font-semibold tracking-tight text-ink-900">{customer.name}</p>
          <p className="mt-0.5 text-[13px] text-ink-500">+91 {customer.phone}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/cart" className="btn-primary">
              View cart
            </Link>
            <Link href="/account?tab=wishlist" className="btn-outline">
              Wishlist
            </Link>
            <button
              type="button"
              className="btn-quiet"
              onClick={async () => {
                await logout()
                cartStore.setAuthed(false)
                setOrders([])
                setStep('phone')
                setPhone('')
                setOtp('')
              }}
            >
              Sign out
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-ink-900">Recent orders</h3>
          {orders.length === 0 ? (
            <p className="mt-2 text-[13px] text-ink-400">No orders yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-paper-200 rounded-xl border border-paper-200">
              {orders.slice(0, 8).map((order) => (
                <li key={order.id} className="flex items-center justify-between gap-3 px-4 py-3 text-[13px]">
                  <div>
                    <p className="font-medium text-ink">{order.reference}</p>
                    <p className="text-ink-400">
                      {new Date(order.placedAt).toLocaleDateString('en-IN')} · {order.status}
                    </p>
                  </div>
                  <p className="font-semibold text-ink">{formatINR(order.total)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    )
  }

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const normalised = normalizePhone(phone)
    if (!/^\d{10}$/.test(normalised)) {
      setError('Enter a valid 10-digit mobile number.')
      return
    }
    setBusy(true)
    try {
      const res = await apiFetch('/api/account/otp/send', {
        method: 'POST',
        body: JSON.stringify({ phone: normalised }),
      })
      const data = (await res.json()) as { error?: string; otp?: string }
      if (!res.ok) {
        setError(data.error || 'Could not send OTP.')
        return
      }
      setPhone(normalised)
      setStep('otp')
      if (data.otp) setOtp(data.otp)
    } catch {
      setError('Network error — try again.')
    } finally {
      setBusy(false)
    }
  }

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const code = otp.replace(/\D/g, '')
    if (code.length !== 6) {
      setError('Enter the 6-digit OTP.')
      return
    }
    setBusy(true)
    try {
      const res = await apiFetch('/api/account/otp/verify', {
        method: 'POST',
        body: JSON.stringify({
          phone,
          otp: code,
          name: name.trim() || undefined,
          cart: cartStore.getLines(),
        }),
      })
      const data = (await res.json()) as {
        error?: string
        customer?: { id: string; name: string; phone: string; email: string | null }
        cart?: Parameters<typeof replace>[0]
      }
      if (!res.ok || !data.customer) {
        setError(data.error || 'Could not verify OTP.')
        return
      }
      setCustomer(data.customer)
      cartStore.setAuthed(true)
      if (data.cart) replace(data.cart)
      await refresh()
    } catch {
      setError('Network error — try again.')
    } finally {
      setBusy(false)
    }
  }

  if (step === 'otp') {
    return (
      <form className="mt-6 space-y-4" onSubmit={verifyOtp} noValidate>
        <p className="text-[13px] leading-relaxed text-ink-500">
          Enter the code sent to <span className="font-semibold text-ink-800">+91 {phone}</span>.{' '}
          <button
            type="button"
            className="font-medium text-brand-600 underline-offset-2 hover:underline"
            onClick={() => {
              setStep('phone')
              setOtp('')
              setError(null)
            }}
          >
            Change number
          </button>
        </p>
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-medium text-ink-600">Your name</span>
          <input
            className="field"
            placeholder="Optional — used on invoices"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-medium text-ink-600">One-time password</span>
          <input
            ref={otpRef}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="6-digit code"
            className="field tracking-[0.35em]"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          />
        </label>
        {error ? (
          <p role="alert" className="text-[12px] text-danger-600">
            {error}
          </p>
        ) : null}
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? 'Verifying…' : 'Verify & continue'}
        </button>
      </form>
    )
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={sendOtp} noValidate>
      <label className="block">
        <span className="mb-1.5 block text-[12px] font-medium text-ink-600">Mobile number</span>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-0 grid w-12 place-items-center text-[13px] font-medium text-ink-500">
            +91
          </span>
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={10}
            placeholder="9876543210"
            className="field pl-12"
            value={phone}
            onChange={(e) => setPhone(normalizePhone(e.target.value).slice(0, 10))}
          />
        </div>
      </label>
      {error ? (
        <p role="alert" className="text-[12px] text-danger-600">
          {error}
        </p>
      ) : null}
      <button type="submit" className="btn-primary w-full" disabled={busy}>
        {busy ? 'Sending…' : 'Send OTP'}
      </button>
    </form>
  )
}

export function BulkQuoteForm() {
  const [sent, setSent] = useState(false)
  const [org, setOrg] = useState('')
  const [requirement, setRequirement] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (sent) {
    return (
      <div className="mt-6 rounded-xl border border-paper-200 bg-paper-50/60 p-5 sm:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">
          Request received
        </p>
        <p className="mt-2 text-[15px] font-semibold tracking-tight text-ink-900">
          We&apos;ll reply within one working day.
        </p>
        <button
          type="button"
          className="btn-outline mt-5 w-full sm:w-auto"
          onClick={() => {
            setSent(false)
            setOrg('')
            setRequirement('')
            setContactName('')
            setContactPhone('')
          }}
        >
          Submit another
        </button>
      </div>
    )
  }

  return (
    <form
      className="mt-6 space-y-4"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault()
        setError(null)
        if (!org.trim() || !requirement.trim()) {
          setError('Add your organisation and what you need.')
          return
        }
        setBusy(true)
        try {
          const res = await apiFetch('/api/quotes', {
            method: 'POST',
            body: JSON.stringify({
              organisation: org.trim(),
              requirement: requirement.trim(),
              contactName: contactName.trim() || undefined,
              contactPhone: normalizePhone(contactPhone) || undefined,
            }),
          })
          const data = (await res.json().catch(() => ({}))) as { error?: string }
          if (!res.ok) {
            setError(data.error || 'Could not submit — try again.')
            return
          }
          setSent(true)
        } catch {
          setError('Network error — try again.')
        } finally {
          setBusy(false)
        }
      }}
    >
      <label className="block">
        <span className="mb-1.5 block text-[12px] font-medium text-ink-600">Organisation</span>
        <input
          className="field"
          placeholder="Clinic or hospital name"
          value={org}
          onChange={(e) => setOrg(e.target.value)}
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[12px] font-medium text-ink-600">Requirement</span>
        <textarea
          rows={4}
          className="field h-auto min-h-[7rem] py-3"
          placeholder="Products, quantities and delivery city"
          value={requirement}
          onChange={(e) => setRequirement(e.target.value)}
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-medium text-ink-600">Contact name</span>
          <input
            className="field"
            placeholder="Optional"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-medium text-ink-600">Phone</span>
          <input
            className="field"
            type="tel"
            inputMode="numeric"
            placeholder="Optional"
            value={contactPhone}
            onChange={(e) => setContactPhone(normalizePhone(e.target.value).slice(0, 10))}
          />
        </label>
      </div>
      {error ? (
        <p role="alert" className="text-[12px] text-danger-600">
          {error}
        </p>
      ) : null}
      <button type="submit" className="btn-outline w-full" disabled={busy}>
        {busy ? 'Submitting…' : 'Submit request'}
      </button>
    </form>
  )
}
