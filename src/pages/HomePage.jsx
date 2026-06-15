import { Link } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import { CategoryIcon, Icon } from '../components/Icons'
import ProductCard from '../components/ProductCard'
import { bestSellers, categories, featuredProducts } from '../data/catalog'

const TRUST = [
  { icon: 'truck', title: 'Fast pan-India delivery', text: 'Dispatched in 24–48 hrs' },
  { icon: 'shield', title: 'Genuine & certified', text: 'Medical-grade quality' },
  { icon: 'tag', title: 'Best bulk pricing', text: 'Hospital & clinic rates' },
  { icon: 'headset', title: 'Expert support', text: 'Mon–Sat, 9am–7pm' },
]

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="border-b border-slate-100 bg-gradient-to-br from-white via-brand-50/40 to-emerald-50/50">
        <div className="container-x grid gap-8 py-12 lg:grid-cols-2 lg:py-16">
          <div className="flex flex-col justify-center">
            <span className="badge w-fit bg-brand-50 text-brand-700 ring-1 ring-brand-100">India's surgical supply store</span>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl lg:text-5xl">
              Everything your clinic needs, <span className="text-brand-600">in one</span> <span className="text-accent-600">place.</span>
            </h1>
            <p className="mt-4 max-w-lg text-slate-500">
              Surgical instruments, sutures, disposables, PPE and diagnostics —
              sourced from trusted brands and delivered across India.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/categories" className="btn-primary">
                Shop all categories <Icon.arrow width={18} height={18} />
              </Link>
              <Link to="/category/ppe-and-safety" className="btn-outline">
                Explore PPE
              </Link>
            </div>
            <div className="mt-8 flex gap-8 text-sm">
              <div><p className="text-2xl font-bold text-slate-900">250+</p><p className="text-slate-500">SKUs</p></div>
              <div><p className="text-2xl font-bold text-slate-900">12</p><p className="text-slate-500">Categories</p></div>
              <div><p className="text-2xl font-bold text-slate-900">10</p><p className="text-slate-500">Trusted brands</p></div>
            </div>
          </div>
          <div className="hidden grid-cols-2 gap-3 lg:grid">
            {categories.slice(0, 4).map((c, i) => (
              <Link
                key={c.slug}
                to={`/category/${c.slug}`}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-hover"
              >
                <span className={`grid h-12 w-12 place-items-center rounded-xl ${i % 2 ? 'bg-accent-500/10 text-accent-600' : 'bg-brand-50 text-brand-600'}`}>
                  <CategoryIcon name={c.icon} width={28} height={28} />
                </span>
                <div className="mt-6">
                  <p className="font-semibold text-slate-800">{c.name}</p>
                  <p className="text-sm text-slate-400">{c.productCount} products</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="border-b border-slate-200 bg-white">
        <div className="container-x grid grid-cols-2 gap-4 py-6 lg:grid-cols-4">
          {TRUST.map((t, i) => {
            const Glyph = Icon[t.icon]
            return (
              <div key={t.title} className="flex items-center gap-3">
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${i % 2 ? 'bg-accent-500/10 text-accent-600' : 'bg-brand-50 text-brand-600'}`}>
                  <Glyph width={22} height={22} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{t.title}</p>
                  <p className="text-xs text-slate-500">{t.text}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <div className="container-x py-8">
        <Breadcrumbs items={[{ label: 'Home' }]} />
      </div>

      {/* Categories grid */}
      <section className="container-x">
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-bold text-slate-900">Shop by category</h2>
          <Link to="/categories" className="text-sm font-semibold text-brand-700 hover:underline">View all</Link>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((c, i) => (
            <Link
              key={c.slug}
              to={`/category/${c.slug}`}
              className="card group flex flex-col items-center gap-3 p-5 text-center transition hover:-translate-y-0.5 hover:shadow-hover"
            >
              <span className={`grid h-14 w-14 place-items-center rounded-full transition ${i % 2 ? 'bg-accent-500/10 text-accent-600 group-hover:bg-accent-600 group-hover:text-white' : 'bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white'}`}>
                <CategoryIcon name={c.icon} width={26} height={26} />
              </span>
              <span className="text-sm font-semibold text-slate-700">{c.name}</span>
              <span className="text-xs text-slate-400">{c.productCount} items</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured deals */}
      <section className="container-x mt-12">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Top deals</h2>
            <p className="text-sm text-slate-500">Biggest savings across categories</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {featuredProducts.map((p) => (
            <ProductCard key={p.sku} product={p} />
          ))}
        </div>
      </section>

      {/* Promo banner */}
      <section className="container-x mt-12">
        <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-accent-600 to-accent-500 px-6 py-10 text-white sm:px-10">
          <div className="max-w-xl">
            <h3 className="text-2xl font-bold">Bulk orders for hospitals & clinics</h3>
            <p className="mt-2 text-white/90">
              Get volume pricing, GST invoicing and a dedicated account manager.
              Save up to 25% on recurring supply contracts.
            </p>
            <Link to="/account" className="btn mt-5 bg-white text-accent-600 hover:bg-emerald-50">
              Request a quote <Icon.arrow width={18} height={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Best sellers */}
      <section className="container-x mt-12">
        <h2 className="text-xl font-bold text-slate-900">Best sellers</h2>
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {bestSellers.map((p) => (
            <ProductCard key={p.sku} product={p} />
          ))}
        </div>
      </section>
    </div>
  )
}
