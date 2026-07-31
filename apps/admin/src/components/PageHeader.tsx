import Link from 'next/link'

export function PageHeader({
  title,
  description,
  backHref,
  backLabel,
  actions,
}: {
  title: string
  description?: string
  backHref?: string
  backLabel?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="mb-8">
      {backHref && (
        <Link
          href={backHref}
          className="mb-3 inline-block text-[12px] text-ink-400 hover:text-ink"
        >
          ← {backLabel ?? 'Back'}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
          {description && <p className="mt-1 text-[13px] text-ink-400">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}

export function SectionTitle({
  children,
  aside,
}: {
  children: React.ReactNode
  aside?: React.ReactNode
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-4">
      <h2 className="text-[13px] font-semibold text-ink">{children}</h2>
      {aside && <span className="text-[11px] text-ink-400">{aside}</span>}
    </div>
  )
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-dashed border-paper-300 px-5 py-12 text-center text-[13px] text-ink-400">
      {children}
    </div>
  )
}
