'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { loginAction, type LoginState } from './actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? 'Signing in…' : 'Sign in'}
    </button>
  )
}

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction] = useActionState<LoginState, FormData>(loginAction, {})

  return (
    <form action={formAction} className="mt-6 space-y-4">
      {next && <input type="hidden" name="next" value={next} />}

      <div>
        <label htmlFor="email" className="label mb-1.5 block">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          autoFocus
          className="field"
          placeholder="you@steryle.in"
        />
      </div>

      <div>
        <label htmlFor="password" className="label mb-1.5 block">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="field"
          placeholder="••••••••"
        />
      </div>

      {state.error && (
        <p role="alert" className="border border-ink bg-paper-100 px-3 py-2 text-[13px] text-ink">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  )
}
