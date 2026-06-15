import { Link } from 'react-router-dom'
import { formatINR } from '../data/catalog'
import { useCart } from '../context/CartContext'
import { Icon } from './Icons'
import ProductImage from './ProductImage'
import Rating from './Rating'

export default function ProductCard({ product }) {
  const { addItem } = useCart()

  return (
    <div className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-hover">
      <Link to={`/product/${product.slug}`} className="block">
        <div className="relative">
          <ProductImage product={product} className="aspect-[4/3] w-full" iconSize={56} />
          {product.discountPct > 0 && (
            <span className="badge absolute left-2 top-2 bg-rose-500 text-white">
              {product.discountPct}% OFF
            </span>
          )}
          {!product.inStock && (
            <span className="badge absolute right-2 top-2 bg-slate-700 text-white">
              Out of stock
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-3.5">
        <p className="text-[11px] font-medium uppercase tracking-wide text-brand-600">
          {product.brand}
        </p>
        <Link
          to={`/product/${product.slug}`}
          className="mt-0.5 line-clamp-2 text-sm font-semibold text-slate-800 hover:text-brand-700"
        >
          {product.name}
        </Link>

        <div className="mt-1.5">
          <Rating value={product.rating} reviews={product.reviews} />
        </div>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-bold text-slate-900">{formatINR(product.price)}</span>
          {product.mrp > product.price && (
            <span className="text-xs text-slate-400 line-through">{formatINR(product.mrp)}</span>
          )}
        </div>

        <button
          type="button"
          disabled={!product.inStock}
          onClick={() => addItem(product, 1)}
          className="btn mt-3 w-full border border-slate-900 bg-white text-slate-900 hover:bg-slate-50"
        >
          <Icon.cart width={16} height={16} />
          {product.inStock ? 'Add to cart' : 'Notify me'}
        </button>
      </div>
    </div>
  )
}
