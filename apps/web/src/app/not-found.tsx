import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="container-x py-32 text-center">
      <p className="label">404</p>
      <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-ink-900">
        We couldn&apos;t find that page
      </h1>
      <p className="mt-4 text-[13px] text-ink-400">
        The product or category may have been moved or renamed.
      </p>
      <div className="mt-9 flex justify-center gap-3">
        <Link href="/" className="btn-primary">
          Go home
        </Link>
        <Link href="/categories" className="btn-outline">
          Browse catalogue
        </Link>
      </div>
    </div>
  )
}
