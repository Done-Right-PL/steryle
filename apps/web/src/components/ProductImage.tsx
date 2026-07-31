import Image from 'next/image'
import type { Product } from '@stryle/core'
import { CategoryIcon } from './Icons'
import { iconForCategory } from '@/lib/category-icons'

interface Props {
  product: Product
  /** Rendered width/height hint passed to next/image. */
  sizes?: string
  priority?: boolean
  className?: string
}

/**
 * Product photography is the only colour in the interface, so it always sits on
 * a neutral plate with padding and is contained rather than cropped.
 */
export function ProductImage({ product, sizes = '25vw', priority, className }: Props) {
  const src = product.images[0]

  if (!src) {
    return (
      <div className={`photo-plate grid place-items-center ${className ?? ''}`}>
        <CategoryIcon
          name={iconForCategory(product.categorySlug)}
          width={40}
          height={40}
          className="text-ink-300"
        />
      </div>
    )
  }

  return (
    <div className={`photo-plate ${className ?? ''}`}>
      <Image
        src={src}
        alt={product.name}
        fill
        sizes={sizes}
        priority={priority}
        className="object-contain p-5 mix-blend-multiply"
      />
    </div>
  )
}
