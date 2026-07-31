import type { Metadata } from 'next'
import Link from 'next/link'
import { categories, products } from '@steryle/core'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { CategoryIcon } from '@/components/Icons'

export const metadata: Metadata = {
  title: 'All categories',
  description: `Browse ${products.length} surgical and medical supplies across ${categories.length} categories.`,
}

export default function CategoriesPage() {
  return (
    <div className="container-x py-10">
      <Breadcrumbs trail={[{ label: 'Categories' }]} />

      <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-ink-900">All categories</h1>
      <p className="mt-2 text-sm text-ink-500">
        {products.length.toLocaleString('en-IN')} products across {categories.length} categories.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c, i) => (
          <Link
            key={c.slug}
            href={`/category/${c.slug}`}
            className="card group flex flex-col gap-4 p-6 transition hover:-translate-y-0.5 hover:shadow-hover"
          >
            <div className="flex items-start justify-between">
              <span
                className={`grid h-12 w-12 place-items-center rounded-xl ${
                  i % 2 ? 'bg-accent-500/10 text-accent-600' : 'bg-brand-50 text-brand-600'
                }`}
              >
                <CategoryIcon name={c.icon} width={26} height={26} />
              </span>
              <span className="text-xs text-ink-400">{c.productCount} items</span>
            </div>
            <div>
              <h2 className="font-semibold text-ink-800 group-hover:text-brand-700">{c.name}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{c.blurb}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
