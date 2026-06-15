import { Link } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import { CategoryIcon, Icon } from '../components/Icons'
import { categories } from '../data/catalog'

export default function CategoriesPage() {
  return (
    <div className="container-x py-8">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'All Categories' }]} />
      <h1 className="mt-4 text-2xl font-bold text-slate-900">All Categories</h1>
      <p className="mt-1 text-slate-500">
        Browse our full range of surgical and medical supplies across {categories.length} categories.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c, i) => (
          <Link
            key={c.slug}
            to={`/category/${c.slug}`}
            className="card group flex items-start gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-hover"
          >
            <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-xl transition ${i % 2 ? 'bg-accent-500/10 text-accent-600 group-hover:bg-accent-600 group-hover:text-white' : 'bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white'}`}>
              <CategoryIcon name={c.icon} width={28} height={28} />
            </span>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-slate-900 group-hover:text-brand-700">{c.name}</h2>
                <Icon.arrow width={18} height={18} className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-brand-600" />
              </div>
              <p className="mt-1 text-sm text-slate-500">{c.blurb}</p>
              <span className="mt-2 inline-block text-xs font-semibold text-brand-600">{c.productCount} products</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
