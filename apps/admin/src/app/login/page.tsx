import type { Metadata } from 'next'
import { LoginForm } from './LoginForm'

export const metadata: Metadata = { title: 'Sign in' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper-50 px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <p className="text-2xl font-semibold tracking-tight text-ink">Steryle</p>
          <p className="label mt-1">Operations console</p>
        </div>

        <div className="card p-6">
          <h1 className="text-base font-semibold text-ink">Sign in</h1>
          <p className="mt-1 text-[13px] text-ink-400">
            Admin access only. Every change you make here is recorded.
          </p>
          <LoginForm next={next} />
        </div>

        <p className="mt-6 text-[11px] text-ink-300">
          Trouble signing in? Ask an owner to reset your account.
        </p>
      </div>
    </main>
  )
}
