'use client'

import { useEffect, useRef, useState, useTransition } from 'react'

const MOCK_OTP = '123456'
const STORAGE_KEY = 'steryle.account.mock.v1'

type Session = { phone: string; signedInAt: string }

function normalizePhone(raw: string) {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2)
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1)
  return digits
}

function isValidPhone(phone: string) {
  return /^[6-9]\d{9}$/.test(phone)
}

function loadSession(): Session | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Session
    if (!parsed?.phone) return null
    return parsed
  } catch {
    return null
  }
}

function saveSession(session: Session | null) {
  if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  else localStorage.removeItem(STORAGE_KEY)
}

export function AccountSignIn() {
  const [hydrated, setHydrated] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const otpRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setSession(loadSession())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (step === 'otp') otpRef.current?.focus()
  }, [step])

  if (!hydrated) {
    return (
      <div className="mt-6 space-y-4" aria-hidden>
        <div className="h-16 animate-pulse rounded-lg bg-paper-100" />
        <div className="h-11 animate-pulse rounded-lg bg-paper-100" />
      </div>
    )
  }

  if (session) {
    return (
      <div className="mt-6 rounded-xl border border-paper-200 bg-paper-50/60 p-5 sm:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">
          Signed in
        </p>
        <p className="mt-2 text-lg font-semibold tracking-tight text-ink-900">
          +91 {session.phone}
        </p>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-400">
          Demo session — orders and profile sync will land here once the backend is live.
        </p>
        <button
          type="button"
          className="btn-outline mt-5 w-full sm:w-auto"
          onClick={() => {
            saveSession(null)
            setSession(null)
            setStep('phone')
            setPhone('')
            setOtp('')
            setError(null)
            setInfo(null)
          }}
        >
          Sign out
        </button>
      </div>
    )
  }

  const sendOtp = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    const normalised = normalizePhone(phone)
    if (!isValidPhone(normalised)) {
      setError('Enter a valid 10-digit Indian mobile number.')
      return
    }
    startTransition(() => {
      setPhone(normalised)
      setStep('otp')
      setOtp('')
      setInfo(`Mock OTP sent to +91 ${normalised}. Use ${MOCK_OTP}.`)
    })
  }

  const verifyOtp = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const code = otp.replace(/\D/g, '')
    if (code.length !== 6) {
      setError('Enter the 6-digit OTP.')
      return
    }
    if (code !== MOCK_OTP) {
      setError(`Incorrect OTP. For this demo, use ${MOCK_OTP}.`)
      return
    }
    const next: Session = { phone, signedInAt: new Date().toISOString() }
    saveSession(next)
    setSession(next)
  }

  if (step === 'otp') {
    return (
      <form className="mt-6 space-y-4" onSubmit={verifyOtp} noValidate>
        <p className="text-[13px] leading-relaxed text-ink-400">
          Code sent to{' '}
          <span className="font-medium text-ink-700">+91 {phone}</span>
          .{' '}
          <button
            type="button"
            className="font-medium text-brand-600 underline-offset-2 hover:underline"
            onClick={() => {
              setStep('phone')
              setOtp('')
              setError(null)
              setInfo(null)
            }}
          >
            Change number
          </button>
        </p>
        <label className="block">
          <span className="text-[11px] text-ink-400">One-time password</span>
          <input
            ref={otpRef}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="6-digit code"
            className="field mt-1.5 tracking-[0.35em]"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'otp-error' : info ? 'otp-info' : undefined}
          />
        </label>
        {info ? (
          <p id="otp-info" className="text-[12px] leading-relaxed text-brand-700">
            {info}
          </p>
        ) : null}
        {error ? (
          <p id="otp-error" role="alert" className="text-[12px] leading-relaxed text-danger-600">
            {error}
          </p>
        ) : null}
        <button type="submit" className="btn-primary w-full" disabled={pending}>
          Verify &amp; sign in
        </button>
        <button
          type="button"
          className="btn-quiet w-full text-[12px] text-ink-400"
          onClick={() => {
            setInfo(`Mock OTP resent. Use ${MOCK_OTP}.`)
            setError(null)
          }}
        >
          Resend OTP
        </button>
      </form>
    )
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={sendOtp} noValidate>
      <label className="block">
        <span className="text-[11px] text-ink-400">Mobile number</span>
        <div className="relative mt-1.5">
          <span className="pointer-events-none absolute inset-y-0 left-0 grid w-12 place-items-center text-[13px] text-ink-500">
            +91
          </span>
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            pattern="[0-9]*"
            maxLength={10}
            placeholder="10-digit number"
            className="field pl-12"
            value={phone}
            onChange={(e) => setPhone(normalizePhone(e.target.value).slice(0, 10))}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'phone-error' : undefined}
          />
        </div>
      </label>
      {error ? (
        <p id="phone-error" role="alert" className="text-[12px] leading-relaxed text-danger-600">
          {error}
        </p>
      ) : null}
      <button type="submit" className="btn-primary w-full min-h-11" disabled={pending}>
        Send OTP
      </button>
      <p className="text-[11px] leading-relaxed text-ink-300">
        Demo sign-in — any valid Indian mobile works; OTP is always {MOCK_OTP}.
      </p>
    </form>
  )
}

export function BulkQuoteForm() {
  const [sent, setSent] = useState(false)
  const [org, setOrg] = useState('')
  const [requirement, setRequirement] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (sent) {
    return (
      <div className="mt-6 rounded-xl border border-paper-200 bg-paper-50/60 p-5 sm:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">
          Request received
        </p>
        <p className="mt-2 text-[15px] font-semibold tracking-tight text-ink-900">
          We&apos;ll reply within one working day.
        </p>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-400">
          Demo only — nothing was emailed. For a real quote, call{' '}
          <a href="tel:+917822058149" className="font-medium text-brand-600">
            7822058149
          </a>{' '}
          or write to{' '}
          <a href="mailto:support@steryle.in" className="font-medium text-brand-600">
            support@steryle.in
          </a>
          .
        </p>
        <button
          type="button"
          className="btn-outline mt-5 w-full sm:w-auto"
          onClick={() => {
            setSent(false)
            setOrg('')
            setRequirement('')
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
      onSubmit={(e) => {
        e.preventDefault()
        setError(null)
        if (!org.trim() || !requirement.trim()) {
          setError('Add your organisation and what you need.')
          return
        }
        setSent(true)
      }}
    >
      <label className="block">
        <span className="text-[11px] text-ink-400">Organisation</span>
        <input
          className="field mt-1.5"
          placeholder="Clinic or hospital name"
          value={org}
          onChange={(e) => setOrg(e.target.value)}
          autoComplete="organization"
        />
      </label>
      <label className="block">
        <span className="text-[11px] text-ink-400">Requirement</span>
        <textarea
          rows={4}
          className="field mt-1.5 h-auto min-h-[7rem] py-3"
          placeholder="Products, quantities and delivery city"
          value={requirement}
          onChange={(e) => setRequirement(e.target.value)}
        />
      </label>
      {error ? (
        <p role="alert" className="text-[12px] leading-relaxed text-danger-600">
          {error}
        </p>
      ) : null}
      <button type="submit" className="btn-outline w-full min-h-11">
        Submit request
      </button>
    </form>
  )
}
