import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  formatINR,
  getProductBySlug,
  getRelatedProducts,
  products as allProducts,
} from '@stryle/core'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { BuyPanel } from '@/components/BuyPanel'
import { Icon } from '@/components/Icons'
import { ProductCard } from '@/components/ProductCard'
import { ProductGallery } from '@/components/ProductGallery'
import { Rating } from '@/components/Rating'

const ASSURANCES = [
  { icon: 'truck' as const, label: 'Free over ₹999' },
  { icon: 'shield' as const, label: 'Genuine product' },
  { icon: 'tag' as const, label: 'GST invoice' },
]

/** Pre-render the most-reviewed products; the rest render on demand. */
export function generateStaticParams() {
  return [...allProducts]
    .sort((a, b) => b.reviews - a.reviews)
    .slice(0, 100)
    .map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = getProductBySlug(slug)
  if (!product) return { title: 'Product not found' }
  return {
    title: product.name,
    description: product.description,
    openGraph: { images: product.images.slice(0, 1) },
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = getProductBySlug(slug)
  if (!product) notFound()

  const related = getRelatedProducts(product, 4)
  const specs: [string, string | number][] = [
    ['Brand', product.brand],
    ['Category', product.category],
    ['Variant', product.variant],
    ['Pack size', product.unit],
    ['SKU', product.sku],
    ['HSN code', product.hsn],
  ]

  return (
    <div className="container-x py-10">
      <Breadcrumbs
        trail={[
          { label: 'Categories', href: '/categories' },
          { label: product.category, href: `/category/${product.categorySlug}` },
          { label: product.name },
        ]}
      />

      <div className="mt-8 grid gap-12 lg:grid-cols-2 lg:gap-20">
        <ProductGallery product={product} />

        <div className="lg:py-4">
          <Link
            href={`/search?q=${encodeURIComponent(product.brand)}`}
            className="text-xs font-semibold uppercase tracking-wide text-brand-600 hover:text-brand-700"
          >
            {product.brand}
          </Link>
          <h1 className="mt-2 text-2xl font-extrabold leading-tight text-ink-900 lg:text-3xl">
            {product.name}
          </h1>

          <div className="mt-3 flex items-center gap-4">
            <Rating value={product.rating} reviews={product.reviews} />
            <span className="text-xs text-ink-400">SKU: {product.sku}</span>
          </div>

          <div className="mt-5 flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-extrabold text-ink-900">
              {formatINR(product.price)}
            </span>
            {product.mrp > product.price && (
              <>
                <span className="text-base text-ink-400 line-through">
                  {formatINR(product.mrp)}
                </span>
                <span className="badge bg-danger-100 text-danger-700">
                  {product.discountPct}% OFF
                </span>
              </>
            )}
          </div>
          <p className="mt-1 text-xs text-ink-400">Inclusive of all taxes · {product.unit}</p>

          <p className="mt-4 flex items-center gap-2 text-sm font-medium text-success-600">
            <Icon.check width={16} height={16} />
            {product.inStock ? 'In stock — ships in 24–48 hours' : 'Currently restocking'}
          </p>

          <BuyPanel product={product} />

          <div className="mt-5 grid grid-cols-3 gap-3">
            {ASSURANCES.map((item) => {
              const Glyph = Icon[item.icon]
              return (
                <div
                  key={item.label}
                  className="flex flex-col items-center gap-1.5 rounded-lg border border-paper-200 px-2 py-3 text-center"
                >
                  <Glyph width={18} height={18} className="text-brand-600" />
                  <span className="text-[11px] text-ink-500">{item.label}</span>
                </div>
              )
            })}
          </div>

          <section className="mt-8">
            <h2 className="text-sm font-bold text-ink-900">Highlights</h2>
            <ul className="mt-3 space-y-2">
              {product.highlights.map((h) => (
                <li key={h} className="flex gap-2 text-sm leading-relaxed text-ink-600">
                  <Icon.check width={16} height={16} className="mt-0.5 shrink-0 text-success-600" />
                  {h}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-8 border-t border-paper-200 pt-6">
            <h2 className="text-sm font-bold text-ink-900">Description</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-600">{product.description}</p>
          </section>

          <section className="mt-8 border-t border-paper-200 pt-6">
            <h2 className="text-sm font-bold text-ink-900">Specifications</h2>
            <dl className="mt-3 divide-y divide-paper-200 text-sm">
              {specs.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-6 py-2.5">
                  <dt className="text-ink-400">{label}</dt>
                  <dd className="text-right font-medium text-ink-800">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="text-xl font-bold text-ink-900">More in {product.category}</h2>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.sku} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
