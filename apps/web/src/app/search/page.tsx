import type { Metadata } from 'next'
import Link from 'next/link'
import { searchProducts, topBrands } from '@stryle/core'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { ProductGrid } from '@/components/ProductCard'

export const metadata: Metadata = { title: 'Search' }

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q = '' } = await searchParams
  const query = q.trim()
  const results = query ? searchProducts(query, 96) : []

  return (
    <div className="container-x py-10">
      <Breadcrumbs trail={[{ label: 'Search' }]} />

      <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-ink-900">
        {query ? `“${query}”` : 'Search'}
      </h1>
      <p className="mt-3 text-[13px] text-ink-400">
        {query
          ? `${results.length} ${results.length === 1 ? 'result' : 'results'}`
          : 'Search by product, brand or SKU.'}
      </p>

      {results.length > 0 ? (
        <div className="mt-12">
          <ProductGrid products={results} />
        </div>
      ) : (
        <div className="mt-16 border-t border-paper-200 pt-12">
          {query && (
            <p className="text-[13px] text-ink-400">
              Nothing matched that search. Try a brand name or a broader term.
            </p>
          )}
          <p className="label mt-10">Popular brands</p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            {topBrands.map((brand) => (
              <Link
                key={brand}
                href={`/search?q=${encodeURIComponent(brand)}`}
                className="border border-paper-200 px-3.5 py-2 text-[13px] text-ink-500 hover:border-ink hover:text-brand-700"
              >
                {brand}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
