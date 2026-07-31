import Link from 'next/link'
import { formatINR, type Product } from '@steryle/core'
import { AddToCartButton } from './AddToCartButton'
import { ProductImage } from './ProductImage'
import { Rating } from './Rating'

interface Props {
  product: Product
  priority?: boolean
}

export function ProductCard({ product, priority }: Props) {
  return (
    <article className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-hover">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative">
          <ProductImage
            product={product}
            priority={priority}
            sizes="(min-width: 1024px) 22vw, (min-width: 640px) 33vw, 50vw"
            className="aspect-[4/3] w-full"
          />
          {product.discountPct > 0 && (
            <span className="badge absolute left-2 top-2 bg-danger-500 text-white">
              {product.discountPct}% OFF
            </span>
          )}
          {!product.inStock && (
            <span className="badge absolute right-2 top-2 bg-ink-700 text-white">
              Out of stock
            </span>
          )}
          <span className="absolute bottom-2 right-2 text-[10px] text-ink-300">{product.sku}</span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-3.5">
        <p className="text-[11px] font-medium uppercase tracking-wide text-brand-600">
          {product.brand}
        </p>
        <h3 className="mt-0.5">
          <Link
            href={`/product/${product.slug}`}
            className="line-clamp-2 text-sm font-semibold text-ink-800 hover:text-brand-700"
          >
            {product.name}
          </Link>
        </h3>

        <div className="mt-1.5">
          <Rating value={product.rating} reviews={product.reviews} />
        </div>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-bold text-ink-900">{formatINR(product.price)}</span>
          {product.mrp > product.price && (
            <span className="text-xs text-ink-400 line-through">{formatINR(product.mrp)}</span>
          )}
        </div>

        <div className="mt-auto pt-3">
          <AddToCartButton product={product} />
        </div>
      </div>
    </article>
  )
}

/** Shared grid wrapper so every listing surface uses identical rhythm. */
export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p, i) => (
        <ProductCard key={p.sku} product={p} priority={i < 4} />
      ))}
    </div>
  )
}
