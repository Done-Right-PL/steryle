import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import ProductCard from '../components/ProductCard'
import { searchProducts } from '../data/catalog'

export default function SearchPage() {
  const [params] = useSearchParams()
  const q = params.get('q') || ''
  const results = useMemo(() => searchProducts(q), [q])

  return (
    <div className="container-x py-8">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: `Search: "${q}"` }]} />
      <h1 className="mt-4 text-2xl font-bold text-slate-900">
        Search results for “{q}”
      </h1>
      <p className="mt-1 text-slate-500">{results.length} products found</p>

      {results.length === 0 ? (
        <div className="card mt-8 p-10 text-center">
          <p className="text-slate-600">No products matched your search.</p>
          <Link to="/categories" className="btn-primary mt-4">Browse all categories</Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {results.map((p) => (
            <ProductCard key={p.sku} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}
