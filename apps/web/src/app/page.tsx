import Link from 'next/link'
import { bestSellers, categories, featuredProducts, products, topBrands } from '@stryle/core'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { ProductGrid } from '@/components/ProductCard'
import { CategoryIcon, Icon } from '@/components/Icons'

const TRUST = [
  { icon: 'truck' as const, title: 'Fast pan-India delivery', text: 'Dispatched in 24–48 hrs' },
  { icon: 'shield' as const, title: 'Genuine & certified', text: 'Medical-grade quality' },
  { icon: 'tag' as const, title: 'Best bulk pricing', text: 'Hospital & clinic rates' },
  { icon: 'headset' as const, title: 'Expert support', text: 'Mon–Sat, 9am–7pm' },
]

/** Alternating blue/teal tile so icon grids read as a rhythm, not a rainbow. */
const tile = (i: number) =>
  i % 2 ? 'bg-accent-500/10 text-accent-600' : 'bg-brand-50 text-brand-600'

export default function HomePage() {
  return (
    <div>
      <section className="border-b border-paper-100 bg-gradient-to-br from-white via-brand-50/40 to-accent-50/50">
        <div className="container-x grid gap-8 py-12 lg:grid-cols-2 lg:py-16">
          <div className="flex flex-col justify-center">
            <span className="badge w-fit bg-brand-50 text-brand-700 ring-1 ring-brand-100">
              India&apos;s surgical supply store
            </span>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight text-ink-900 sm:text-4xl lg:text-5xl">
              Everything your clinic needs, <span className="text-brand-600">in one</span>{' '}
              <span className="text-accent-600">place.</span>
            </h1>
            <p className="mt-4 max-w-lg text-ink-500">
              Surgical instruments, sutures, disposables, PPE and diagnostics — sourced from
              trusted brands and delivered across India.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/categories" className="btn-primary">
                Shop all categories <Icon.arrow width={18} height={18} />
              </Link>
              <Link href="/category/protective-equipments-ppe" className="btn-outline">
                Explore PPE
              </Link>
            </div>
            <div className="mt-8 flex gap-8 text-sm">
              {[
                [products.length.toLocaleString('en-IN'), 'SKUs'],
                [categories.length, 'Categories'],
                [`${topBrands.length}+`, 'Trusted brands'],
              ].map(([value, label]) => (
                <div key={label}>
                  <p className="text-2xl font-bold text-ink-900">{value}</p>
                  <p className="text-ink-500">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden grid-cols-2 gap-3 lg:grid">
            {categories.slice(0, 4).map((c, i) => (
              <Link
                key={c.slug}
                href={`/category/${c.slug}`}
                className="group flex flex-col justify-between rounded-2xl border border-paper-200
                  bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-hover"
              >
                <span className={`grid h-12 w-12 place-items-center rounded-xl ${tile(i)}`}>
                  <CategoryIcon name={c.icon} width={28} height={28} />
                </span>
                <div className="mt-6">
                  <p className="font-semibold text-ink-800">{c.name}</p>
                  <p className="text-sm text-ink-400">{c.productCount} products</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-paper-200 bg-white">
        <div className="container-x grid grid-cols-2 gap-4 py-6 lg:grid-cols-4">
          {TRUST.map((t, i) => {
            const Glyph = Icon[t.icon]
            return (
              <div key={t.title} className="flex items-center gap-3">
                <span
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${tile(i)}`}
                >
                  <Glyph width={22} height={22} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink-800">{t.title}</p>
                  <p className="text-xs text-ink-500">{t.text}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <div className="container-x py-8">
        <Breadcrumbs trail={[]} />
      </div>

      <section className="container-x">
        <SectionHeader title="Shop by category" href="/categories" cta="View all" />
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((c, i) => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              className="card group flex flex-col items-center gap-3 p-5 text-center
                transition hover:-translate-y-0.5 hover:shadow-hover"
            >
              <span
                className={`grid h-14 w-14 place-items-center rounded-full transition ${
                  i % 2
                    ? 'bg-accent-500/10 text-accent-600 group-hover:bg-accent-600 group-hover:text-white'
                    : 'bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white'
                }`}
              >
                <CategoryIcon name={c.icon} width={26} height={26} />
              </span>
              <span className="text-sm font-semibold text-ink-700">{c.name}</span>
              <span className="text-xs text-ink-400">{c.productCount} items</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-x mt-12">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold text-ink-900">Top deals</h2>
            <p className="text-sm text-ink-500">Biggest savings across categories</p>
          </div>
        </div>
        <div className="mt-5">
          <ProductGrid products={featuredProducts.slice(0, 8)} />
        </div>
      </section>

      <section className="container-x mt-12">
        <SectionHeader title="Best sellers" href="/categories" cta="Browse all" />
        <div className="mt-5">
          <ProductGrid products={bestSellers.slice(0, 8)} />
        </div>
      </section>

      <section className="container-x mt-14">
        <div className="rounded-2xl bg-gradient-to-r from-brand-600 to-accent-600 p-8 text-center text-white lg:p-12">
          <h2 className="mx-auto max-w-2xl text-2xl font-extrabold leading-tight lg:text-3xl">
            Ordering for a hospital, clinic or pharmacy?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-white/85">
            Get contract pricing, a dedicated account manager and consolidated monthly invoicing.
          </p>
          <Link
            href="/account"
            className="btn mt-6 h-11 bg-white px-5 text-brand-700 hover:bg-brand-50"
          >
            Request a quote
          </Link>
        </div>
      </section>
    </div>
  )
}

function SectionHeader({ title, href, cta }: { title: string; href: string; cta: string }) {
  return (
    <div className="flex items-end justify-between">
      <h2 className="text-xl font-bold text-ink-900">{title}</h2>
      <Link href={href} className="text-sm font-semibold text-brand-700 hover:underline">
        {cta}
      </Link>
    </div>
  )
}
