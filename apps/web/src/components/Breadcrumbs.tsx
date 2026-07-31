import Link from 'next/link'

interface Crumb {
  label: string
  href?: string
}

export function Breadcrumbs({ trail }: { trail: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-2 text-xs text-ink-400">
        <li>
          <Link href="/" className="hover:text-brand-700">
            Home
          </Link>
        </li>
        {trail.map((crumb) => (
          <li key={crumb.label} className="flex items-center gap-2">
            <span aria-hidden="true">/</span>
            {crumb.href ? (
              <Link href={crumb.href} className="hover:text-brand-700">
                {crumb.label}
              </Link>
            ) : (
              <span className="text-ink-700">{crumb.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
