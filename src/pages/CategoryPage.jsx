import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import ProductCard from '../components/ProductCard'
import {
  getCategoryBySlug,
  getProductsByCategory,
} from '../data/catalog'

const SORTS = {
  popular: { label: 'Most popular', fn: (a, b) => b.reviews - a.reviews },
  priceLow: { label: 'Price: low to high', fn: (a, b) => a.price - b.price },
  priceHigh: { label: 'Price: high to low', fn: (a, b) => b.price - a.price },
  rating: { label: 'Top rated', fn: (a, b) => b.rating - a.rating },
  discount: { label: 'Biggest discount', fn: (a, b) => b.discountPct - a.discountPct },
}

export default function CategoryPage() {
  const { slug } = useParams()
  const category = getCategoryBySlug(slug)
  const allProducts = useMemo(() => getProductsByCategory(slug), [slug])

  const [sort, setSort] = useState('popular')
  const [inStockOnly, setInStockOnly] = useState(false)
  const [selectedBrands, setSelectedBrands] = useState([])

  const brands = useMemo(
    () => [...new Set(allProducts.map((p) => p.brand))].sort(),
    [allProducts],
  )

  const filtered = useMemo(() => {
    let list = allProducts
    if (inStockOnly) list = list.filter((p) => p.inStock)
    if (selectedBrands.length) list = list.filter((p) => selectedBrands.includes(p.brand))
    return [...list].sort(SORTS[sort].fn)
  }, [allProducts, inStockOnly, selectedBrands, sort])

  if (!category) {
    return (
      <div className="container-x py-16 text-center">
        <h1 className="text-2xl font-bold">Category not found</h1>
        <Link to="/categories" className="btn-primary mt-4">Browse categories</Link>
      </div>
    )
  }

  const toggleBrand = (b) =>
    setSelectedBrands((prev) =>
      prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b],
    )

  return (
    <div className="container-x py-8">
      <Breadcrumbs
        items={[
          { label: 'Home', to: '/' },
          { label: 'Categories', to: '/categories' },
          { label: category.name },
        ]}
      />
      <div className="mt-4 flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900">{category.name}</h1>
        <p className="text-slate-500">{category.blurb}</p>
      </div>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row">
        {/* Filters */}
        <aside className="lg:w-64 lg:shrink-0">
          <div className="card sticky top-32 p-4">
            <h3 className="text-sm font-bold text-slate-900">Filters</h3>

            <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-300"
              />
              In stock only
            </label>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Brand</p>
              <div className="mt-2 max-h-56 space-y-1.5 overflow-y-auto pr-1">
                {brands.map((b) => (
                  <label key={b} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(b)}
                      onChange={() => toggleBrand(b)}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-300"
                    />
                    {b}
                  </label>
                ))}
              </div>
            </div>

            {(inStockOnly || selectedBrands.length > 0) && (
              <button
                onClick={() => { setInStockOnly(false); setSelectedBrands([]) }}
                className="btn-outline mt-4 w-full"
              >
                Clear filters
              </button>
            )}
          </div>
        </aside>

        {/* Products */}
        <div className="flex-1">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              {filtered.length} {filtered.length === 1 ? 'product' : 'products'}
            </p>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-slate-500">Sort:</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400"
              >
                {Object.entries(SORTS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </label>
          </div>

          {filtered.length === 0 ? (
            <div className="card p-10 text-center text-slate-500">
              No products match your filters.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {filtered.map((p) => (
                <ProductCard key={p.sku} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
