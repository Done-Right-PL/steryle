import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import { Icon } from '../components/Icons'
import ProductCard from '../components/ProductCard'
import ProductImage from '../components/ProductImage'
import Rating from '../components/Rating'
import { useCart } from '../context/CartContext'
import { formatINR, getProductBySlug, getRelatedProducts } from '../data/catalog'
import { getProductGallery } from '../data/images'

export default function ProductPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const product = getProductBySlug(slug)
  const { addItem } = useCart()
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const [activeImg, setActiveImg] = useState(0)

  if (!product) {
    return (
      <div className="container-x py-16 text-center">
        <h1 className="text-2xl font-bold">Product not found</h1>
        <Link to="/categories" className="btn-primary mt-4">Browse categories</Link>
      </div>
    )
  }

  const related = getRelatedProducts(product)
  const gallery = getProductGallery(product)

  const handleAdd = () => {
    addItem(product, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  const buyNow = () => {
    addItem(product, qty)
    navigate('/cart')
  }

  return (
    <div className="container-x py-8">
      <Breadcrumbs
        items={[
          { label: 'Home', to: '/' },
          { label: 'Categories', to: '/categories' },
          { label: product.category, to: `/category/${product.categorySlug}` },
          { label: product.name },
        ]}
      />

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <ProductImage
            product={product}
            src={gallery[activeImg]}
            showSku={false}
            className="aspect-square w-full rounded-2xl border border-slate-200"
            iconSize={120}
          />
          <div className="mt-3 grid grid-cols-4 gap-3">
            {gallery.map((url, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveImg(i)}
                className={`overflow-hidden rounded-lg border transition ${activeImg === i ? 'border-brand-500 ring-2 ring-brand-200' : 'border-slate-200 hover:border-brand-300'}`}
              >
                <ProductImage
                  product={product}
                  src={url}
                  showSku={false}
                  className="aspect-square w-full"
                  iconSize={32}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">{product.brand}</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{product.name}</h1>
          <div className="mt-2 flex items-center gap-3">
            <Rating value={product.rating} reviews={product.reviews} size={16} />
            <span className="text-sm text-slate-400">SKU: {product.sku}</span>
          </div>

          <div className="mt-4 flex items-end gap-3">
            <span className="text-3xl font-extrabold text-slate-900">{formatINR(product.price)}</span>
            {product.mrp > product.price && (
              <>
                <span className="text-lg text-slate-400 line-through">{formatINR(product.mrp)}</span>
                <span className="badge bg-rose-100 text-rose-700">{product.discountPct}% OFF</span>
              </>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-400">Inclusive of all taxes · {product.unit}</p>

          <div className="mt-4">
            {product.inStock ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
                <Icon.check width={16} height={16} /> In stock — ships in 24–48 hours
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-rose-600">
                Out of stock — restocking soon
              </span>
            )}
          </div>

          {/* Quantity + actions */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center rounded-lg border border-slate-300">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-11 w-11 place-items-center text-slate-600 hover:bg-slate-50">
                <Icon.minus width={18} height={18} />
              </button>
              <span className="w-10 text-center text-sm font-semibold">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="grid h-11 w-11 place-items-center text-slate-600 hover:bg-slate-50">
                <Icon.plus width={18} height={18} />
              </button>
            </div>
            <button onClick={handleAdd} disabled={!product.inStock} className="btn-outline min-w-40 flex-1">
              {added ? (<><Icon.check width={18} height={18} /> Added</>) : (<><Icon.cart width={18} height={18} /> Add to cart</>)}
            </button>
            <button onClick={buyNow} disabled={!product.inStock} className="btn-primary min-w-40 flex-1">
              Buy now
            </button>
          </div>

          {/* Delivery assurances */}
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            {[
              { icon: 'truck', t: 'Free over ₹999' },
              { icon: 'shield', t: 'Genuine product' },
              { icon: 'tag', t: 'GST invoice' },
            ].map(({ icon, t }) => {
              const G = Icon[icon]
              return (
                <div key={t} className="card flex flex-col items-center gap-1 p-3 text-xs text-slate-600">
                  <G width={20} height={20} className="text-brand-600" />
                  {t}
                </div>
              )
            })}
          </div>

          {/* Highlights */}
          <div className="mt-6">
            <h3 className="text-sm font-bold text-slate-900">Highlights</h3>
            <ul className="mt-2 space-y-1.5">
              {product.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <Icon.check width={16} height={16} className="mt-0.5 shrink-0 text-emerald-500" />
                  {h}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Description & specs */}
      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-slate-900">Product description</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">{product.description}</p>
        </div>
        <div className="card p-6">
          <h2 className="text-lg font-bold text-slate-900">Specifications</h2>
          <dl className="mt-3 divide-y divide-slate-100 text-sm">
            {[
              ['Brand', product.brand],
              ['Category', product.category],
              ['Variant', product.variant],
              ['Pack size', product.unit],
              ['SKU', product.sku],
              ['HSN code', product.hsn],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2">
                <dt className="text-slate-500">{k}</dt>
                <dd className="text-right font-medium text-slate-800">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-slate-900">Related products</h2>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.sku} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
