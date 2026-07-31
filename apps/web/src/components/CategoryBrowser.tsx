'use client'

import { useMemo, useState } from 'react'
import { sortProducts, type Product, type SortKey } from '@steryle/core'
import { ProductGrid } from './ProductCard'

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'relevance', label: 'Featured' },
  { key: 'price-asc', label: 'Price: low to high' },
  { key: 'price-desc', label: 'Price: high to low' },
  { key: 'rating', label: 'Top rated' },
  { key: 'discount', label: 'Biggest saving' },
]

interface Props {
  products: Product[]
  brands: string[]
}

export function CategoryBrowser({ products, brands }: Props) {
  const [activeBrands, setActiveBrands] = useState<string[]>([])
  const [inStockOnly, setInStockOnly] = useState(false)
  const [sort, setSort] = useState<SortKey>('relevance')

  const visible = useMemo(() => {
    const filtered = products.filter(
      (p) =>
        (activeBrands.length === 0 || activeBrands.includes(p.brand)) &&
        (!inStockOnly || p.inStock),
    )
    return sortProducts(filtered, sort)
  }, [products, activeBrands, inStockOnly, sort])

  const toggleBrand = (brand: string) =>
    setActiveBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand],
    )

  return (
    <div className="mt-10 grid gap-10 lg:grid-cols-[220px_1fr] lg:gap-14">
      <aside className="lg:sticky lg:top-40 lg:self-start">
        <div className="flex items-center justify-between">
          <p className="label">Filter</p>
          {(activeBrands.length > 0 || inStockOnly) && (
            <button
              type="button"
              onClick={() => {
                setActiveBrands([])
                setInStockOnly(false)
              }}
              className="text-[11px] text-ink-400 underline hover:text-brand-700"
            >
              Clear
            </button>
          )}
        </div>

        <label className="mt-5 flex cursor-pointer items-center gap-2.5 text-[13px] text-ink-700">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="h-3.5 w-3.5 accent-brand-600"
          />
          In stock only
        </label>

        <p className="label mt-8">Brand</p>
        <div className="mt-4 max-h-[420px] space-y-2.5 overflow-y-auto pr-2">
          {brands.map((brand) => (
            <label
              key={brand}
              className="flex cursor-pointer items-center gap-2.5 text-[13px] text-ink-700"
            >
              <input
                type="checkbox"
                checked={activeBrands.includes(brand)}
                onChange={() => toggleBrand(brand)}
                className="h-3.5 w-3.5 shrink-0 accent-brand-600"
              />
              <span className="truncate">{brand}</span>
            </label>
          ))}
        </div>
      </aside>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-paper-200 pb-4">
          <p className="text-[13px] text-ink-400">
            {visible.length} of {products.length} products
          </p>
          <label className="flex items-center gap-2.5 text-[13px] text-ink-400">
            Sort
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-lg border border-paper-200 bg-white px-2 py-1.5 text-[13px] text-ink-800
                focus:border-brand-400 focus:outline-none"
            >
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-10">
          {visible.length > 0 ? (
            <ProductGrid products={visible} />
          ) : (
            <p className="py-20 text-center text-[13px] text-ink-400">
              No products match these filters.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
